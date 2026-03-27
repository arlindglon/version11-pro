import { NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/db';

// GET - Fetch cash registers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    let query = supabase
      .from('cash_registers')
      .select('*')
      .eq('is_active', true);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.order('name');

    if (error) {
      // Table might not exist, return default
      return NextResponse.json({ 
        data: [{
          id: 'default',
          name: 'Main Register',
          branch_id: branchId || 'default',
          opening_balance: 0,
          current_balance: 0,
          is_active: true,
        }]
      });
    }

    // If no registers exist, return default
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        data: [{
          id: 'default',
          name: 'Main Register',
          branch_id: branchId || 'default',
          opening_balance: 0,
          current_balance: 0,
          is_active: true,
        }]
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Cash registers fetch error:', error);
    return NextResponse.json({ data: [] });
  }
}

// POST - Create cash register
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, branchId, openingBalance } = body;

    const register = {
      id: generateId(),
      name: name || 'Cash Register',
      branch_id: branchId || 'default',
      opening_balance: openingBalance || 0,
      current_balance: openingBalance || 0,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('cash_registers')
      .insert(register)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: register });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Cash register create error:', error);
    return NextResponse.json({ error: 'Failed to create cash register' }, { status: 500 });
  }
}
