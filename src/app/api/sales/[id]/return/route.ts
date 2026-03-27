import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

// Simple currency formatter for server-side
const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const context = getLogContext(request);
    
    const { items, refundMethod = 'original', reason = '' } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to return' }, { status: 400 });
    }

    // Get the original sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();

    if (saleError || !sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const saleItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []);
    const saleHistory = typeof sale.history === 'string' ? JSON.parse(sale.history) : (sale.history || []);
    const salePayments = typeof sale.payments === 'string' ? JSON.parse(sale.payments) : (sale.payments || []);

    // Calculate refund amount and validate items
    let refundAmount = 0;
    const updatedItems = saleItems.map((item: any) => {
      const returnItem = items.find((ri: any) => ri.productId === item.productId);
      if (returnItem) {
        const returnQty = Math.min(returnItem.quantity, item.quantity);
        if (returnQty > 0) {
          refundAmount += returnQty * (item.unitPrice || item.price || 0);
          return {
            ...item,
            quantity: item.quantity - returnQty,
            returnedQuantity: (item.returnedQuantity || 0) + returnQty,
            totalPrice: (item.quantity - returnQty) * (item.unitPrice || item.price || 0),
          };
        }
      }
      return item;
    }).filter((item: any) => item.quantity > 0); // Remove items with 0 quantity

    // Update stock for returned items
    for (const returnItem of items) {
      if (returnItem.quantity > 0) {
        const { data: product } = await supabase
          .from('products')
          .select('stock, name')
          .eq('id', returnItem.productId)
          .single();

        if (product) {
          const newStock = (product as any).stock + returnItem.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', returnItem.productId);

          // Add inventory history entry (non-blocking, ignore if table doesn't exist)
          try {
            await supabase
              .from('inventory_history')
              .insert({
                product_id: returnItem.productId,
                product_name: (product as any).name,
                action_type: 'return',
                quantity_change: returnItem.quantity,
                previous_stock: (product as any).stock,
                new_stock: newStock,
                notes: `Return from invoice #${sale.invoiceNumber || sale.id.slice(0, 8)}`,
                reference: sale.invoiceNumber || sale.id,
                created_at: new Date().toISOString(),
              });
          } catch (historyError) {
            console.log('Could not add inventory history (table may not exist):', historyError);
          }
        }
      }
    }

    // Calculate new totals
    const newSubtotal = updatedItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * (item.unitPrice || item.price || 0)), 0);
    const newTotal = newSubtotal - (sale.cartDiscount || 0) - (sale.itemDiscount || 0);
    
    // Adjust paid/due based on refund method
    let newPaid = sale.paid || 0;
    let newDue = sale.due || 0;
    
    if (refundMethod === 'cash' || refundMethod === 'original') {
      // Deduct refund from paid amount if possible, otherwise from due
      if (newPaid >= refundAmount) {
        newPaid -= refundAmount;
      } else {
        newPaid = 0;
      }
    }
    // For store_credit, we don't adjust paid/due, just keep track of credit

    newDue = Math.max(0, newTotal - newPaid);

    // Determine payment status
    let paymentStatus = 'Pending';
    if (newPaid >= newTotal) {
      paymentStatus = 'Paid';
    } else if (newPaid > 0) {
      paymentStatus = 'Partial';
    }

    // Add return entry to history
    const returnEntry = {
      id: crypto.randomUUID(),
      action: 'return',
      description: `Items returned: ${items.length} item(s), Refund: ${formatCurrency(refundAmount)} via ${refundMethod}`,
      refundAmount,
      refundMethod,
      items: items,
      reason,
      userName: context.userName,
      createdAt: new Date().toISOString(),
    };

    // Update the sale
    const { data: updatedSale, error: updateError } = await supabase
      .from('sales')
      .update({
        items: updatedItems,
        subtotal: newSubtotal,
        total: newTotal,
        paid: newPaid,
        due: newDue,
        payment_status: paymentStatus,
        paymentStatus: paymentStatus,
        history: JSON.stringify([returnEntry, ...saleHistory]),
        updated_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update sale error:', updateError);
      throw updateError;
    }

    // Log activity
    logActivity('sales', id, 'return', {
      total: sale.total,
      items: saleItems.length,
    }, {
      total: newTotal,
      refundAmount,
      returnedItems: items.length,
    }, context);

    return NextResponse.json({
      success: true,
      message: 'Return processed successfully',
      refundAmount,
      newTotal,
      newPaid,
      newDue,
      paymentStatus,
      returnedItems: items.length,
    });
  } catch (error) {
    console.error('Return processing error:', error);
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 });
  }
}
