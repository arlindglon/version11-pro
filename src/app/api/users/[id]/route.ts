import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

// Helper to get value from either snake_case or camelCase
const getValue = (obj: Record<string, any>, snakeCase: string, camelCase: string, defaultValue: any = null) => {
  return obj[snakeCase] ?? obj[camelCase] ?? defaultValue;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return without password - map snake_case to camelCase
    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      username: data.username,
      role: data.role || 'Staff',
      isActive: data.is_active ?? true,
      permissions: data.permissions || {},
      lastLogin: data.last_login,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
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
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single();

    // Use snake_case for DB columns
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.permissions !== undefined) updateData.permissions = body.permissions;
    if (body.password !== undefined) updateData.password = body.password;

    const { data, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Log activity to centralized logging system (exclude password from logs)
    const { password: _, ...oldDataSafe } = (oldData || {}) as Record<string, unknown>;
    const newDataSafe = { ...body };
    delete (newDataSafe as Record<string, unknown>).password;

    logActivity('users', id, 'update', oldDataSafe, newDataSafe, context);

    // Return without password - map snake_case to camelCase
    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      username: data.username,
      role: data.role || 'Staff',
      isActive: data.is_active ?? true,
      permissions: data.permissions || {},
      lastLogin: data.last_login,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
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
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Log activity to centralized logging system
    if (oldData) {
      const { password: _, ...oldDataSafe } = oldData as Record<string, unknown>;
      logActivity('users', id, 'delete', oldDataSafe, null, context);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
