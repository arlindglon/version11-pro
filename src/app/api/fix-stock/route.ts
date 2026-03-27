import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET - Fix stock discrepancies by recalculating from all transactions
export async function GET() {
  try {
    console.log('=== Starting stock fix ===');
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock');
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }
    
    console.log(`Found ${products?.length || 0} products`);
    
    // Get all purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select('items, date');
    
    console.log(`Found ${purchases?.length || 0} purchases`);
    
    // Get all sales  
    const { data: sales } = await supabase
      .from('sales')
      .select('items, date');
    
    console.log(`Found ${sales?.length || 0} sales`);
    
    // Calculate correct stock for each product
    // Stock = Sum of all purchases - Sum of all sales
    const stockMap: Record<string, { 
      purchased: number; 
      sold: number; 
      correctStock: number;
      currentStock: number;
      name: string;
    }> = {};
    
    // Initialize with current product data
    for (const product of (products || [])) {
      stockMap[product.id] = {
        purchased: 0,
        sold: 0,
        correctStock: 0,
        currentStock: product.stock || 0,
        name: product.name
      };
    }
    
    // Process purchases (stock increases)
    for (const purchase of (purchases || [])) {
      const items = typeof purchase.items === 'string' 
        ? safeParseJSON(purchase.items) 
        : (purchase.items || []);
      
      for (const item of items) {
        if (item.productId && stockMap[item.productId]) {
          stockMap[item.productId].purchased += Math.abs(item.quantity || 0);
        }
      }
    }
    
    // Process sales (stock decreases)
    for (const sale of (sales || [])) {
      const items = typeof sale.items === 'string' 
        ? safeParseJSON(sale.items) 
        : (sale.items || []);
      
      for (const item of items) {
        if (item.productId && stockMap[item.productId]) {
          stockMap[item.productId].sold += Math.abs(item.quantity || 0);
        }
      }
    }
    
    // Calculate correct stock and update database
    const updates: { 
      id: string; 
      name: string; 
      oldStock: number; 
      newStock: number;
      purchased: number;
      sold: number;
    }[] = [];
    
    for (const [productId, data] of Object.entries(stockMap)) {
      // Correct stock = purchases - sales (starting from 0)
      const correctStock = data.purchased - data.sold;
      
      if (data.currentStock !== correctStock) {
        updates.push({
          id: productId,
          name: data.name,
          oldStock: data.currentStock,
          newStock: correctStock,
          purchased: data.purchased,
          sold: data.sold
        });
        
        // Update in database
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: correctStock })
          .eq('id', productId);
        
        if (updateError) {
          console.error(`Failed to update ${data.name}:`, updateError);
        } else {
          console.log(`✓ Updated ${data.name}: ${data.currentStock} -> ${correctStock}`);
        }
      }
    }
    
    console.log(`=== Stock fix complete. Updated ${updates.length} products ===`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} stock discrepancies`,
      updates,
      summary: {
        totalProducts: products?.length || 0,
        totalPurchases: purchases?.length || 0,
        totalSales: sales?.length || 0,
        fixedCount: updates.length
      }
    });
  } catch (error) {
    console.error('Stock fix error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix stock',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

function safeParseJSON(str: string | null | undefined): any[] {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}
