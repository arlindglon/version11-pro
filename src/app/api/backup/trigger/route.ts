import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import crypto from 'crypto';

// Tables to backup
const BACKUP_TABLES = [
  'users',
  'products',
  'customers',
  'suppliers',
  'sales',
  'purchases',
  'expenses',
  'categories',
  'settings',
  'stock_adjustments',
  'cash_registers',
  'cash_transactions',
  'audit_logs',
  'print_templates',
  'backup_history',
  'app_config',
];

// Generate a secure API key if not set in environment
const BACKUP_API_KEY = process.env.BACKUP_API_KEY || 'dokan-backup-secure-key-2024';

// Rate limiting - store last request times
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between requests per IP

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Security: Verify API key (master key)
function verifyApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  
  // Constant-time comparison to prevent timing attacks
  try {
    const providedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const expectedKey = crypto.createHash('sha256').update(BACKUP_API_KEY).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(providedKey, 'hex'), Buffer.from(expectedKey, 'hex'));
  } catch {
    return false;
  }
}

// Security: Verify token from database
async function verifyToken(token: string | null, backupType: string): Promise<{ valid: boolean; name?: string }> {
  if (!token) return { valid: false };
  
  try {
    const { data: tokenData, error } = await supabase
      .from('backup_api_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !tokenData) {
      return { valid: false };
    }

    // Check if token type matches (or is 'all')
    if (tokenData.backup_type !== 'all' && tokenData.backup_type !== backupType) {
      return { valid: false };
    }

    // Check expiry
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        // Token expired - deactivate it
        await supabase
          .from('backup_api_tokens')
          .update({ is_active: false })
          .eq('id', tokenData.id);
        
        return { valid: false };
      }
    }

    // Update last used
    await supabase
      .from('backup_api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return { valid: true, name: tokenData.name };
  } catch (e) {
    console.error('Token verification error:', e);
    return { valid: false };
  }
}

// Security: Rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);
  
  if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
    return false; // Rate limited
  }
  
  rateLimitMap.set(ip, now);
  return true; // Allowed
}

// Security: Get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

// Helper to collect all data
async function collectAllData() {
  const backupData: Record<string, unknown[]> = {};
  
  for (const table of BACKUP_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (!error && data) {
        backupData[table] = data;
      }
    } catch (e) {
      console.log(`Table ${table} might not exist, skipping...`);
    }
  }
  
  return backupData;
}

// Helper to create backup and store in history + upload to Google Drive
async function createBackup(backupType: 'daily' | 'monthly' | 'full', userId: string = 'trigger-api', userName: string = 'API Trigger') {
  const backupData = await collectAllData();
  
  const backupMetadata = {
    version: '6.1.0',
    createdAt: new Date().toISOString(),
    createdBy: userName,
    backupType: backupType,
    tables: Object.keys(backupData),
    totalRecords: Object.values(backupData).reduce((acc: number, arr) => acc + (arr as unknown[]).length, 0),
    app: 'Dokan POS Pro',
  };
  
  const fullBackup = {
    metadata: backupMetadata,
    data: backupData,
  };
  
  const backupString = JSON.stringify(fullBackup);
  const fileSize = new Blob([backupString]).size;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `dokan-${backupType}-backup-${timestamp}.json`;
  
  // Store in backup_history
  const { error: insertError } = await supabase
    .from('backup_history')
    .insert({
      user_id: userId,
      file_name: fileName,
      file_size: fileSize,
      backup_type: backupType,
      tables_included: Object.keys(backupData),
      status: 'completed',
    });
  
  if (insertError) {
    console.error('Error saving backup history:', insertError);
  }
  
  // Update last backup time in settings
  const updateField = backupType === 'daily' ? 'last_daily_backup' : 
                      backupType === 'monthly' ? 'last_monthly_backup' : 'last_backup_at';
  
  await supabase
    .from('settings')
    .update({
      [updateField]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', '1');

  // Try to upload to Google Drive if connected
  let cloudUploadSuccess = false;
  let cloudFileId = null;

  try {
    // Check if Google Drive is connected (check google_tokens table)
    const { data: googleTokens, error: tokenError } = await supabase
      .from('google_tokens')
      .select('id, refresh_token')
      .limit(1)
      .single();

    if (!tokenError && googleTokens?.refresh_token) {
      console.log('Google Drive connected, uploading backup...');

      // Import Google Drive functions
      const {
        getValidAccessToken,
        ensureBackupFolder,
        uploadFile,
        GoogleTokens,
      } = await import('@/lib/googleDrive');

      // Get full token data
      const { data: fullTokenData } = await supabase
        .from('google_tokens')
        .select('*')
        .limit(1)
        .single();

      if (fullTokenData) {
        const tokens: GoogleTokens = {
          access_token: fullTokenData.access_token,
          refresh_token: fullTokenData.refresh_token,
          expires_at: fullTokenData.expires_at,
          token_type: fullTokenData.token_type,
        };

        const accessToken = await getValidAccessToken(tokens);

        if (accessToken) {
          // Update tokens in database if they were refreshed
          if (accessToken !== tokens.access_token) {
            await supabase
              .from('google_tokens')
              .update({
                access_token: accessToken,
                updated_at: new Date().toISOString(),
              })
              .eq('id', fullTokenData.id);
          }

          // Ensure backup folder exists
          const folderId = await ensureBackupFolder(accessToken);

          if (folderId) {
            // Upload to Google Drive
            const backupString = JSON.stringify(fullBackup, null, 2);
            const uploadedFile = await uploadFile(accessToken, fileName, backupString, folderId);

            if (uploadedFile) {
              cloudUploadSuccess = true;
              cloudFileId = uploadedFile.id;
              console.log('Backup uploaded to Google Drive:', fileName, 'File ID:', uploadedFile.id);

              // Update backup history with cloud file ID
              await supabase
                .from('backup_history')
                .update({
                  cloud_file_id: uploadedFile.id,
                  cloud_provider: 'google_drive',
                })
                .eq('file_name', fileName);
            } else {
              console.log('Failed to upload file to Google Drive');
            }
          } else {
            console.log('Failed to create/access backup folder');
          }
        } else {
          console.log('Failed to get valid access token');
        }
      }
    } else {
      console.log('Google Drive not connected, skipping cloud upload');
    }
  } catch (cloudError) {
    console.error('Cloud upload error:', cloudError);
    // Continue without cloud upload - local backup is still valid
  }
  
  return {
    success: true,
    backup: {
      fileName,
      fileSize,
      fileSizeFormatted: formatBytes(fileSize),
      tables: Object.keys(backupData),
      totalRecords: backupMetadata.totalRecords,
      createdAt: backupMetadata.createdAt,
      downloadUrl: `data:application/json;base64,${Buffer.from(backupString).toString('base64')}`,
    },
    cloudUpload: {
      success: cloudUploadSuccess,
      fileId: cloudFileId,
    },
  };
}

// GET - Trigger backup via URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'monthly' | 'full' | null;
    const apiKey = searchParams.get('key');
    const token = searchParams.get('token');
    
    // Security: Check either API key OR token
    let isAuthenticated = false;
    let authMethod = '';
    
    if (apiKey && verifyApiKey(apiKey)) {
      isAuthenticated = true;
      authMethod = 'api_key';
    } else if (token && type) {
      const tokenCheck = await verifyToken(token, type);
      if (tokenCheck.valid) {
        isAuthenticated = true;
        authMethod = 'token';
      }
    }
    
    if (!isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid or missing credentials',
        hint: 'Use ?key=MASTER_KEY or ?token=YOUR_TOKEN',
      }, { status: 401 });
    }
    
    // Security: Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json({ 
        error: 'Too many requests - Please wait before trying again',
        retryAfter: '60 seconds',
      }, { status: 429 });
    }
    
    if (!type || !['daily', 'monthly', 'full'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid backup type. Use ?type=daily, ?type=monthly, or ?type=full',
        usage: {
          daily: '/api/backup/trigger?type=daily&token=YOUR_TOKEN',
          monthly: '/api/backup/trigger?type=monthly&token=YOUR_TOKEN',
          full: '/api/backup/trigger?type=full&token=YOUR_TOKEN',
        },
        security: 'Token or API key is required',
      }, { status: 400 });
    }
    
    const result = await createBackup(type);
    
    return NextResponse.json({
      ...result,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} backup created successfully`,
      triggeredAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Backup trigger error:', error);
    return NextResponse.json({ 
      error: 'Failed to create backup',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST - Trigger backup via POST request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, apiKey } = body;
    
    // Security: Check API key
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid or missing API key',
        hint: 'Include "apiKey" in your request body',
      }, { status: 401 });
    }
    
    // Security: Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json({ 
        error: 'Too many requests - Please wait before trying again',
        retryAfter: '60 seconds',
      }, { status: 429 });
    }
    
    if (!type || !['daily', 'monthly', 'full'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid backup type. Use: daily, monthly, or full',
      }, { status: 400 });
    }
    
    const result = await createBackup(type, body.userId, body.userName);
    
    return NextResponse.json({
      ...result,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} backup created successfully`,
      triggeredAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Backup trigger error:', error);
    return NextResponse.json({ 
      error: 'Failed to create backup',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
