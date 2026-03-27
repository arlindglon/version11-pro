import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

// Known column mappings for sales table
const SALES_COLUMNS = {
  // camelCase versions
  camelCase: ['id', 'date', 'invoiceNumber', 'customerId', 'customerName', 'items', 'subtotal', 'itemDiscount', 'cartDiscount', 'taxAmount', 'shippingCost', 'total', 'paid', 'due', 'paymentMethod', 'paymentStatus', 'status', 'notes', 'payments', 'createdBy', 'createdByName', 'salesmanId', 'salesmanName', 'createdAt', 'updatedAt'],
  // snake_case versions (Supabase default)
  snakeCase: ['id', 'date', 'invoice_number', 'customer_id', 'customer_name', 'items', 'subtotal', 'item_discount', 'cart_discount', 'tax_amount', 'shipping_cost', 'total', 'paid', 'due', 'payment_method', 'payment_status', 'status', 'notes', 'payments', 'created_by', 'created_by_name', 'salesman_id', 'salesman_name', 'created_at', 'updated_at']
};

// Minimal required columns that should exist
const MINIMAL_COLUMNS = ['id', 'date', 'items', 'total', 'paid'];

// Cache for table columns
let cachedColumns: string[] | null = null;

async function getSalesTableColumns(): Promise<string[]> {
  if (cachedColumns) return cachedColumns;
  
  try {
    // Try to get existing data to see columns
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      cachedColumns = Object.keys(data[0]);
      console.log('Cached sales columns:', cachedColumns);
      return cachedColumns;
    }
    
    // If no data or error, assume minimal columns
    return MINIMAL_COLUMNS;
  } catch {
    return MINIMAL_COLUMNS;
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Fetch sales error:', error);
      return NextResponse.json([]);
    }
    
    // Get the actual columns
    const columns = await getSalesTableColumns();
    
    const parsedSales = (data || []).map(sale => {
      // Helper to get value from either camelCase or snake_case column
      const getValue = (camelCase: string, snakeCase: string, defaultValue: unknown = null) => {
        return sale[camelCase] ?? sale[snakeCase] ?? defaultValue;
      };
      
      return {
        id: sale.id || generateId(),
        invoiceNumber: getValue('invoiceNumber', 'invoice_number', ''),
        date: sale.date || new Date().toISOString(),
        customerId: getValue('customerId', 'customer_id'),
        customerName: getValue('customerName', 'customer_name', 'Walk-in Customer'),
        subtotal: getValue('subtotal', 'subtotal', 0),
        itemDiscount: getValue('itemDiscount', 'item_discount', 0),
        cartDiscount: getValue('cartDiscount', 'cart_discount', 0),
        taxAmount: getValue('taxAmount', 'tax_amount', 0),
        shippingCost: getValue('shippingCost', 'shipping_cost', 0),
        total: sale.total || 0,
        paid: sale.paid || 0,
        due: getValue('due', 'due', getValue('balance', 'balance', 0)),
        changeAmount: getValue('changeAmount', 'change_amount', 0),
        paymentMethod: getValue('paymentMethod', 'payment_method', 'Cash'),
        paymentStatus: getValue('paymentStatus', 'payment_status', 'Pending'),
        status: sale.status || 'Completed',
        notes: getValue('notes', 'notes'),
        items: typeof sale.items === 'string' ? safeParseJSON(sale.items) : (sale.items || []),
        payments: typeof getValue('payments', 'payments') === 'string' 
          ? safeParseJSON(getValue('payments', 'payments')) 
          : (getValue('payments', 'payments') || []),
        history: typeof getValue('history', 'history') === 'string' 
          ? safeParseJSON(getValue('history', 'history')) 
          : (getValue('history', 'history') || []),
        createdBy: getValue('createdBy', 'created_by', getValue('salesmanId', 'salesman_id')),
        createdByName: getValue('createdByName', 'created_by_name', getValue('salesmanName', 'salesman_name')),
        salesmanId: getValue('salesmanId', 'salesman_id', getValue('createdBy', 'created_by')),
        salesmanName: getValue('salesmanName', 'salesman_name', getValue('createdByName', 'created_by_name')),
        createdAt: getValue('createdAt', 'created_at', sale.date || new Date().toISOString()),
        updatedAt: getValue('updatedAt', 'updated_at', new Date().toISOString()),
      };
    });
    
    return NextResponse.json(parsedSales);
  } catch (error) {
    console.error('Fetch sales error:', error);
    return NextResponse.json([]);
  }
}

// Safe JSON parser
function safeParseJSON(str: string | null | undefined): unknown[] {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = getLogContext(request);
    
    console.log('Creating sale with data:', {
      customerName: body.customerName,
      total: body.total,
      paid: body.paid,
      items: body.items?.length || 0
    });
    
    // Get existing columns
    const existingColumns = await getSalesTableColumns();
    
    // Generate a unique ID
    const saleId = generateId();
    
    // Generate invoice number
    const invoiceNumber = body.invoiceNumber || `INV-${Date.now().toString(36).toUpperCase()}`;
    
    // Build sale data dynamically based on existing columns
    const saleData: Record<string, unknown> = {
      id: saleId
    };
    
    // Helper to add field in correct format - sets BOTH camelCase and snake_case if both exist
    const addField = (camelCase: string, snakeCase: string, value: unknown) => {
      if (value === undefined || value === null) return;
      
      const hasCamel = existingColumns.includes(camelCase);
      const hasSnake = existingColumns.includes(snakeCase);
      
      // If both columns exist, set both
      if (hasCamel && hasSnake) {
        saleData[camelCase] = value;
        saleData[snakeCase] = value;
      } else if (hasSnake) {
        saleData[snakeCase] = value;
      } else if (hasCamel) {
        saleData[camelCase] = value;
      } else {
        // If column doesn't exist, try snake_case as it's more common in Supabase
        saleData[snakeCase] = value;
      }
    };
    
    // Add required fields
    saleData.date = body.date || new Date().toISOString();
    
    // Add optional fields - ALWAYS provide default values for NOT NULL columns
    addField('invoiceNumber', 'invoice_number', invoiceNumber);
    // customerId - use null for walk-in customers (UUID column expects null or valid UUID)
    addField('customerId', 'customer_id', body.customerId || null);
    addField('customerName', 'customer_name', body.customerName || 'Walk-in Customer');
    addField('items', 'items', typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []));
    addField('subtotal', 'subtotal', body.subtotal || 0);
    addField('itemDiscount', 'item_discount', body.itemDiscount || 0);
    addField('cartDiscount', 'cart_discount', body.cartDiscount || 0);
    addField('taxAmount', 'tax_amount', body.taxAmount || 0);
    addField('shippingCost', 'shipping_cost', body.shippingCost || 0);
    addField('total', 'total', body.total || 0);
    addField('paid', 'paid', body.paid || 0);
    addField('due', 'due', body.due || 0);
    addField('paymentMethod', 'payment_method', body.paymentMethod || 'Cash');
    addField('paymentStatus', 'payment_status', body.paymentStatus || (body.paid >= body.total ? 'Paid' : body.paid > 0 ? 'Partial' : 'Pending'));
    addField('status', 'status', body.status || 'Completed');
    addField('notes', 'notes', body.notes);
    addField('createdBy', 'created_by', body.createdBy || body.salesmanId);
    addField('createdByName', 'created_by_name', body.createdByName || body.salesmanName);
    addField('salesmanId', 'salesman_id', body.salesmanId || body.createdBy);
    addField('salesmanName', 'salesman_name', body.salesmanName || body.createdByName);
    
    // Only add payments if column exists
    if (existingColumns.includes('payments') || existingColumns.length <= MINIMAL_COLUMNS.length) {
      saleData.payments = JSON.stringify(body.payments || []);
    }
    
    console.log('Inserting sale with columns:', Object.keys(saleData));

    const { data, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (error) {
      console.error('Insert sale error:', error);
      
      // Clear cache on error so next attempt will re-fetch
      cachedColumns = null;
      
      // Return error with helpful message
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        hint: 'Database schema mismatch. Visit /api/fix-schema to get SQL commands to update the database.',
        details: error
      }, { status: 500 });
    }

    // Clear cache on success to refresh
    cachedColumns = null;

    // UPDATE PRODUCT STOCK - decrease stock for each item sold
    const saleItems = body.items || [];
    console.log('Updating stock for sold items:', saleItems.map((i: any) => ({ productId: i.productId, qty: i.quantity })));
    
    for (const item of saleItems) {
      if (item.productId) {
        // Get current stock
        const { data: product } = await supabase
          .from('products')
          .select('stock, name')
          .eq('id', item.productId)
          .single();
        
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - Math.abs(item.quantity || 0));
          console.log(`Sale: Updating ${product.name}: ${product.stock} - ${item.quantity} = ${newStock}`);
          
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

    // Log activity to activity_logs table (new centralized logging)
    logActivity('sales', data.id, 'create', null, {
      id: data.id,
      invoiceNumber: invoiceNumber,
      total: body.total,
      paid: body.paid,
      due: body.due,
      customerName: body.customerName || 'Walk-in Customer',
      paymentMethod: body.paymentMethod || 'Cash',
      itemCount: body.items?.length || 0,
    }, context);

    // Return the created sale
    return NextResponse.json({
      id: data.id,
      invoiceNumber: data.invoice_number || data.invoiceNumber || invoiceNumber,
      date: data.date || saleData.date,
      customerId: data.customer_id || data.customerId,
      customerName: data.customer_name || data.customerName || 'Walk-in Customer',
      subtotal: data.subtotal || 0,
      total: data.total || 0,
      paid: data.paid || 0,
      due: data.due || 0,
      paymentMethod: data.payment_method || data.paymentMethod || 'Cash',
      paymentStatus: data.payment_status || data.paymentStatus || 'Pending',
      items: body.items,
      payments: body.payments || [],
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      salesmanId: data.salesman_id || data.salesmanId,
      salesmanName: data.salesman_name || data.salesmanName,
      createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create sale error:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
