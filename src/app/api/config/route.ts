import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { clearConfigCache } from '@/lib/config';

// GET - Fetch all configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const publicOnly = searchParams.get('public') === 'true';
    
    let query = supabase
      .from('app_config')
      .select('*')
      .order('category')
      .order('key');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // For public requests, only return non-secret values
    if (publicOnly) {
      query = query.eq('is_secret', false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // If table doesn't exist, return default config
      if (error.message.includes('does not exist')) {
        return NextResponse.json({ 
          config: getDefaultConfig(),
          usingDefaults: true 
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform to key-value object
    const config: Record<string, string> = {};
    const configByCategory: Record<string, Array<{ key: string; value: string; description: string; is_secret: boolean }>> = {};
    
    data?.forEach(item => {
      config[item.key] = item.value;
      if (!configByCategory[item.category]) {
        configByCategory[item.category] = [];
      }
      configByCategory[item.category].push({
        key: item.key,
        value: item.is_secret && !publicOnly ? '••••••••' : item.value,
        description: item.description || '',
        is_secret: item.is_secret,
      });
    });
    
    return NextResponse.json({ 
      config,
      configByCategory,
      raw: data,
      usingDefaults: false 
    });
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, category, description, is_secret } = body;
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
    }
    
    // Upsert the configuration
    const { data, error } = await supabase
      .from('app_config')
      .upsert({
        key,
        value,
        category: category || 'general',
        description: description || '',
        is_secret: is_secret || false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // ✅ Clear the config cache so changes take effect immediately
    clearConfigCache();
    
    console.log(`Config updated: ${key} = ${is_secret ? '***' : value}`);
    
    return NextResponse.json({ 
      success: true, 
      key, 
      value: is_secret ? '***' : value,
      data 
    });
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('app_config')
      .delete()
      .eq('key', key);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // ✅ Clear the config cache so changes take effect immediately
    clearConfigCache();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Default config fallback
export function getDefaultConfig() {
  return {
    supabase_url: 'https://efyctxelttimqprmnskl.supabase.co',
    supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeWN0eGVsdHRpbXFwcm1uc2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQyNTY3OCwiZXhwIjoyMDkwMDAxNjc4fQ.jXPNpbGbz2DzqWY1vTiFTy20-9gJxMs72gPZy9CpjLs',
    google_client_id: '',
    google_client_secret: '',
    google_redirect_uri: 'https://shopclient1.vercel.app/api/auth/google/callback',
    app_name: ' POS Premium ',
    app_version: 'v10.1.0',
    production_domain: 'https://shopclient1.vercel.app',
  };
}

// Public config keys that are safe to expose to frontend
export const PUBLIC_CONFIG_KEYS = [
  'app_name',
  'app_version',
  'production_domain',
];
