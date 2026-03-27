import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      code: data.code,
      address: data.address,
      phone: data.phone,
      email: data.email,
      managerId: data.manager_id,
      logoUrl: data.logo_url,
      isActive: data.is_active,
      isDefault: data.is_default,
      openingTime: data.opening_time,
      closingTime: data.closing_time,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branch' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, address, phone, email, openingTime, closingTime, isActive, isDefault } = body;

    // If this is default, unset other defaults
    if (isDefault) {
      await supabase
        .from('branches')
        .update({ is_default: false })
        .neq('id', id)
        .eq('is_default', true);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (openingTime !== undefined) updateData.opening_time = openingTime;
    if (closingTime !== undefined) updateData.closing_time = closingTime;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (isDefault !== undefined) updateData.is_default = isDefault;

    const { data, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
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
      updatedAt: data.updated_at,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if branch has data
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('branch_id', id)
      .limit(1);

    if (products && products.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete branch with existing products. Please transfer data first.' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
