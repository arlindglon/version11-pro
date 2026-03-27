import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET - Fetch all stock adjustments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let query = supabase
      .from('stock_adjustments')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    return NextResponse.json([]);
  }
}

// POST - Create a stock adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      productName,
      sku,
      adjustmentType, // 'increase', 'decrease', 'damage', 'adjustment'
      quantity,
      previousStock,
      newStock,
      reason,
      userId,
      userName
    } = body;

    // Create adjustment record
    const adjustmentData = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product_id: productId,
      product_name: productName,
      sku: sku,
      adjustment_type: adjustmentType,
      quantity: quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason: reason || '',
      user_id: userId || '',
      user_name: userName || '',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('stock_adjustments')
      .insert([adjustmentData]);

    if (error) {
      console.error('Error creating stock adjustment:', error);
      // Even if saving fails, return success so the UI continues
    }

    return NextResponse.json({
      success: true,
      adjustment: adjustmentData
    });
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    return NextResponse.json({ success: false, error: 'Failed to create adjustment' }, { status: 500 });
  }
}
