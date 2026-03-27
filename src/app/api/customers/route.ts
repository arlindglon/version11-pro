import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

// Helper to get value from either snake_case or camelCase
const getValue = (obj: Record<string, any>, snakeCase: string, camelCase: string, defaultValue: any = null) => {
  return obj[snakeCase] ?? obj[camelCase] ?? defaultValue;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch customers error:', error);
      return NextResponse.json([]);
    }

    // Map snake_case DB to camelCase frontend
    const customers = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      due: getValue(c, 'due', 'due', 0),
      totalPurchase: getValue(c, 'total_purchases', 'totalPurchase', 0),
      createdAt: getValue(c, 'created_at', 'createdAt', new Date().toISOString()),
      updatedAt: getValue(c, 'updated_at', 'updatedAt', new Date().toISOString()),
    }));

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = getLogContext(request);

    // ============================================
    // DUPLICATE VALIDATION
    // ============================================
    
    // Check if customer with same phone already exists
    if (body.phone) {
      const { data: existingByPhone } = await supabase
        .from('customers')
        .select('id, name')
        .eq('phone', body.phone)
        .single();

      if (existingByPhone) {
        return NextResponse.json({ 
          error: 'এই ফোন নম্বর দিয়ে আগেই একটি কাস্টমার আছে',
          errorEn: `Customer already exists with this phone number: ${existingByPhone.name}`,
          duplicate: true 
        }, { status: 400 });
      }
    }

    // Check if customer with same name already exists (if phone not provided)
    if (body.name) {
      const { data: existingByName } = await supabase
        .from('customers')
        .select('id, phone')
        .ilike('name', body.name.trim())
        .single();

      if (existingByName) {
        return NextResponse.json({ 
          error: 'এই নামে আগেই একটি কাস্টমার আছে',
          errorEn: `Customer already exists with this name`,
          duplicate: true 
        }, { status: 400 });
      }
    }

    // Insert with snake_case columns
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        name: body.name?.trim(),
        phone: body.phone?.trim(),
        email: body.email?.trim(),
        address: body.address?.trim(),
        due: body.due || 0,
      }])
      .select()
      .single();

    if (error) throw error;

    // Log activity (async, non-blocking)
    logActivity('customers', data.id, 'create', null, data, context);

    // Return with camelCase
    return NextResponse.json({
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      due: data.due || 0,
      totalPurchase: getValue(data, 'total_purchases', 'totalPurchase', 0),
      createdAt: getValue(data, 'created_at', 'createdAt', new Date().toISOString()),
      updatedAt: getValue(data, 'updated_at', 'updatedAt', new Date().toISOString()),
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
