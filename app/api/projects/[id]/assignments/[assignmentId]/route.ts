import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const { id, assignmentId } = await params
    const projectId = parseInt(id)
    const assignmentIdNum = parseInt(assignmentId)
    
    if (isNaN(projectId) || isNaN(assignmentIdNum)) {
      return NextResponse.json(
        { error: 'Invalid project ID or assignment ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    

    const updateData: {
      daily_rate?: number;
      days_allocated?: number;
      buffer_days?: number;
      start_date?: string;
      end_date?: string;
      role_id?: number;
      level_id?: number;
    } = {}
    
    // Map frontend fields to database fields
    if (body.dailyRate !== undefined) updateData.daily_rate = parseFloat(body.dailyRate)
    if (body.daysAllocated !== undefined) updateData.days_allocated = parseInt(body.daysAllocated)
    if (body.bufferDays !== undefined) updateData.buffer_days = parseInt(body.bufferDays)
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate
    if (body.roleId !== undefined) updateData.role_id = body.roleId
    if (body.levelId !== undefined) updateData.level_id = body.levelId

    const { data: updatedAssignment, error } = await supabaseAdmin()
      .from('project_assignments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentIdNum)
      .eq('project_id', projectId)
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
      console.error('Error updating project assignment:', error)
      return NextResponse.json(
        { error: 'Failed to update project assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error('Error updating project assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update project assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const { id, assignmentId } = await params
    const projectId = parseInt(id)
    const assignmentIdNum = parseInt(assignmentId)
    
    if (isNaN(projectId) || isNaN(assignmentIdNum)) {
      return NextResponse.json(
        { error: 'Invalid project ID or assignment ID' },
        { status: 400 }
      )
    }


    const { error } = await supabaseAdmin()
      .from('project_assignments')
      .delete()
      .eq('id', assignmentIdNum)
      .eq('project_id', projectId)

    if (error) {
      console.error('Error deleting project assignment:', error)
      return NextResponse.json(
        { error: 'Failed to delete project assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting project assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete project assignment' },
      { status: 500 }
    )
  }
}
