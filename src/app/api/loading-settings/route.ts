import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

/**
 * Fast endpoint for loading screen settings
 * Returns only essential data for the loading screen
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('shopName, shopLogo, shopBio, loadingText')
      .limit(1)
      .single();

    if (error) {
      console.error('Fetch loading settings error:', error);
      return NextResponse.json({
        shopName: 'Dokan',
        shopLogo: '',
        shopBio: 'Smart Shop Management',
        loadingText: 'Loading...',
      });
    }

    return NextResponse.json({
      shopName: data.shopName || 'Dokan',
      shopLogo: data.shopLogo || '',
      shopBio: data.shopBio || 'Smart Shop Management',
      loadingText: data.loadingText || 'Loading...',
    });
  } catch (error) {
    console.error('Loading settings error:', error);
    return NextResponse.json({
      shopName: 'Dokan',
      shopLogo: '',
      shopBio: 'Smart Shop Management',
      loadingText: 'Loading...',
    });
  }
}
