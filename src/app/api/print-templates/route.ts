import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET - Fetch all print templates
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({ data: [], message: 'Templates stored locally' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const template = {
      id: body.id || Math.random().toString(36).substring(2, 15),
      name: body.name,
      type: body.type || 'invoice',
      paperSize: body.paperSize || 'thermal-80',
      isDefault: body.isDefault || false,
      isActive: body.isActive ?? true,
      elements: body.elements || [],
      customCSS: body.customCSS,
      width: body.width || 80,
      margin: body.margin || { top: 2, right: 2, bottom: 2, left: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('print_templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({ data: template, message: 'Template saved locally' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// PUT - Update template
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updatedTemplate = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('print_templates')
      .update(updatedTemplate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({ data: { id, ...updatedTemplate }, message: 'Template updated locally' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('print_templates')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({ success: true, message: 'Template deleted locally' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
