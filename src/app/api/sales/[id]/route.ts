import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

// Simple currency formatter for server-side
const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

// Cache for detected columns
let salesColumns: string[] | null = null;

async function getSalesColumns(): Promise<string[]> {
  if (salesColumns) return salesColumns;
  
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      salesColumns = Object.keys(data[0]);
    } else if (data) {
      salesColumns = Object.keys(data);
    }
    
    console.log('Detected sales columns:', salesColumns);
    return salesColumns || [];
  } catch (e) {
    console.error('Error detecting columns:', e);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      invoiceNumber: data.invoiceNumber || data.invoice_number || '',
      date: data.date,
      customerId: data.customerId || data.customer_id,
      customerName: data.customerName || data.customer_name || 'Walk-in Customer',
      subtotal: data.subtotal || 0,
      itemDiscount: data.itemDiscount || data.item_discount || 0,
      cartDiscount: data.cartDiscount || data.cart_discount || data.discount || 0,
      discountType: data.discountType || data.discount_type || 'flat',
      discountPercent: data.discountPercent || data.discount_percent || 0,
      taxAmount: data.taxAmount || data.tax_amount || 0,
      shippingCost: data.shippingCost || data.shipping_cost || 0,
      total: data.total || 0,
      paid: data.paid || 0,
      due: data.due || data.balance || 0,
      changeAmount: data.changeAmount || data.change_amount || 0,
      paymentMethod: data.paymentMethod || data.payment_method || 'Cash',
      paymentStatus: data.paymentStatus || data.payment_status || 'Pending',
      status: data.status || 'Completed',
      notes: data.notes,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
      payments: typeof data.payments === 'string' ? JSON.parse(data.payments) : (data.payments || []),
      history: typeof data.history === 'string' ? JSON.parse(data.history) : (data.history || []),
      createdBy: data.createdBy || data.created_by,
      createdByName: data.createdByName || data.created_by_name,
      salesmanId: data.salesmanId || data.salesman_id || data.createdBy || data.created_by,
      salesmanName: data.salesmanName || data.salesman_name || data.createdByName || data.created_by_name,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
    });
  } catch (error) {
    console.error('Get sale error:', error);
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
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

    // Get old sale data for audit and stock adjustment
    const { data: oldSale } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const oldItems = typeof oldSale.items === 'string' ? JSON.parse(oldSale.items) : (oldSale.items || []);
    const newItems = body.items || oldItems;
    
    // Parse existing payments
    const oldPayments = typeof oldSale.payments === 'string' ? JSON.parse(oldSale.payments) : (oldSale.payments || []);
    const oldPaid = oldSale.paid || 0;
    
    console.log('Payment update debug:', { 
      oldPaid, 
      newPaid: body.paid, 
      paymentMethod: body.paymentMethod,
      willRecordPayment: (body.paid || 0) > oldPaid 
    });

    // Calculate new totals
    let subtotal = 0;
    let itemDiscount = 0;

    const processedItems = newItems.map((item: any) => {
      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || item.price || 0;
      const discount = item.discount || 0;
      
      let itemTotal = quantity * unitPrice;
      itemTotal -= discount;
      subtotal += quantity * unitPrice;
      itemDiscount += discount;
      
      return {
        ...item,
        unitPrice,
        quantity,
        discount: discount,
        totalPrice: itemTotal,
        total: itemTotal,
      };
    });

    // Apply cart discount
    let cartDiscount = body.cartDiscount || 0;

    const total = subtotal - itemDiscount - cartDiscount + (body.taxAmount || 0) + (body.shippingCost || 0);
    const paid = body.paid ?? oldSale.paid ?? 0;
    const due = total - paid;

    // Determine payment status
    let paymentStatus = 'Pending';
    if (paid >= total) {
      paymentStatus = 'Paid';
    } else if (paid > 0) {
      paymentStatus = 'Partial';
    }

    // Detect existing columns
    const columns = await getSalesColumns();
    
    // Build update object with only existing columns
    const updateData: Record<string, unknown> = {};

    // Always update items and totals
    if (columns.includes('items')) updateData.items = processedItems;
    if (columns.includes('subtotal')) updateData.subtotal = subtotal;
    if (columns.includes('total')) updateData.total = total;
    if (columns.includes('paid')) updateData.paid = paid;
    if (columns.includes('paymentStatus') || columns.includes('payment_status')) {
      updateData[columns.includes('paymentStatus') ? 'paymentStatus' : 'payment_status'] = paymentStatus;
    }

    // Track payment history - add new payment entry if paid increased
    // Try to save even if column might not exist - Supabase will ignore unknown columns
    if (paid > oldPaid) {
      const paymentDiff = paid - oldPaid;
      const newPayment = {
        id: crypto.randomUUID(),
        amount: paymentDiff,
        paymentMethod: body.paymentMethod || 'Cash',
        notes: body.paymentNotes || '',
        createdAt: new Date().toISOString(),
      };
      updateData.payments = JSON.stringify([...oldPayments, newPayment]);
    }

    // Track history entries for changes
    const oldHistory = typeof oldSale.history === 'string' ? JSON.parse(oldSale.history) : (oldSale.history || []);
    const newHistoryEntries: any[] = [];

    // Add history entry for payment
    if (paid > oldPaid) {
      const paymentDiff = paid - oldPaid;
      newHistoryEntries.push({
        id: crypto.randomUUID(),
        action: 'payment',
        description: `Payment received: ${formatCurrency(paymentDiff)} via ${body.paymentMethod || 'Cash'}`,
        amount: paymentDiff,
        paymentMethod: body.paymentMethod || 'Cash',
        userName: context.userName,
        createdAt: new Date().toISOString(),
      });
    }

    // Add history entry for other updates
    if (body.items && JSON.stringify(body.items) !== JSON.stringify(oldItems)) {
      newHistoryEntries.push({
        id: crypto.randomUUID(),
        action: 'update',
        description: 'Items updated',
        userName: context.userName,
        createdAt: new Date().toISOString(),
      });
    }

    // Save history ONLY if column exists - don't fail if it doesn't
    if (newHistoryEntries.length > 0 && columns.includes('history')) {
      updateData.history = JSON.stringify([...newHistoryEntries, ...oldHistory]);
    }

    // Optional fields - only update if column exists
    if (body.customerName !== undefined) {
      if (columns.includes('customerName')) updateData.customerName = body.customerName;
      else if (columns.includes('customer_name')) updateData.customer_name = body.customerName;
    }
    
    if (columns.includes('itemDiscount') || columns.includes('item_discount')) {
      updateData[columns.includes('itemDiscount') ? 'itemDiscount' : 'item_discount'] = itemDiscount;
    }
    
    if (columns.includes('cartDiscount')) {
      updateData.cartDiscount = cartDiscount;
    } else if (columns.includes('cart_discount')) {
      updateData.cart_discount = cartDiscount;
    } else if (columns.includes('discount')) {
      updateData.discount = cartDiscount;
    }

    if (body.due !== undefined) {
      if (columns.includes('due')) updateData.due = due;
      else if (columns.includes('balance')) updateData.balance = due;
    }

    if (body.paymentMethod !== undefined) {
      if (columns.includes('paymentMethod')) updateData.paymentMethod = body.paymentMethod;
      else if (columns.includes('payment_method')) updateData.payment_method = body.paymentMethod;
    }

    if (body.notes !== undefined) {
      if (columns.includes('notes')) updateData.notes = body.notes;
    }

    if (body.taxAmount !== undefined) {
      if (columns.includes('taxAmount')) updateData.taxAmount = body.taxAmount;
      else if (columns.includes('tax_amount')) updateData.tax_amount = body.taxAmount;
    }

    if (body.shippingCost !== undefined) {
      if (columns.includes('shippingCost')) updateData.shippingCost = body.shippingCost;
      else if (columns.includes('shipping_cost')) updateData.shipping_cost = body.shippingCost;
    }

    // Update timestamp if column exists
    if (columns.includes('updatedAt')) updateData.updatedAt = new Date().toISOString();
    else if (columns.includes('updated_at')) updateData.updated_at = new Date().toISOString();

    console.log('Updating sale with columns:', Object.keys(updateData));

    const { data, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update sale error:', error);
      throw error;
    }

    // Handle stock adjustments
    for (const oldItem of oldItems) {
      const newItem = processedItems.find((i: any) => i.productId === oldItem.productId);
      const oldQty = oldItem.quantity || 0;
      
      if (!newItem) {
        // Item was removed - add stock back
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', oldItem.productId)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock: (product as any).stock + oldQty })
            .eq('id', oldItem.productId);
        }
      } else {
        // Item quantity changed
        const qtyDiff = oldQty - (newItem.quantity || 0);
        if (qtyDiff !== 0) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', oldItem.productId)
            .single();
          
          if (product) {
            const newStock = qtyDiff > 0 
              ? (product as any).stock + qtyDiff 
              : (product as any).stock + qtyDiff; // qtyDiff is negative, so this reduces stock
            await supabase
              .from('products')
              .update({ stock: Math.max(0, newStock) })
              .eq('id', oldItem.productId);
          }
        }
      }
    }

    // Check for newly added items
    for (const newItem of processedItems) {
      const oldItem = oldItems.find((i: any) => i.productId === newItem.productId);
      if (!oldItem) {
        // New item was added - reduce stock
        const qty = newItem.quantity || 1;
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', newItem.productId)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, (product as any).stock - qty) })
            .eq('id', newItem.productId);
        }
      }
    }

    // Log activity to centralized logging system
    logActivity('sales', id, 'update', {
      total: oldSale.total,
      paid: oldSale.paid,
      customerName: oldSale.customerName || oldSale.customer_name,
    }, {
      total: total,
      paid: paid,
      customerName: body.customerName || oldSale.customerName || oldSale.customer_name,
    }, context);

    return NextResponse.json({
      success: true,
      id: data.id,
      invoiceNumber: data.invoiceNumber || data.invoice_number || '',
      date: data.date,
      customerName: data.customerName || data.customer_name || 'Walk-in Customer',
      subtotal,
      itemDiscount,
      cartDiscount,
      total,
      paid,
      due,
      paymentMethod: data.paymentMethod || data.payment_method || 'Cash',
      paymentStatus,
      items: processedItems,
      salesmanId: data.salesmanId || data.salesman_id || data.createdBy || data.created_by,
      salesmanName: data.salesmanName || data.salesman_name || data.createdByName || data.created_by_name,
    });
  } catch (error) {
    console.error('Update sale error:', error);
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = getLogContext(request);

    // Get old sale data for audit and stock restoration
    const { data: oldSale } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();

    if (oldSale) {
      const oldItems = typeof oldSale.items === 'string' ? JSON.parse(oldSale.items) : (oldSale.items || []);
      
      // Restore stock for all items
      for (const item of oldItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock: (product as any).stock + (item.quantity || 1) })
            .eq('id', item.productId);
        }
      }
    }

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log activity to centralized logging system
    logActivity('sales', id, 'delete', oldSale ? {
      total: oldSale.total,
      paid: oldSale.paid,
      customerName: oldSale.customerName || oldSale.customer_name,
      itemCount: oldSale.items?.length || 0,
    } : null, null, context);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete sale error:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
