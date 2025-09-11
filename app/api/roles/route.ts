import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { RoleSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: roles, error } = await supabaseAdmin()
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch roles');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(roles || []);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with proper error handling
    let body: unknown
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const validatedData = RoleSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body as Record<string, unknown>);

    const { data: newRole, error } = await supabaseAdmin()
      .from('roles')
      .insert({ 
        name: validatedData.name,
        description: validatedData.description || null,
        is_active: validatedData.is_active ?? true,
        sort_order: validatedData.sort_order || 0
      })
      .select()
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'create role');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
