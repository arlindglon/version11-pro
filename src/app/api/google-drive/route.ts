import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
  getGoogleAuthUrl,
  getValidAccessToken,
  ensureBackupFolder,
  uploadFile,
  listBackupFiles,
  downloadFile,
  deleteFile,
  GoogleTokens,
} from '@/lib/googleDrive';

// Tables to backup for FULL backup
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
  'app_config', // ✅ Support settings, tutorials, FAQs, categories, all config
];

// Tables for DAILY backup (today's data only)
const DAILY_BACKUP_TABLES = [
  'sales',
  'purchases',
  'expenses',
  'stock_adjustments',
  'cash_transactions',
];

// GET - Various Google Drive operations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId') || 'default';

    // Get Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (action === 'auth-url') {
      const authUrl = await getGoogleAuthUrl(userId);
      return NextResponse.json({ authUrl });
    }

    if (action === 'status') {
      const isConnected = !tokenError && tokenData !== null;
      return NextResponse.json({
        connected: isConnected,
        lastConnected: tokenData?.updated_at || null,
      });
    }

    if (action === 'disconnect') {
      if (tokenData) {
        await supabase
          .from('google_tokens')
          .delete()
          .eq('user_id', userId);
      }
      return NextResponse.json({ success: true });
    }

    // For other actions, we need valid tokens
    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 });
    }

    const tokens: GoogleTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      token_type: tokenData.token_type,
    };

    const accessToken = await getValidAccessToken(tokens);
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get valid access token' }, { status: 401 });
    }

    // Update tokens in database if they were refreshed
    if (accessToken !== tokens.access_token) {
      await supabase
        .from('google_tokens')
        .update({
          access_token: accessToken,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    if (action === 'list') {
      const folderId = await ensureBackupFolder(accessToken);
      if (!folderId) {
        return NextResponse.json({ error: 'Failed to access backup folder' }, { status: 500 });
      }

      const files = await listBackupFiles(accessToken, folderId);
      
      // Enhance file info with backup metadata
      const enhancedFiles = files.map(file => ({
        ...file,
        isCloudBackup: true,
        source: 'google_drive',
      }));

      return NextResponse.json({ files: enhancedFiles, folderId });
    }

    if (action === 'download') {
      const fileId = searchParams.get('fileId');
      if (!fileId) {
        return NextResponse.json({ error: 'File ID required' }, { status: 400 });
      }

      const content = await downloadFile(accessToken, fileId);
      if (!content) {
        return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
      }

      return NextResponse.json({ content });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Google Drive GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload backup to Google Drive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId = 'default', userName, backupType = 'monthly' } = body;

    // Get Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 });
    }

    const tokens: GoogleTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      token_type: tokenData.token_type,
    };

    const accessToken = await getValidAccessToken(tokens);
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get valid access token' }, { status: 401 });
    }

    if (action === 'upload') {
      const backupData: Record<string, unknown[]> = {};
      const isDailyBackup = backupType === 'daily';
      const isFullBackup = backupType === 'full'; // Complete system backup
      
      const now = new Date();
      let backupStartTime: Date;
      
      // Determine backup start time based on backup type
      if (isFullBackup) {
        // Full system backup - from beginning of time (all data)
        backupStartTime = new Date(0); // January 1, 1970
      } else if (isDailyBackup) {
        // Smart backup: Get last backup time from backup_history
        const { data: lastBackup } = await supabase
          .from('backup_history')
          .select('created_at')
          .eq('backup_type', 'daily')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastBackup?.created_at) {
          backupStartTime = new Date(lastBackup.created_at);
        } else {
          backupStartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
      } else {
        // Monthly backup: Get last monthly backup time
        const { data: lastBackup } = await supabase
          .from('backup_history')
          .select('created_at')
          .eq('backup_type', 'monthly')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastBackup?.created_at) {
          backupStartTime = new Date(lastBackup.created_at);
        } else {
          backupStartTime = new Date(0); // Beginning of time
        }
      }
      
      const backupStartISO = backupStartTime.toISOString();
      const backupEndISO = now.toISOString();
      
      // Select tables based on backup type
      const tablesToBackup = isDailyBackup ? DAILY_BACKUP_TABLES : BACKUP_TABLES;
      
      for (const table of tablesToBackup) {
        try {
          let query = supabase.from(table).select('*');
          
          // Filter by date range ONLY for daily/monthly, NOT for full backup
          if (!isFullBackup) {
            if (table === 'sales' || table === 'purchases' || table === 'expenses') {
              query = query.gte('created_at', backupStartISO).lte('created_at', backupEndISO);
            } else if (table === 'stock_adjustments') {
              query = query.gte('created_at', backupStartISO).lte('created_at', backupEndISO);
            } else if (table === 'cash_transactions') {
              query = query.gte('created_at', backupStartISO).lte('created_at', backupEndISO);
            }
          }
          // For full backup: get ALL data without date filter
          
          const { data, error } = await query;
          
          if (!error && data) {
            backupData[table] = data;
          }
        } catch {
          console.log(`Table ${table} might not exist, skipping...`);
        }
      }

      // Create backup metadata
      const backupMetadata = {
        version: '6.1.0',
        createdAt: new Date().toISOString(),
        createdBy: userName || 'System',
        tables: Object.keys(backupData),
        totalRecords: Object.values(backupData).reduce((acc: number, arr) => acc + (arr as unknown[]).length, 0),
        app: 'Dokan POS Pro',
        backupType: isFullBackup ? 'full' : (isDailyBackup ? 'daily' : 'monthly'),
        backupPeriod: {
          start: backupStartISO,
          end: backupEndISO,
        },
        description: isFullBackup 
          ? `Complete system backup - ALL data from beginning`
          : (isDailyBackup 
            ? `Daily backup from ${backupStartTime.toLocaleString()} to ${now.toLocaleString()}`
            : `Monthly backup from ${backupStartTime.toLocaleString()} to ${now.toLocaleString()}`),
      };

      const fullBackup = {
        metadata: backupMetadata,
        data: backupData,
      };

      const backupString = JSON.stringify(fullBackup, null, 2);
      const fileSize = new Blob([backupString]).size;

      // Generate filename based on backup type
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const dateStr = now.toISOString().split('T')[0];
      const fileName = isFullBackup 
        ? `dokan-FULL-${timestamp}.json`
        : (isDailyBackup 
          ? `dokan-daily-${dateStr}.json`
          : `dokan-monthly-${timestamp}.json`);

      // Ensure backup folder exists
      const folderId = await ensureBackupFolder(accessToken);
      if (!folderId) {
        return NextResponse.json({ error: 'Failed to create backup folder' }, { status: 500 });
      }

      // Upload to Google Drive
      const uploadedFile = await uploadFile(accessToken, fileName, backupString, folderId);
      if (!uploadedFile) {
        return NextResponse.json({ error: 'Failed to upload backup to Google Drive' }, { status: 500 });
      }

      // Store in backup_history
      await supabase
        .from('backup_history')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_size: fileSize,
          backup_type: isDailyBackup ? 'daily' : 'monthly',
          tables_included: Object.keys(backupData),
          status: 'completed',
          cloud_file_id: uploadedFile.id,
          cloud_provider: 'google_drive',
        });

      return NextResponse.json({
        success: true,
        backup: {
          id: uploadedFile.id,
          fileName,
          fileSize,
          fileSizeFormatted: formatBytes(fileSize),
          tables: Object.keys(backupData),
          totalRecords: backupMetadata.totalRecords,
          createdAt: backupMetadata.createdAt,
          backupType: isDailyBackup ? 'daily' : 'monthly',
          webViewLink: uploadedFile.webViewLink,
        },
      });
    }

    // New action: Upload pre-built backup data (called by backup trigger API)
    if (action === 'upload-backup-data') {
      const { backupData: prebuiltBackupData, fileName: providedFileName, backupType: providedBackupType, userId: providedUserId, userName: providedUserName } = body;
      
      if (!prebuiltBackupData || !prebuiltBackupData.metadata || !prebuiltBackupData.data) {
        return NextResponse.json({ error: 'Invalid backup data provided' }, { status: 400 });
      }

      const backupString = JSON.stringify(prebuiltBackupData, null, 2);
      const fileSize = new Blob([backupString]).size;

      // Use provided filename or generate one
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = providedFileName || `dokan-${providedBackupType || 'api'}-${timestamp}.json`;

      // Ensure backup folder exists
      const folderId = await ensureBackupFolder(accessToken);
      if (!folderId) {
        return NextResponse.json({ error: 'Failed to create backup folder' }, { status: 500 });
      }

      // Upload to Google Drive
      const uploadedFile = await uploadFile(accessToken, fileName, backupString, folderId);
      if (!uploadedFile) {
        return NextResponse.json({ error: 'Failed to upload backup to Google Drive' }, { status: 500 });
      }

      // Update backup history with cloud file ID
      await supabase
        .from('backup_history')
        .update({
          cloud_file_id: uploadedFile.id,
          cloud_provider: 'google_drive',
        })
        .eq('file_name', fileName);

      return NextResponse.json({
        success: true,
        fileId: uploadedFile.id,
        fileName,
        fileSize,
        fileSizeFormatted: formatBytes(fileSize),
        webViewLink: uploadedFile.webViewLink,
        totalRecords: prebuiltBackupData.metadata.totalRecords,
        tables: Object.keys(prebuiltBackupData.data),
      });
    }

    if (action === 'restore') {
      const { fileId } = body;
      
      if (!fileId) {
        return NextResponse.json({ error: 'File ID required' }, { status: 400 });
      }

      // Download from Google Drive
      const content = await downloadFile(accessToken, fileId);
      if (!content) {
        return NextResponse.json({ error: 'Failed to download backup from Google Drive' }, { status: 500 });
      }

      const backupData = JSON.parse(content);
      
      if (!backupData.metadata || !backupData.data) {
        return NextResponse.json({ error: 'Invalid backup data format' }, { status: 400 });
      }

      const results: Record<string, { success: boolean; count: number; error?: string }> = {};

      // Restore each table
      for (const [table, records] of Object.entries(backupData.data)) {
        if (Array.isArray(records) && records.length > 0) {
          try {
            // Handle app_config table specially - use upsert
            if (table === 'app_config') {
              // Upsert each config item by key
              let successCount = 0;
              for (const record of records) {
                const { error: upsertError } = await supabase
                  .from('app_config')
                  .upsert(record, { onConflict: 'key' });
                if (!upsertError) successCount++;
              }
              results[table] = { success: true, count: successCount };
              continue;
            }

            // Delete existing data (except users table)
            if (table !== 'users') {
              await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            }

            // Insert backup data
            const { error: insertError } = await supabase
              .from(table)
              .insert(records);

            if (insertError) {
              results[table] = { success: false, count: 0, error: insertError.message };
            } else {
              results[table] = { success: true, count: records.length };
            }
          } catch (e) {
            results[table] = { success: false, count: 0, error: String(e) };
          }
        }
      }

      return NextResponse.json({
        success: true,
        results,
        restoredAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Google Drive POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete backup from Google Drive
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const userId = searchParams.get('userId') || 'default';

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Get Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 });
    }

    const tokens: GoogleTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      token_type: tokenData.token_type,
    };

    const accessToken = await getValidAccessToken(tokens);
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get valid access token' }, { status: 401 });
    }

    const success = await deleteFile(accessToken, fileId);
    
    if (success) {
      // Also delete from backup_history
      await supabase
        .from('backup_history')
        .delete()
        .eq('cloud_file_id', fileId);
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Google Drive DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
// Force rebuild comment
