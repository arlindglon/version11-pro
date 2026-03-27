import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const context = getLogContext(request);
    
    console.log(`PUT /api/products/${id} - Updating:`, { stock: body.stock });
    
    // Get old data first for logging
    const { data: oldData } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    // Build update data with snake_case for DB
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Only include fields that are provided (camelCase -> snake_case)
    if (body.name !== undefined) updateData.name = body.name;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.purchasePrice !== undefined) updateData.purchase_price = body.purchasePrice;
    if (body.salePrice !== undefined) updateData.sale_price = body.salePrice;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.minStock !== undefined) updateData.min_stock = body.minStock;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.batchNumber !== undefined) updateData.batch_number = body.batchNumber;
    if (body.expiryDate !== undefined) updateData.expiry_date = body.expiryDate;
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`PUT /api/products/${id} - Error:`, error);
      throw error;
    }
    
    // Log activity (async, non-blocking)
    logActivity('products', id, 'update', oldData, data, context);
    
    console.log(`PUT /api/products/${id} - Success:`, { stock: data?.stock });
    
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
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ error: 'Failed to update product', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = getLogContext(request);
    
    // Get old data before delete for logging
    const { data: oldData } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Log activity (async, non-blocking)
    logActivity('products', id, 'delete', oldData, null, context);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
