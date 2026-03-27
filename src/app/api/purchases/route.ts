import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

// Helper to parse JSON safely
function parseItems(items: unknown): any[] {
  if (!items) return [];
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  if (Array.isArray(items)) return items;
  return [];
}

// Get column info from existing data
async function getExistingColumns() {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch purchases error:', error);
      return NextResponse.json([]);
    }

    // Detect column names from first record if available
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    const purchases = (data || []).map(p => {
      // Handle different column naming conventions
      const getVal = (snakeCase: string, camelCase: string) => p[snakeCase] ?? p[camelCase];

      const rawSupplierId = getVal('supplier_id', 'supplierId');
      const supplierId = rawSupplierId || null;
      const supplierName = getVal('supplier_name', 'supplierName');

      return {
        id: p.id,
        purchaseNumber: getVal('purchase_number', 'purchaseNumber') || `PO-${p.id?.slice(0, 8) || 'N/A'}`,
        date: getVal('date', 'date') || p.createdAt,
        supplierId: supplierId,
        supplierName: supplierName || 'Unknown',
        items: parseItems(getVal('items', 'items')),
        subtotal: getVal('subtotal', 'subtotal') || 0,
        discount: getVal('discount', 'discount') || 0,
        taxAmount: getVal('tax_amount', 'taxAmount') || 0,
        shippingCost: getVal('shipping_cost', 'shippingCost') || 0,
        total: getVal('total', 'total') || 0,
        paid: getVal('paid', 'paid') || 0,
        balance: getVal('balance', 'balance') || 0,
        paymentStatus: getVal('payment_status', 'paymentStatus') || 'Pending',
        status: getVal('status', 'status') || 'Received',
        payments: parseItems(getVal('payments', 'payments')),
        createdAt: p.createdAt || p.created_at || new Date().toISOString(),
      };
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Fetch purchases error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = getLogContext(request);
    const purchaseNumber = body.purchaseNumber || `PO-${Date.now()}`;

    // First, try to detect what columns exist by checking existing data
    const { data: existingData } = await supabase
      .from('purchases')
      .select('*')
      .limit(1);

    const existingColumns = existingData && existingData.length > 0
      ? Object.keys(existingData[0])
      : ['id', 'date', 'supplier_name', 'items', 'total', 'paid', 'balance', 'createdAt'];

    // Build insert data using only columns that likely exist
    const insertData: Record<string, unknown> = {};

    // Core columns that should always exist
    if (existingColumns.includes('date') || existingColumns.includes('Date')) {
      insertData[existingColumns.includes('date') ? 'date' : 'Date'] = body.date || new Date().toISOString();
    }
    // Always save supplier_id when column exists and supplierId is provided
    if (existingColumns.includes('supplier_id')) {
      insertData.supplier_id = body.supplierId || null;
    }
    if (existingColumns.includes('supplier_name')) {
      insertData.supplier_name = body.supplierName || 'Unknown';
    }
    if (existingColumns.includes('items')) {
      insertData.items = typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []);
    }
    if (existingColumns.includes('subtotal')) {
      insertData.subtotal = Number(body.subtotal) || 0;
    }
    if (existingColumns.includes('discount')) {
      insertData.discount = Number(body.discount) || 0;
    }
    if (existingColumns.includes('total')) {
      insertData.total = Number(body.total) || 0;
    }
    if (existingColumns.includes('paid')) {
      insertData.paid = Number(body.paid) || 0;
    }
    if (existingColumns.includes('balance')) {
      insertData.balance = Number(body.balance) || 0;
    }
    if (existingColumns.includes('status')) {
      insertData.status = body.status || 'Received';
    }

    // Optional columns - try to add them
    const optionalColumns = [
      { key: 'purchase_number', value: purchaseNumber },
      { key: 'tax_amount', value: Number(body.taxAmount) || 0 },
      { key: 'shipping_cost', value: Number(body.shippingCost) || 0 },
      { key: 'payment_status', value: body.paymentStatus || (body.paid >= body.total ? 'Paid' : body.paid > 0 ? 'Partial' : 'Pending') },
      { key: 'payments', value: body.payments ? JSON.stringify(body.payments) : '[]' },
    ];
    
    for (const col of optionalColumns) {
      if (existingColumns.includes(col.key)) {
        insertData[col.key] = col.value;
      }
    }
    
    console.log('Inserting purchase with detected columns:', Object.keys(insertData));
    
    const { data, error } = await supabase
      .from('purchases')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // Try a minimal insert as fallback
      console.log('Trying minimal insert...');
      const minimalData: Record<string, unknown> = {
        supplier_name: body.supplierName || 'Unknown',
        items: JSON.stringify(body.items || []),
        total: Number(body.total) || 0,
        paid: Number(body.paid) || 0,
        balance: Number(body.balance) || 0,
      };
      
      const { data: minData, error: minError } = await supabase
        .from('purchases')
        .insert([minimalData])
        .select()
        .single();
      
      if (minError) {
        return NextResponse.json({ 
          error: 'Failed to create purchase',
          details: minError.message,
          code: minError.code,
        }, { status: 500 });
      }
      
      // Log activity to centralized logging
      logActivity('purchases', minData.id, 'create', null, {
        purchaseNumber,
        total: body.total,
        supplierName: body.supplierName,
        itemCount: body.items?.length || 0,
      }, context);
      
      return NextResponse.json({
        id: minData.id,
        purchaseNumber: purchaseNumber,
        date: minData.date || minData.createdAt,
        supplierId: body.supplierId || '',
        supplierName: body.supplierName || 'Unknown',
        items: body.items || [],
        total: body.total || 0,
        paid: body.paid || 0,
        balance: body.balance || 0,
        createdAt: minData.createdAt,
      });
    }

    console.log('Purchase created successfully:', data);

    // UPDATE PRODUCT STOCK - increase stock for each item
    const items = parseItems(body.items);
    console.log('Updating stock for items:', items.map(i => ({ productId: i.productId, qty: i.quantity })));
    
    for (const item of items) {
      if (item.productId) {
        // Get current stock
        const { data: product } = await supabase
          .from('products')
          .select('stock, name')
          .eq('id', item.productId)
          .single();
        
        if (product) {
          const newStock = (product.stock || 0) + Math.abs(item.quantity || 0);
          console.log(`Updating ${product.name}: ${product.stock} + ${item.quantity} = ${newStock}`);
          
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.productId);
          
          if (updateError) {
            console.error(`Failed to update stock for ${product.name}:`, updateError);
          } else {
            console.log(`✓ Stock updated for ${product.name}: ${newStock}`);
          }
        }
      }
    }

    // Log activity to centralized logging system
    logActivity('purchases', data.id, 'create', null, {
      purchaseNumber,
      total: body.total,
      paid: body.paid,
      supplierName: body.supplierName,
      itemCount: body.items?.length || 0,
    }, context);

    // Return the created purchase
    const getVal = (snakeCase: string, camelCase: string) => data[snakeCase] ?? data[camelCase];
    
    return NextResponse.json({
      id: data.id,
      purchaseNumber: getVal('purchase_number', 'purchaseNumber') || purchaseNumber,
      date: getVal('date', 'date') || data.createdAt,
      supplierId: getVal('supplier_id', 'supplierId') || body.supplierId || '',
      supplierName: getVal('supplier_name', 'supplierName') || body.supplierName || 'Unknown',
      items: parseItems(getVal('items', 'items')),
      subtotal: getVal('subtotal', 'subtotal') || body.subtotal || 0,
      discount: getVal('discount', 'discount') || body.discount || 0,
      taxAmount: getVal('tax_amount', 'taxAmount') || body.taxAmount || 0,
      shippingCost: getVal('shipping_cost', 'shippingCost') || body.shippingCost || 0,
      total: getVal('total', 'total') || body.total || 0,
      paid: getVal('paid', 'paid') || body.paid || 0,
      balance: getVal('balance', 'balance') || body.balance || 0,
      paymentStatus: getVal('payment_status', 'paymentStatus') || body.paymentStatus || 'Pending',
      status: getVal('status', 'status') || body.status || 'Received',
      payments: parseItems(getVal('payments', 'payments')),
      createdAt: data.createdAt || data.created_at,
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    return NextResponse.json({ 
      error: 'Failed to create purchase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const context = getLogContext(request);

    if (!id) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    // Fetch old data for logging
    const { data: oldData } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();

    // Prepare update object with snake_case
    const update: Record<string, unknown> = {};
    if (updateData.supplierId !== undefined) update.supplier_id = updateData.supplierId;
    if (updateData.supplierName !== undefined) update.supplier_name = updateData.supplierName;
    if (updateData.items !== undefined) update.items = typeof updateData.items === 'string' ? updateData.items : JSON.stringify(updateData.items);
    if (updateData.subtotal !== undefined) update.subtotal = updateData.subtotal;
    if (updateData.discount !== undefined) update.discount = updateData.discount;
    if (updateData.taxAmount !== undefined) update.tax_amount = updateData.taxAmount;
    if (updateData.total !== undefined) update.total = updateData.total;
    if (updateData.paid !== undefined) update.paid = updateData.paid;
    if (updateData.balance !== undefined) update.balance = updateData.balance;
    if (updateData.paymentStatus !== undefined) update.payment_status = updateData.paymentStatus;
    if (updateData.status !== undefined) update.status = updateData.status;
    
    // Track payment history - add new payment entry if paid increased
    const oldPaid = oldData?.paid || 0;
    const newPaid = updateData.paid ?? oldPaid;
    
    if (newPaid > oldPaid) {
      const oldPayments = parseItems(oldData?.payments);
      const paymentDiff = newPaid - oldPaid;
      const newPayment = {
        id: crypto.randomUUID(),
        amount: paymentDiff,
        paymentMethod: updateData.paymentMethod || 'Cash',
        notes: updateData.paymentNotes || '',
        createdAt: new Date().toISOString(),
      };
      update.payments = JSON.stringify([...oldPayments, newPayment]);
    } else if (updateData.payments !== undefined) {
      update.payments = JSON.stringify(updateData.payments);
    }

    const { data, error } = await supabase
      .from('purchases')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity to centralized logging system
    logActivity('purchases', id, 'update', oldData, data, context);

    const getVal = (snakeCase: string, camelCase: string) => data[snakeCase] ?? data[camelCase];

    return NextResponse.json({
      id: data.id,
      purchaseNumber: getVal('purchase_number', 'purchaseNumber'),
      date: getVal('date', 'date'),
      supplierId: getVal('supplier_id', 'supplierId'),
      supplierName: getVal('supplier_name', 'supplierName'),
      items: parseItems(getVal('items', 'items')),
      subtotal: getVal('subtotal', 'subtotal'),
      discount: getVal('discount', 'discount'),
      taxAmount: getVal('tax_amount', 'taxAmount'),
      shippingCost: getVal('shipping_cost', 'shippingCost'),
      total: getVal('total', 'total'),
      paid: getVal('paid', 'paid'),
      balance: getVal('balance', 'balance'),
      paymentStatus: getVal('payment_status', 'paymentStatus'),
      status: getVal('status', 'status'),
      payments: parseItems(getVal('payments', 'payments')),
      createdAt: data.createdAt || data.created_at,
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 });
  }
}
