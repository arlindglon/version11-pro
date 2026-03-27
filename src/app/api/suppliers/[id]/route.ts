import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
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
    
    // Get old data first for logging
    const { data: oldData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name: body.name,
        contact: body.contact,
        email: body.email,
        address: body.address,
        balance: body.balance,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Log activity (async, non-blocking)
    logActivity('suppliers', id, 'update', oldData, data, context);
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = getLogContext(request);
    
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
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
