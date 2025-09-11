import { NextRequest, NextResponse } from 'next/server'
import { ProjectSchema } from '@/lib/schemas'
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id)
    const body = await request.json()
    const { name, client, startDate, endDate } = body

    if (!projectId || isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Valid project ID is required' },
        { status: 400 }
      )
    }

    // Fetch the original project
    const { data: originalProject, error: projectError } = await supabaseAdmin()
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      const { error, status } = handleSupabaseError(projectError, 'fetching original project')
      return NextResponse.json({ error }, { status })
    }

    if (!originalProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Fetch original project assignments
    const { data: originalAssignments, error: assignmentsError } = await supabaseAdmin()
      .from('project_assignments')
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
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (assignmentsError) {
      const { error, status } = handleSupabaseError(assignmentsError, 'fetching project assignments')
      return NextResponse.json({ error }, { status })
    }

    // Create duplicated project data
    const duplicatedProjectData = {
      name: name || `${originalProject.name} (Copy)`,
      client: client || originalProject.client,
      currency_code: originalProject.currency_code,
      hours_per_day: originalProject.hours_per_day,
      tax_enabled: originalProject.tax_enabled,
      tax_percentage: originalProject.tax_percentage,
      proposed_price: originalProject.proposed_price,
      allocated_budget: originalProject.allocated_budget,
      working_week: originalProject.working_week,
      custom_working_days: originalProject.custom_working_days,
      execution_days: originalProject.execution_days,
      buffer_days: originalProject.buffer_days,
      guarantee_days: originalProject.guarantee_days,
      start_date: startDate ? new Date(startDate) : null,
      end_date: endDate ? new Date(endDate) : null,
      status: 'DRAFT', // Always start duplicated projects as drafts
      // Remove template_id since we're duplicating from an actual project
      template_id: null
    }

    // Validate the duplicated project data
    const validatedProjectData = ProjectSchema.parse(duplicatedProjectData)

    // Create the new project
    const { data: newProject, error: createError } = await supabaseAdmin()
      .from('projects')
      .insert([validatedProjectData])
      .select()
      .single()

    if (createError) {
      const { error, status } = handleSupabaseError(createError, 'creating duplicated project')
      return NextResponse.json({ error }, { status })
    }

    // Duplicate project assignments
    if (originalAssignments && originalAssignments.length > 0) {
      const duplicatedAssignments = originalAssignments.map(assignment => ({
        project_id: newProject.id,
        team_member_id: null, // Reset team member assignment
        role_id: assignment.role_id,
        level_id: assignment.level_id,
        daily_rate: assignment.daily_rate,
        days_allocated: assignment.days_allocated,
        buffer_days: assignment.buffer_days,
        is_required: assignment.is_required,
        sort_order: assignment.sort_order,
        notes: assignment.notes
      }))

      const { error: assignmentsCreateError } = await supabaseAdmin()
        .from('project_assignments')
        .insert(duplicatedAssignments)

      if (assignmentsCreateError) {
        const { error, status } = handleSupabaseError(assignmentsCreateError, 'creating project assignments')
        return NextResponse.json({ error }, { status })
      }
    }

    // Fetch the complete new project with assignments for response
    const { data: completeProject, error: fetchError } = await supabaseAdmin()
      .from('projects')
      .select(`
        *,
        assignments:project_assignments (
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
        )
      `)
      .eq('id', newProject.id)
      .single()

    if (fetchError) {
      const { error, status } = handleSupabaseError(fetchError, 'fetching complete project')
      return NextResponse.json({ error }, { status })
    }

    return NextResponse.json({
      project: completeProject,
      originalProject: originalProject,
      duplicatedAssignments: originalAssignments?.length || 0
    }, { status: 201 })

  } catch (error) {
    console.error('Error duplicating project:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate project' },
      { status: 500 }
    )
  }
}
