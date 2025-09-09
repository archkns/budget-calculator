import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { RoleSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: roles, error } = await supabaseAdmin()
      .from('roles')
      .select('*')
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
    const body = await request.json();
    const validatedData = RoleSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body);

    const { data: newRole, error } = await supabaseAdmin()
      .from('roles')
      .insert({ name: validatedData.name })
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
