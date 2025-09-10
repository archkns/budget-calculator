import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

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

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock response')
      // Return mock data for development
      const mockAssignments = [
        {
          id: 1,
          project_id: projectId,
          team_member_id: 1,
          custom_name: 'John Doe',
          custom_role: 'Senior Developer',
          custom_tier: 'SENIOR',
          daily_rate: 5000,
          days_allocated: 20,
          buffer_days: 5,
          total_mandays: 25,
          total_price: 125000,
          start_date: '2025-01-15',
          end_date: '2025-02-15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      return NextResponse.json(mockAssignments)
    }

    const { data: assignments, error } = await supabaseAdmin()
      .from('project_assignments')
      .select(`
        *,
        team_members:team_member_id (
          id,
          name,
          custom_role,
          tier,
          default_rate_per_day,
          roles:role_id (
            id,
            name
          )
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

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock response')
      const mockAssignment = {
        id: Date.now(),
        project_id: projectId,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json(mockAssignment, { status: 201 })
    }

    const assignmentData = {
      project_id: projectId,
      team_member_id: body.team_member_id || null,
      custom_name: body.custom_name || null,
      custom_role: body.custom_role || null,
      custom_tier: body.custom_tier || null,
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
          custom_role,
          tier,
          default_rate_per_day,
          roles:role_id (
            id,
            name
          )
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
