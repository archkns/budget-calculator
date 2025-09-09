import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError, isSupabaseConfigured } from '@/lib/supabase';
import { RoleSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock roles')
      // Return mock roles for development
      const mockRoles = [
        { id: 1, name: 'Project Director', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: 'Experience Designer (UX/UI)', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: 'Project Owner', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, name: 'Business Innovation Analyst (BA)', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 5, name: 'System Analyst', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 6, name: 'Frontend Dev', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 7, name: 'Backend Dev', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 8, name: 'LINE Dev', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 9, name: 'DevOps', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 10, name: 'QA Tester', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 11, name: 'Operation', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
      return NextResponse.json(mockRoles)
    }

    let roles, error;
    try {
      const result = await supabaseAdmin()
        .from('roles')
        .select('*')
        .order('name', { ascending: true });
      
      roles = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

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

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock response')
      // Return a mock response for development
      const mockRole = {
        id: Date.now(),
        name: validatedData.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json(mockRole, { status: 201 })
    }

    let newRole, error;
    try {
      const result = await supabaseAdmin()
        .from('roles')
        .insert({ name: validatedData.name })
        .select()
        .single();
      
      newRole = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

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
