import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { CONFIG } from '@/lib/config';

/**
 * Public API for app configuration
 * Returns only non-sensitive config values for frontend use
 */
export async function GET() {
  try {
    // Fetch only public config keys from database
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['app_name', 'app_version', 'production_domain', 'release_year']);
    
    // Build config object with database values or fallback to defaults
    const config = {
      appName: CONFIG.app.name,
      appVersion: CONFIG.app.version,
      productionDomain: CONFIG.app.productionDomain,
      releaseYear: '2024',
    };
    
    // Override with database values if available
    if (data && !error) {
      data.forEach(item => {
        if (item.key === 'app_name') config.appName = item.value;
        if (item.key === 'app_version') config.appVersion = item.value;
        if (item.key === 'production_domain') config.productionDomain = item.value;
        if (item.key === 'release_year') config.releaseYear = item.value;
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('App config fetch error:', error);
    
    // Return default config on error
    return NextResponse.json({
      appName: CONFIG.app.name,
      appVersion: CONFIG.app.version,
      productionDomain: CONFIG.app.productionDomain,
      releaseYear: '2024',
    });
  }
}
