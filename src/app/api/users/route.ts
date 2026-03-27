import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch users error:', error);
      return NextResponse.json([]);
    }

    // Return without passwords - map snake_case DB to camelCase frontend
    const users = (data || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      username: u.username,
      role: u.role || 'Staff',
      isActive: u.is_active ?? true,
      permissions: u.permissions || {},
      lastLogin: u.last_login,
      createdAt: u.created_at || new Date().toISOString(),
      updatedAt: u.updated_at || new Date().toISOString(),
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = getLogContext(request);

    // Check if username already exists
    const { data: existingUsers } = await supabase
      .from('app_users')
      .select('id')
      .eq('username', body.username);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const userId = generateId();
    const now = new Date().toISOString();

    // Use snake_case for DB columns
    const userData = {
      id: userId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      username: body.username,
      password: body.password || '123456',
      role: body.role || 'Staff',
      is_active: body.isActive ?? true,
      permissions: body.permissions || {},
      last_login: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('app_users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Create user error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('User saved to Supabase:', data.username);

    // Log activity to centralized logging system
    logActivity('users', data.id, 'create', null, {
      name: data.name,
      username: data.username,
      role: data.role,
      email: data.email,
    }, context);

    // Return without password - map snake_case to camelCase
    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      username: data.username,
      role: data.role,
      isActive: data.is_active,
      permissions: data.permissions,
      lastLogin: data.last_login,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
