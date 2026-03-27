import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // Try to get a product and check if imageUrl column exists
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        hasImageUrl: false 
      }, { status: 500 });
    }

    const columns = data ? Object.keys(data) : [];
    const hasImageUrl = columns.some(col => 
      col.toLowerCase() === 'imageurl' || col.toLowerCase() === 'image_url'
    );
    
    return NextResponse.json({ 
      columns,
      hasImageUrl,
      hasImageUrlColumn: hasImageUrl
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      hasImageUrl: false 
    }, { status: 500 });
  }
}
