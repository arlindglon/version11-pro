import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

export async function GET() {
  try {
    console.log('Fetching products from Supabase...');
    
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    console.log('Supabase response:', { data: data?.length, error });
    
    if (error) {
      console.error('Fetch products error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('No products found, returning empty array');
      return NextResponse.json([]);
    }

    // Map snake_case DB columns to camelCase for frontend
    const products = data.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      purchasePrice: p.purchase_price || 0,
      salePrice: p.sale_price || 0,
      stock: p.stock || 0,
      minStock: p.min_stock || 5,
      barcode: p.barcode,
      batchNumber: p.batch_number,
      expiryDate: p.expiry_date,
      imageUrl: p.image_url,
      description: p.description,
      isActive: p.is_active,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
    }));
    
    console.log('Returning products:', products.length);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = getLogContext(request);
    
    // Enforce stock = 0 for new products - stock can only increase through purchases
    const productStock = 0;
    
    // Generate a proper UUID for the product
    const productId = generateId();
    
    // Insert with snake_case column names (matching database schema)
    const { data, error } = await supabase
      .from('products')
      .insert([{
        id: productId,
        name: body.name,
        sku: body.sku,
        category: body.category,
        unit: body.unit,
        purchase_price: body.purchasePrice,  // snake_case for DB
        sale_price: body.salePrice,          // snake_case for DB
        stock: productStock,
        min_stock: body.minStock || 5,       // snake_case for DB
        barcode: body.barcode,
        batch_number: body.batchNumber,      // snake_case for DB
        expiry_date: body.expiryDate,        // snake_case for DB
        image_url: body.imageUrl,            // snake_case for DB
        description: body.description,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      throw error;
    }
    
    // Log activity (async, non-blocking)
    logActivity('products', data.id, 'create', null, data, context);
    
    // Return with camelCase for frontend
    return NextResponse.json({
      id: data.id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      unit: data.unit,
      purchasePrice: data.purchase_price,
      salePrice: data.sale_price,
      stock: data.stock,
      minStock: data.min_stock,
      barcode: data.barcode,
      batchNumber: data.batch_number,
      expiryDate: data.expiry_date,
      imageUrl: data.image_url,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product', details: String(error) }, { status: 500 });
  }
}
