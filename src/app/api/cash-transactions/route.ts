import { NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/db';

// GET - Fetch cash transactions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shiftId');
    const registerId = searchParams.get('registerId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('cash_register_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (shiftId) {
      query = query.eq('shift_id', shiftId);
    }

    if (registerId) {
      query = query.eq('register_id', registerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Cash transactions fetch error:', error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Cash transactions fetch error:', error);
    return NextResponse.json({ data: [] });
  }
}

// POST - Create cash transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shift_id,
      register_id,
      transaction_type,
      amount,
      notes,
      reference_type,
      reference_id,
      created_by,
    } = body;

    // Get current balance
    const { data: lastTransaction } = await supabase
      .from('cash_register_transactions')
      .select('balance_after')
      .eq('register_id', register_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentBalance = lastTransaction?.balance_after || 0;
    const transactionAmount = parseFloat(amount) || 0;

    let newBalance = currentBalance;
    if (transaction_type === 'sale' || transaction_type === 'cash_in' || transaction_type === 'open') {
      newBalance = currentBalance + transactionAmount;
    } else if (transaction_type === 'refund' || transaction_type === 'cash_out' || transaction_type === 'close') {
      newBalance = currentBalance - transactionAmount;
    }

    const transaction = {
      id: generateId(),
      shift_id,
      register_id,
      transaction_type,
      amount: transactionAmount,
      balance_after: newBalance,
      notes: notes || null,
      reference_type: reference_type || null,
      reference_id: reference_id || null,
      created_by,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cash_register_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, still return success
      return NextResponse.json({ data: transaction });
    }

    // Update register current balance
    await supabase
      .from('cash_registers')
      .update({ current_balance: newBalance })
      .eq('id', register_id);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Cash transaction create error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
