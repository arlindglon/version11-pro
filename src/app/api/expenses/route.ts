import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

// Helper function to safely parse JSON
function safeParse(json: unknown): any {
  if (!json) return null;
  if (typeof json === 'object') return json;
  if (typeof json === 'string') {
    try { return JSON.parse(json); } catch { return null; }
  }
  return null;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) {
      console.error('Fetch expenses error:', error);
      return NextResponse.json([]);
    }

    // Detect columns from first record
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    console.log('Expenses table columns:', columns);
    
    const expenses = (data || []).map(e => {
      // Handle both snake_case and camelCase column names
      const getVal = (snakeCase: string, camelCase: string) => e[snakeCase] ?? e[camelCase];
      
      return {
        id: e.id,
        date: getVal('date', 'date') || new Date().toISOString(),
        category: getVal('category', 'category') || 'Other',
        description: getVal('description', 'description') || '',
        amount: getVal('amount', 'amount') || 0,
        paymentMethod: getVal('payment_method', 'paymentMethod') || 'Cash',
        reference: getVal('reference', 'reference') || '',
        createdAt: e.createdAt || e.created_at || new Date().toISOString(),
      };
    });
    
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = getLogContext(request);
    
    console.log('Creating expense with data:', body);
    
    // First, check what columns exist in the expenses table
    const { data: existingData } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    const existingColumns = existingData && existingData.length > 0 
      ? Object.keys(existingData[0]) 
      : ['id', 'date', 'category', 'description', 'amount', 'createdAt'];
    
    console.log('Existing expenses columns:', existingColumns);
    
    // Build insert data using only columns that exist
    const insertData: Record<string, unknown> = {};
    
    if (existingColumns.includes('date')) {
      insertData.date = body.date || new Date().toISOString();
    }
    if (existingColumns.includes('category')) {
      insertData.category = body.category || 'Other';
    }
    if (existingColumns.includes('description')) {
      insertData.description = body.description || '';
    }
    if (existingColumns.includes('amount')) {
      insertData.amount = Number(body.amount) || 0;
    }
    
    // Optional columns - only add if they exist
    if (existingColumns.includes('payment_method')) {
      insertData.payment_method = body.paymentMethod || 'Cash';
    } else if (existingColumns.includes('paymentMethod')) {
      insertData.paymentMethod = body.paymentMethod || 'Cash';
    }
    
    if (existingColumns.includes('reference')) {
      insertData.reference = body.reference || '';
    }
    
    console.log('Inserting expense with data:', insertData);
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // Try minimal insert as fallback
      console.log('Trying minimal insert...');
      const { data: minData, error: minError } = await supabase
        .from('expenses')
        .insert([{
          category: body.category || 'Other',
          description: body.description || '',
          amount: Number(body.amount) || 0,
        }])
        .select()
        .single();
      
      if (minError) {
        console.error('Minimal insert also failed:', minError);
        return NextResponse.json({ 
          error: 'Failed to create expense',
          details: minError.message || 'Unknown error',
          code: minError.code
        }, { status: 500 });
      }
      
      // Log activity to centralized logging system
      logActivity('expenses', minData.id, 'create', null, {
        category: body.category,
        description: body.description,
        amount: body.amount,
      }, context);
      
      return NextResponse.json({
        id: minData.id,
        date: minData.date || new Date().toISOString(),
        category: body.category || 'Other',
        description: body.description || '',
        amount: Number(body.amount) || 0,
        paymentMethod: 'Cash',
        reference: '',
        createdAt: minData.createdAt || minData.created_at || new Date().toISOString(),
      });
    }
    
    console.log('Expense created successfully:', data);
    
    // Log activity to centralized logging system
    logActivity('expenses', data.id, 'create', null, {
      category: body.category,
      description: body.description,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
    }, context);
    
    // Normalize response
    const getVal = (snakeCase: string, camelCase: string) => data[snakeCase] ?? data[camelCase];
    
    return NextResponse.json({
      id: data.id,
      date: getVal('date', 'date') || new Date().toISOString(),
      category: getVal('category', 'category') || body.category || 'Other',
      description: getVal('description', 'description') || body.description || '',
      amount: getVal('amount', 'amount') || Number(body.amount) || 0,
      paymentMethod: getVal('payment_method', 'paymentMethod') || 'Cash',
      reference: getVal('reference', 'reference') || '',
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ 
      error: 'Failed to create expense',
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
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }
    
    console.log('Updating expense:', id, updateData);
    
    // First, fetch the existing expense for audit log
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching existing expense:', fetchError);
    }
    
    // Detect existing columns
    const existingColumns = existingExpense ? Object.keys(existingExpense) : [];
    console.log('Existing expense columns for update:', existingColumns);
    
    // Build update object with correct column names
    const update: Record<string, unknown> = {};
    if (updateData.category !== undefined) update.category = updateData.category;
    if (updateData.description !== undefined) update.description = updateData.description;
    if (updateData.amount !== undefined) update.amount = Number(updateData.amount);
    
    // Handle payment method column (snake_case or camelCase)
    if (updateData.paymentMethod !== undefined) {
      if (existingColumns.includes('payment_method')) {
        update.payment_method = updateData.paymentMethod;
      } else if (existingColumns.includes('paymentMethod')) {
        update.paymentMethod = updateData.paymentMethod;
      }
    }
    
    if (updateData.reference !== undefined) update.reference = updateData.reference;
    
    // Add updated_at if the column exists
    if (existingColumns.includes('updated_at')) {
      update.updated_at = new Date().toISOString();
    } else if (existingColumns.includes('updatedAt')) {
      update.updatedAt = new Date().toISOString();
    }
    
    console.log('Update object:', update);
    
    const { data, error } = await supabase
      .from('expenses')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update expense error:', error);
      return NextResponse.json({ 
        error: 'Failed to update expense',
        details: error.message 
      }, { status: 500 });
    }
    
    console.log('Expense updated successfully:', data);
    
    // Log activity to centralized logging system
    logActivity('expenses', id, 'update', existingExpense ? {
      category: existingExpense.category,
      description: existingExpense.description,
      amount: existingExpense.amount,
      paymentMethod: existingExpense.payment_method || existingExpense.paymentMethod,
    } : null, {
      category: updateData.category,
      description: updateData.description,
      amount: Number(updateData.amount),
      paymentMethod: updateData.paymentMethod,
    }, context);
    
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
    console.error('Update expense error:', error);
    return NextResponse.json({ 
      error: 'Failed to update expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const context = getLogContext(request);
    
    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }
    
    console.log('Deleting expense:', id);
    
    // Fetch expense before deletion for audit log
    const { data: existingExpense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete expense error:', error);
      return NextResponse.json({ 
        error: 'Failed to delete expense',
        details: error.message 
      }, { status: 500 });
    }
    
    // Log activity to centralized logging system
    if (existingExpense) {
      logActivity('expenses', id, 'delete', {
        category: existingExpense.category,
        description: existingExpense.description,
        amount: existingExpense.amount,
      }, null, context);
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
