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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }
    
    const getVal = (snakeCase: string, camelCase: string) => data[snakeCase] ?? data[camelCase];
    
    return NextResponse.json({
      id: data.id,
      purchaseNumber: getVal('purchase_number', 'purchaseNumber'),
      date: getVal('date', 'date'),
      supplierId: getVal('supplier_id', 'supplierId'),
      supplierName: getVal('supplier_name', 'supplierName') || 'Unknown',
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
      createdAt: data.createdAt || data.created_at,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchase' }, { status: 500 });
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
    
    // Get old data for logging
    const { data: oldData } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!oldData) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }
    
    const oldPaid = oldData.paid || 0;
    const newPaid = body.paid ?? oldPaid;
    
    // Build update object
    const updateData: Record<string, unknown> = {
      date: body.date,
      supplier_id: body.supplierId,
      supplier_name: body.supplierName,
      items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
      subtotal: body.subtotal,
      discount: body.discount,
      total: body.total,
      paid: newPaid,
      balance: body.balance,
      updated_at: new Date().toISOString(),
    };
    
    // Track payment history - add new payment entry if paid increased
    if (newPaid > oldPaid) {
      const oldPayments = parseItems(oldData.payments);
      const paymentDiff = newPaid - oldPaid;
      const newPayment = {
        id: crypto.randomUUID(),
        amount: paymentDiff,
        paymentMethod: body.paymentMethod || 'Cash',
        notes: body.paymentNotes || '',
        createdAt: new Date().toISOString(),
      };
      updateData.payments = JSON.stringify([...oldPayments, newPayment]);
    }
    
    const { data, error } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Log activity to centralized logging system
    logActivity('purchases', id, 'update', oldData, data, context);
    
    // Parse payments array for frontend
    const updatedPayments = updateData.payments ? JSON.parse(updateData.payments as string) : parseItems(oldData.payments);
    
    return NextResponse.json({
      ...data,
      items: body.items,
      payments: updatedPayments,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = getLogContext(request);
    
    // Get purchase data before deleting to restore stock
    const { data: oldData } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (oldData) {
      const items = parseItems(oldData.items);
      
      // Restore stock (reduce) for each item
      for (const item of items) {
        if (item.productId) {
          const { data: product } = await supabase
            .from('products')
            .select('stock, name')
            .eq('id', item.productId)
            .single();
          
          if (product) {
            const newStock = Math.max(0, (product.stock || 0) - Math.abs(item.quantity || 0));
            console.log(`Purchase Delete: Restoring ${product.name}: ${product.stock} - ${item.quantity} = ${newStock}`);
            
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.productId);
          }
        }
      }
    }
    
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Log activity to centralized logging system
    logActivity('purchases', id, 'delete', oldData, null, context);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 });
  }
}
