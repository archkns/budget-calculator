import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase'
import { TeamMemberFormSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query with optional status filter
    let query = supabaseAdmin
      .from('team_members')
      .select(`
        *,
        roles:role_id (
          id,
          name
        )
      `)
      .order('name', { ascending: true });

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

    return NextResponse.json(teamMembers || []);
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
    const body = await request.json()
    
    // Validate the request body
    const validatedData = TeamMemberFormSchema.parse(body)

    const { data: newMember, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        name: validatedData.name,
        role_id: validatedData.role_id,
        custom_role: validatedData.custom_role,
        tier: validatedData.tier,
        default_rate_per_day: validatedData.default_rate_per_day,
        notes: validatedData.notes,
        status: validatedData.status || 'ACTIVE'
      })
      .select(`
        *,
        roles:role_id (
          id,
          name
        )
      `)
      .single()

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
    
    const body = await request.json()
    const validatedData = TeamMemberFormSchema.partial().parse(body)

    const { data: updatedMember, error } = await supabaseAdmin
      .from('team_members')
      .update(validatedData)
      .eq('id', id)
      .select(`
        *,
        roles:role_id (
          id,
          name
        )
      `)
      .single()

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

    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', id)

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
