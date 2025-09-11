import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }


    const { data: assignments, error } = await supabaseAdmin()
      .from('project_assignments')
      .select(`
        *,
        team_members:team_member_id (
          id,
          name,
          default_rate_per_day,
          roles:role_id (
            id,
            name
          ),
          levels:level_id (
            id,
            name,
            display_name
          )
        ),
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
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching project assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch project assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json(assignments || [])
  } catch (error) {
    console.error('Error fetching project assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project assignments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.team_member_id && !body.custom_name) {
      return NextResponse.json(
        { error: 'Either team_member_id or custom_name is required' },
        { status: 400 }
      )
    }

    if (!body.daily_rate) {
      return NextResponse.json(
        { error: 'Daily rate is required' },
        { status: 400 }
      )
    }


    const assignmentData = {
      project_id: projectId,
      team_member_id: body.team_member_id || null,
      role_id: body.role_id || null,
      level_id: body.level_id || null,
      daily_rate: parseFloat(body.daily_rate),
      days_allocated: parseInt(body.days_allocated) || 0,
      buffer_days: parseInt(body.buffer_days) || 0,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
    }

    const { data: newAssignment, error } = await supabaseAdmin()
      .from('project_assignments')
      .insert(assignmentData)
      .select(`
        *,
        team_members:team_member_id (
          id,
          name,
          default_rate_per_day,
          roles:role_id (
            id,
            name
          ),
          levels:level_id (
            id,
            name,
            display_name
          )
        ),
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

    if (error) {
      console.error('Error creating project assignment:', error)
      return NextResponse.json(
        { error: 'Failed to create project assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json(newAssignment, { status: 201 })
  } catch (error) {
    console.error('Error creating project assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create project assignment' },
      { status: 500 }
    )
  }
}
