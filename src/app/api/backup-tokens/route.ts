import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import crypto from 'crypto';

// Table name for API tokens
const TOKENS_TABLE = 'backup_api_tokens';

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Calculate expiry date
function calculateExpiry(days: number | null): string | null {
  if (days === null || days === 0) return null; // Lifetime
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

// GET - List all tokens or verify a token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const token = searchParams.get('token');
    const backupType = searchParams.get('backupType') as 'daily' | 'monthly' | 'full' | null;

    // Verify token action
    if (action === 'verify' && token && backupType) {
      const { data: tokenData, error } = await supabase
        .from(TOKENS_TABLE)
        .select('*')
        .eq('token', token)
        .eq('backup_type', backupType)
        .eq('is_active', true)
        .single();

      if (error || !tokenData) {
        return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
      }

      // Check expiry
      if (tokenData.expires_at) {
        const expiresAt = new Date(tokenData.expires_at);
        if (expiresAt < new Date()) {
          // Token expired - deactivate it
          await supabase
            .from(TOKENS_TABLE)
            .update({ is_active: false })
            .eq('id', tokenData.id);
          
          return NextResponse.json({ valid: false, error: 'Token expired' }, { status: 401 });
        }
      }

      // Update last used
      await supabase
        .from(TOKENS_TABLE)
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      return NextResponse.json({ 
        valid: true, 
        token: {
          id: tokenData.id,
          name: tokenData.name,
          backupType: tokenData.backup_type,
          createdAt: tokenData.created_at,
        }
      });
    }

    // List all tokens
    const { data: tokens, error } = await supabase
      .from(TOKENS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array with SQL
      if (error.code === '42P01') {
        return NextResponse.json({ 
          tokens: [],
          tableExists: false,
          createTableSQL: `
CREATE TABLE backup_api_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('daily', 'monthly', 'full', 'all')),
  validity_days INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);
          `
        });
      }
      console.error('Error fetching tokens:', error);
      return NextResponse.json({ tokens: [] });
    }

    // Mask tokens for security
    const maskedTokens = (tokens || []).map((t: { token: string; [key: string]: unknown }) => ({
      ...t,
      token: t.token ? `${t.token.substring(0, 8)}...${t.token.substring(t.token.length - 4)}` : '',
    }));

    return NextResponse.json({ tokens: maskedTokens, tableExists: true });
  } catch (error) {
    console.error('Token GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, backupType, validityDays, createdBy } = body;

    if (!name || !backupType) {
      return NextResponse.json({ 
        error: 'Name and backup type are required' 
      }, { status: 400 });
    }

    if (!['daily', 'monthly', 'full', 'all'].includes(backupType)) {
      return NextResponse.json({ 
        error: 'Invalid backup type. Use: daily, monthly, full, or all' 
      }, { status: 400 });
    }

    const token = generateToken();
    const expiresAt = calculateExpiry(validityDays || null);
    const id = crypto.randomUUID();

    const { error } = await supabase
      .from(TOKENS_TABLE)
      .insert({
        id,
        name,
        token,
        backup_type: backupType,
        validity_days: validityDays || null,
        expires_at: expiresAt,
        is_active: true,
        created_by: createdBy || 'master-admin',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating token:', error);
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table not found. Please create the table first.',
          createTableSQL: `
CREATE TABLE backup_api_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('daily', 'monthly', 'full', 'all')),
  validity_days INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);
          `
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    // Return the full token (only time it's shown)
    return NextResponse.json({
      success: true,
      token: {
        id,
        name,
        token, // Full token - save this!
        backupType,
        validityDays: validityDays || null,
        expiresAt,
        isLifetime: validityDays === null || validityDays === 0,
      },
      message: 'Token created successfully. Save this token - it will not be shown again!',
    });
  } catch (error) {
    console.error('Token POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a token
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from(TOKENS_TABLE)
      .delete()
      .eq('id', tokenId);

    if (error) {
      console.error('Error deleting token:', error);
      return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update token (deactivate/activate)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, isActive } = body;

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from(TOKENS_TABLE)
      .update({ is_active: isActive })
      .eq('id', tokenId);

    if (error) {
      console.error('Error updating token:', error);
      return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
