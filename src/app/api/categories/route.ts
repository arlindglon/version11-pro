import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getLogContext } from '@/lib/get-log-context';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Fetch categories error:', error);
      return NextResponse.json([]);
    }

    // Return unique categories (in case of duplicates, get distinct names)
    const uniqueNames = [...new Set((data || []).map(c => c.name))];
    const categories = uniqueNames.map(name => {
      const cat = (data || []).find(c => c.name === name);
      return {
        id: cat?.id,
        name: name,
      };
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = getLogContext(request);
    
    // Check if category already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', body.name)
      .limit(1);
    
    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        error: 'Category already exists',
        message: `Category "${body.name}" already exists`
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: body.name }])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'Category already exists',
          message: `Category "${body.name}" already exists`
        }, { status: 400 });
      }
      throw error;
    }
    
    // Log activity to centralized logging system
    logActivity('categories', data.id, 'create', null, {
      name: body.name,
    }, context);
    
    return NextResponse.json({
      id: data.id,
      name: data.name,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const context = getLogContext(request);
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Get category data before delete for logging
    const { data: oldData } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .limit(1);

    // Delete ALL categories with this name (handles duplicates)
    const { error, count } = await supabase
      .from('categories')
      .delete()
      .eq('name', name);

    if (error) throw error;
    
    // Log activity to centralized logging system
    if (oldData && oldData.length > 0) {
      logActivity('categories', oldData[0].id, 'delete', oldData[0], null, context);
    }
    
    return NextResponse.json({ 
      success: true, 
      deleted: count || oldData?.length || 0,
      message: `Deleted ${count || oldData?.length || 0} category(ies) named "${name}"`
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
