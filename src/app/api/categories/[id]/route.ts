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
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
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
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: body.name,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Log activity to centralized logging system
    logActivity('categories', id, 'update', oldData, data, context);
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Log activity to centralized logging system
    if (oldData) {
      logActivity('categories', id, 'delete', oldData, null, context);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
