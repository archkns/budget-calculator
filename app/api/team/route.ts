import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase'
import { TeamMemberFormSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query with optional status filter
    let query;
    try {
      query = supabaseAdmin()
        .from('team_members')
        .select(`
          *,
          roles:role_id (
            id,
            name
          ),
          levels:level_id (
            id,
            name,
            display_name
          )
        `)
        .order('name', { ascending: true });
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: teamMembers, error } = await query;

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch team members');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    const response = NextResponse.json(teamMembers || []);
    
    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
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
    
    // Validate the request body
    const validatedData = TeamMemberFormSchema.parse(body as Record<string, unknown>)


    let newMember, error;
    try {
      const result = await supabaseAdmin()
        .from('team_members')
        .insert({
          name: validatedData.name,
          role_id: validatedData.role_id,
          level_id: validatedData.level_id,
          default_rate_per_day: validatedData.default_rate_per_day,
          notes: validatedData.notes,
          status: validatedData.status || 'ACTIVE'
        })
        .select(`
          *,
          roles:role_id (
            id,
            name
          ),
          levels:level_id (
            id,
            name,
            display_name
          )
        `)
        .single()
      
      newMember = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'create team member');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }
    
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
    
    const validatedData = TeamMemberFormSchema.partial().parse(body as Record<string, unknown>)

    let updatedMember, error;
    try {
      const result = await supabaseAdmin()
        .from('team_members')
        .update(validatedData)
        .eq('id', id)
        .select(`
          *,
          roles:role_id (
            id,
            name
          ),
          levels:level_id (
            id,
            name,
            display_name
          )
        `)
        .single()
      
      updatedMember = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'update team member');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    if (!updatedMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    let error;
    try {
      const result = await supabaseAdmin()
        .from('team_members')
        .delete()
        .eq('id', id)
      
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'delete team member');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
