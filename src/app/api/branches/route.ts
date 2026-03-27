import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/db';

// GET - Fetch all branches
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching branches:', error);
      return NextResponse.json({ data: [], error: error.message });
    }

    const branches = (data || []).map(b => ({
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address,
      phone: b.phone,
      email: b.email,
      managerId: b.manager_id,
      logoUrl: b.logo_url,
      isActive: b.is_active,
      isDefault: b.is_default,
      openingTime: b.opening_time,
      closingTime: b.closing_time,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    return NextResponse.json({ data: branches });
  } catch (error) {
    console.error('Error in branches GET:', error);
    return NextResponse.json({ data: [], error: 'Failed to fetch branches' }, { status: 500 });
  }
}

// POST - Create new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, address, phone, email, openingTime, closingTime, isActive, isDefault } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('branches')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Branch code already exists' }, { status: 400 });
    }

    // If this is default, unset other defaults
    if (isDefault) {
      await supabase
        .from('branches')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const branchData = {
      id: generateId(),
      name,
      code: code.toUpperCase(),
      address: address || null,
      phone: phone || null,
      email: email || null,
      opening_time: openingTime || '09:00',
      closing_time: closingTime || '22:00',
      is_active: isActive ?? true,
      is_default: isDefault ?? false,
    };

    const { data, error } = await supabase
      .from('branches')
      .insert([branchData])
      .select()
      .single();

    if (error) {
      console.error('Error creating branch:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      code: data.code,
      address: data.address,
      phone: data.phone,
      email: data.email,
      isActive: data.is_active,
      isDefault: data.is_default,
      openingTime: data.opening_time,
      closingTime: data.closing_time,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('Error in branches POST:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
