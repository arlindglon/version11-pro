/**
 * ================================================
 * 🔧 CENTRAL CONFIGURATION FILE
 * ================================================
 * 
 * এই ফাইলে সব configuration এক জায়গায় আছে।
 * 
 * ✅ Settings থেকেও পরিবর্তন করা যাবে (Master Admin only)
 * ✅ এই ফাইল থেকেও পরিবর্তন করা যাবে
 * ================================================
 */

// Default fallback configuration
// এগুলো ব্যবহার হবে যদি database-এ কোনো value না থাকে
const DEFAULT_CONFIG = {
  // ===========================================
  // 🔐 SUPABASE DATABASE
  // ===========================================
  supabase: {
    url: 'https://efyctxelttimqprmnskl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeWN0eGVsdHRpbXFwcm1uc2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQyNTY3OCwiZXhwIjoyMDkwMDAxNjc4fQ.jXPNpbGbz2DzqWY1vTiFTy20-9gJxMs72gPZy9CpjLs',
  },

  // ===========================================
  // 🔗 GOOGLE DRIVE
  // ===========================================
  google: {
    clientId: '0jl44v62aqoasds37oani4prs1ihggb4.apps.googleusercontent.com',
    clientSecret: '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',
    redirectUri: 'https://shopclient1.vercel.app/api/auth/google/callback',
  },

  // ===========================================
  // 🌐 APP
  // ===========================================
  app: {
    name: 'Dokan POS Pro',
    version: 'v10.1.0',
    productionDomain: 'https://shopclient1.vercel.app/',
  },
};

// Runtime config cache
let cachedConfig: typeof DEFAULT_CONFIG | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get config value from database or fallback to default
 * Call this on server side only!
 */
export async function getConfig(): Promise<typeof DEFAULT_CONFIG> {
  // Return cached config if still valid
  if (cachedConfig && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    // Dynamic import to avoid issues on client side
    const { supabase } = await import('./db');
    
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value');
    
    if (error || !data || data.length === 0) {
      console.log('Using default config (DB not available)');
      return DEFAULT_CONFIG;
    }

    // Build config from database
    const dbConfig: Record<string, string> = {};
    data.forEach(item => {
      dbConfig[item.key] = item.value;
    });

    cachedConfig = {
      supabase: {
        url: dbConfig.supabase_url || DEFAULT_CONFIG.supabase.url,
        anonKey: dbConfig.supabase_anon_key || DEFAULT_CONFIG.supabase.anonKey,
      },
      google: {
        clientId: dbConfig.google_client_id || DEFAULT_CONFIG.google.clientId,
        clientSecret: dbConfig.google_client_secret || DEFAULT_CONFIG.google.clientSecret,
        redirectUri: dbConfig.google_redirect_uri || DEFAULT_CONFIG.google.redirectUri,
      },
      app: {
        name: dbConfig.app_name || DEFAULT_CONFIG.app.name,
        version: dbConfig.app_version || DEFAULT_CONFIG.app.version,
        productionDomain: dbConfig.production_domain || DEFAULT_CONFIG.app.productionDomain,
      },
    };

    lastFetchTime = Date.now();
    return cachedConfig;
  } catch (error) {
    console.log('Using default config (error):', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Clear config cache (call after updating config)
 */
export function clearConfigCache() {
  cachedConfig = null;
  lastFetchTime = 0;
}

// Synchronous config for immediate use (uses defaults)
// For async with DB values, use getConfig() instead
export const CONFIG = DEFAULT_CONFIG;

// Export default for backward compatibility
export default CONFIG;

/*
┌─────────────────────────────────────────────────────────────────┐
│ 📋 CONFIGURATION KEYS (Database)                                │
├─────────────────────┬───────────────────────────────────────────┤
│ Key                 │ Description                               │
├─────────────────────┼───────────────────────────────────────────┤
│ supabase_url        │ Supabase Project URL                      │
│ supabase_anon_key   │ Supabase Anonymous Key                    │
│ google_client_id    │ Google OAuth Client ID                    │
│ google_client_secret│ Google OAuth Client Secret                │
│ google_redirect_uri │ Google OAuth Redirect URI                 │
│ app_name            │ Application Name                          │
│ app_version         │ Application Version                       │
│ production_domain   │ Production Domain URL                     │
└─────────────────────┴───────────────────────────────────────────┘

⚠️ Settings থেকে পরিবর্তন করলে সব জায়গায় effect হবে!
*/
