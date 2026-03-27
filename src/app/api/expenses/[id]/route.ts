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
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    // Normalize response
    const getVal = (snakeCase: string, camelCase: string) => data[snakeCase] ?? data[camelCase];
    
    return NextResponse.json({
      id: data.id,
      date: getVal('date', 'date') || new Date().toISOString(),
      category: getVal('category', 'category') || 'Other',
      description: getVal('description', 'description') || '',
      amount: getVal('amount', 'amount') || 0,
      paymentMethod: getVal('payment_method', 'paymentMethod') || 'Cash',
      reference: getVal('reference', 'reference') || '',
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
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
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    // Detect existing columns
    const existingColumns = oldData ? Object.keys(oldData) : [];
    
    // Build update object with correct column names
    const update: Record<string, unknown> = {};
    if (body.category !== undefined) update.category = body.category;
    if (body.description !== undefined) update.description = body.description;
    if (body.amount !== undefined) update.amount = Number(body.amount);
    
    // Handle payment method column
    if (body.paymentMethod !== undefined) {
      if (existingColumns.includes('payment_method')) {
        update.payment_method = body.paymentMethod;
      } else if (existingColumns.includes('paymentMethod')) {
        update.paymentMethod = body.paymentMethod;
      }
    }
    
    // Add updated timestamp
    if (existingColumns.includes('updated_at')) {
      update.updated_at = new Date().toISOString();
    } else if (existingColumns.includes('updatedAt')) {
      update.updatedAt = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Log activity to centralized logging system
    logActivity('expenses', id, 'update', oldData, data, context);
    
    // Normalize response
    const getVal = (snakeCase: string, camelCase: string) => data[snakeCase] ?? data[camelCase];
    
    return NextResponse.json({
      id: data.id,
      date: getVal('date', 'date') || new Date().toISOString(),
      category: getVal('category', 'category') || 'Other',
      description: getVal('description', 'description') || '',
      amount: getVal('amount', 'amount') || 0,
      paymentMethod: getVal('payment_method', 'paymentMethod') || 'Cash',
      reference: getVal('reference', 'reference') || '',
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = getLogContext(request);
    
    // Get old data for logging
    const { data: oldData } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Log activity to centralized logging system
    logActivity('expenses', id, 'delete', oldData, null, context);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
