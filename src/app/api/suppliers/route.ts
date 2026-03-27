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
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch suppliers error:', error);
      return NextResponse.json([]);
    }

    const suppliers = (data || []).map(s => ({
      id: s.id,
      name: s.name,
      contact: s.contact || s.phone || '',
      email: s.email || '',
      address: s.address || '',
      balance: s.balance || 0,
      createdAt: getValue(s, 'created_at', 'createdAt', new Date().toISOString()),
      updatedAt: getValue(s, 'updated_at', 'updatedAt', new Date().toISOString()),
    }));

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Fetch suppliers error:', error);
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
    
    const contactNumber = body.contact || body.phone || '';
    
    // Check if supplier with same contact already exists
    if (contactNumber) {
      const { data: existingByContact } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('contact', contactNumber)
        .single();

      if (existingByContact) {
        return NextResponse.json({ 
          error: 'এই ফোন নম্বর দিয়ে আগেই একটি সাপ্লায়ার আছে',
          errorEn: `Supplier already exists with this contact: ${existingByContact.name}`,
          duplicate: true 
        }, { status: 400 });
      }
    }

    // Check if supplier with same name already exists
    if (body.name) {
      const { data: existingByName } = await supabase
        .from('suppliers')
        .select('id, contact')
        .ilike('name', body.name.trim())
        .single();

      if (existingByName) {
        return NextResponse.json({ 
          error: 'এই নামে আগেই একটি সাপ্লায়ার আছে',
          errorEn: `Supplier already exists with this name`,
          duplicate: true 
        }, { status: 400 });
      }
    }
    
    const insertData: Record<string, unknown> = {
      name: body.name?.trim(),
      contact: contactNumber.trim(),
      email: body.email?.trim() || '',
      address: body.address?.trim() || '',
      balance: Number(body.balance) || 0,
    };
    
    console.log('Creating supplier:', insertData);
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ 
        error: 'Failed to create supplier',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Supplier created:', data);
    
    // Log activity (async, non-blocking)
    logActivity('suppliers', data.id, 'create', null, data, context);

    return NextResponse.json({
      id: data.id,
      name: data.name,
      contact: data.contact || '',
      email: data.email || '',
      address: data.address || '',
      balance: data.balance || 0,
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
      updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json({ 
      error: 'Failed to create supplier',
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
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    // Get old data first for logging
    const { data: oldData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    const update: Record<string, unknown> = {};
    if (updateData.name !== undefined) update.name = updateData.name?.trim();
    if (updateData.contact !== undefined) update.contact = updateData.contact?.trim();
    if (updateData.email !== undefined) update.email = updateData.email?.trim();
    if (updateData.address !== undefined) update.address = updateData.address?.trim();
    if (updateData.balance !== undefined) update.balance = updateData.balance;

    const { data, error } = await supabase
      .from('suppliers')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Log activity (async, non-blocking)
    logActivity('suppliers', id, 'update', oldData, data, context);

    return NextResponse.json({
      id: data.id,
      name: data.name,
      contact: data.contact,
      email: data.email,
      address: data.address,
      balance: data.balance,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const context = getLogContext(request);

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    // Get old data before delete for logging
    const { data: oldData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Log activity (async, non-blocking)
    logActivity('suppliers', id, 'delete', oldData, null, context);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
