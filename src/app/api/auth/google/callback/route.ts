import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getRedirectUri } from '@/lib/googleDrive';
import { supabase } from '@/lib/db';
import { CONFIG, getConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('OAuth callback received:', { code: !!code, error, state });

    // ✅ Try to get config from database first, fallback to defaults
    let redirectUri: string;
    try {
      const config = await getConfig();
      redirectUri = config.google.redirectUri;
    } catch {
      redirectUri = CONFIG.google.redirectUri;
    }
    
    const baseUrl = redirectUri.replace('/api/auth/google/callback', '');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${baseUrl}/?google_auth=error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/?google_auth=error&message=no_code`
      );
    }

    // Exchange code for tokens (uses database config if available)
    const tokens = await exchangeCodeForTokens(code);
    console.log('Tokens received:', tokens ? 'yes' : 'no');

    if (!tokens) {
      return NextResponse.redirect(
        `${baseUrl}/?google_auth=error&message=token_exchange_failed`
      );
    }

    // Get user ID from state (we'll pass it during auth)
    const userId = state || 'default';

    // Store tokens in database - try insert first, then update
    const { error: insertError } = await supabase
      .from('google_tokens')
      .insert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        token_type: tokens.token_type,
      });

    if (insertError) {
      console.log('Insert failed, trying update:', insertError.message);
      
      // Try update if insert fails (duplicate key)
      const { error: updateError } = await supabase
        .from('google_tokens')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          token_type: tokens.token_type,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Update also failed:', updateError);
        return NextResponse.redirect(
          `${baseUrl}/?google_auth=error&message=${encodeURIComponent(updateError.message)}`
        );
      }
    }

    console.log('Tokens stored successfully for user:', userId);

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${baseUrl}/?google_auth=success`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Fallback to default config for redirect
    let baseUrl: string;
    try {
      const config = await getConfig();
      baseUrl = config.google.redirectUri.replace('/api/auth/google/callback', '');
    } catch {
      baseUrl = CONFIG.google.redirectUri.replace('/api/auth/google/callback', '');
    }
    
    return NextResponse.redirect(
      `${baseUrl}/?google_auth=error&message=${encodeURIComponent(String(error))}`
    );
  }
}
