import { NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/db';

// GET - Fetch cash shifts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const shiftId = searchParams.get('shiftId');

    if (shiftId) {
      const { data, error } = await supabase
        .from('cash_shifts')
        .select('*')
        .eq('id', shiftId)
        .single();

      if (error) {
        return NextResponse.json({ data: null });
      }
      return NextResponse.json({ data });
    }

    let query = supabase
      .from('cash_shifts')
      .select('*')
      .order('opened_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Cash shifts fetch error:', error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Cash shifts fetch error:', error);
    return NextResponse.json({ data: [] });
  }
}

// POST - Open or close shift
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'open') {
      // Open new shift
      const { register_id, user_id, user_name, opening_amount, notes, branch_id } = body;

      // Check if user already has an open shift
      const { data: existingShifts } = await supabase
        .from('cash_shifts')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'open');

      if (existingShifts && existingShifts.length > 0) {
        return NextResponse.json(
          { error: 'You already have an open shift. Close it first.' },
          { status: 400 }
        );
      }

      const shift = {
        id: generateId(),
        register_id: register_id || 'default',
        user_id,
        user_name,
        opening_amount: parseFloat(opening_amount) || 0,
        closing_amount: null,
        expected_closing: null,
        variance: null,
        opened_at: new Date().toISOString(),
        closed_at: null,
        status: 'open',
        notes: notes || null,
        branch_id: branch_id || 'default',
      };

      const { data, error } = await supabase
        .from('cash_shifts')
        .insert(shift)
        .select()
        .single();

      if (error) {
        // If table doesn't exist, return the shift data anyway
        return NextResponse.json({ data: shift });
      }

      // Create opening transaction
      await supabase.from('cash_register_transactions').insert({
        id: generateId(),
        register_id: shift.register_id,
        shift_id: shift.id,
        transaction_type: 'open',
        amount: shift.opening_amount,
        balance_after: shift.opening_amount,
        notes: 'Shift opening',
        created_by: user_id,
      });

      return NextResponse.json({ data });
    }

    if (action === 'close') {
      // Close shift
      const { shift_id, closing_amount, notes } = body;

      const { data: shift } = await supabase
        .from('cash_shifts')
        .select('*')
        .eq('id', shift_id)
        .single();

      if (!shift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
      }

      // Get all transactions for this shift
      const { data: transactions } = await supabase
        .from('cash_register_transactions')
        .select('*')
        .eq('shift_id', shift_id);

      // Calculate expected closing
      let expectedClosing = shift.opening_amount;
      (transactions || []).forEach((t: { transaction_type: string; amount: number }) => {
        if (t.transaction_type === 'sale' || t.transaction_type === 'cash_in') {
          expectedClosing += t.amount;
        } else if (t.transaction_type === 'refund' || t.transaction_type === 'cash_out') {
          expectedClosing -= t.amount;
        }
      });

      const actualClosing = parseFloat(closing_amount) || 0;
      const variance = actualClosing - expectedClosing;

      // Update shift
      const { data, error } = await supabase
        .from('cash_shifts')
        .update({
          closing_amount: actualClosing,
          expected_closing: expectedClosing,
          variance: variance,
          closed_at: new Date().toISOString(),
          status: 'closed',
          notes: notes || shift.notes,
        })
        .eq('id', shift_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Create closing transaction
      await supabase.from('cash_register_transactions').insert({
        id: generateId(),
        register_id: shift.register_id,
        shift_id: shift_id,
        transaction_type: 'close',
        amount: actualClosing,
        balance_after: actualClosing,
        notes: `Shift closed. Variance: ${variance >= 0 ? '+' : ''}${variance.toFixed(2)}`,
        created_by: shift.user_id,
      });

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Cash shift operation error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
