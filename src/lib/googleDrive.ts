// Google Drive API Utility Functions
import { CONFIG, getConfig } from './config';

// ✅ সব credentials config.ts থেকে আসছে (default)
// ✅ Settings UI থেকেও পরিবর্তন করা যাবে (database override)
// Database settings > config.ts defaults

// Scopes needed for Google Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
];

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
}

/**
 * Get Google config from database or fallback to defaults
 * Call this in async contexts (API routes)
 */
async function getGoogleConfig() {
  try {
    const config = await getConfig();
    return {
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      redirectUri: config.google.redirectUri,
    };
  } catch (error) {
    console.log('Using default Google config');
    return {
      clientId: CONFIG.google.clientId,
      clientSecret: CONFIG.google.clientSecret,
      redirectUri: CONFIG.google.redirectUri,
    };
  }
}

// Generate Google OAuth URL (async - uses database config if available)
export async function getGoogleAuthUrl(state?: string): Promise<string> {
  const { clientId, redirectUri } = await getGoogleConfig();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Generate Google OAuth URL (sync - uses default config)
export function getGoogleAuthUrlSync(state?: string): string {
  const params = new URLSearchParams({
    client_id: CONFIG.google.clientId,
    redirect_uri: CONFIG.google.redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens (async - uses database config)
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens | null> {
  try {
    const { clientId, clientSecret, redirectUri } = await getGoogleConfig();
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token exchange failed:', error);
      return null;
    }

    const data = await response.json();
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return null;
  }
}

// Refresh access token (async - uses database config)
export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: number } | null> {
  try {
    const { clientId, clientSecret } = await getGoogleConfig();
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      return null;
    }

    const data = await response.json();
    
    return {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken(tokens: GoogleTokens): Promise<string | null> {
  // If token expires in more than 5 minutes, use it
  if (tokens.expires_at > Date.now() + 5 * 60 * 1000) {
    return tokens.access_token;
  }

  // Otherwise, refresh the token
  const newTokens = await refreshAccessToken(tokens.refresh_token);
  if (!newTokens) {
    return null;
  }

  return newTokens.access_token;
}

// Create folder in Google Drive
export async function createFolder(accessToken: string, folderName: string, parentFolderId?: string): Promise<string | null> {
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Create folder failed:', error);
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    return null;
  }
}

// Find or create backup folder
export async function ensureBackupFolder(accessToken: string): Promise<string | null> {
  try {
    // Search for existing folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='DokanPOS_Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }
    }

    // Create new folder
    return await createFolder(accessToken, 'DokanPOS_Backups');
  } catch (error) {
    console.error('Error ensuring backup folder:', error);
    return null;
  }
}

// Upload file to Google Drive
export async function uploadFile(
  accessToken: string,
  fileName: string,
  content: string,
  folderId?: string
): Promise<DriveFile | null> {
  try {
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      ...(folderId && { parents: [folderId] }),
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Upload failed:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

// List backup files from Google Drive
export async function listBackupFiles(accessToken: string, folderId?: string): Promise<DriveFile[]> {
  try {
    const query = folderId
      ? `'${folderId}' in parents and mimeType='application/json' and trashed=false`
      : `name contains 'dokan-backup' and mimeType='application/json' and trashed=false`;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&pageSize=50&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('List files failed:', error);
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

// Download file from Google Drive
export async function downloadFile(accessToken: string, fileId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Download failed:', error);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

// Delete file from Google Drive
export async function deleteFile(accessToken: string, fileId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 204;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Get file metadata
export async function getFileMetadata(accessToken: string, fileId: string): Promise<DriveFile | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
}

// Get redirect URI (async - from database config)
export async function getRedirectUri(): Promise<string> {
  const { redirectUri } = await getGoogleConfig();
  return redirectUri;
}
