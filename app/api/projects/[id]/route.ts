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


    const { data: project, error } = await supabaseAdmin()
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch project' },
        { status: 500 }
      )
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    
        // currency_symbol is not stored in the database - currency symbols are derived from currency_code
    const validatedBody = { ...body }
    delete validatedBody.currency_symbol
    
    // Validate required fields and data types
    if (validatedBody.name !== undefined && (typeof validatedBody.name !== 'string' || validatedBody.name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Project name must be a non-empty string' },
        { status: 400 }
      )
    }
    
    if (validatedBody.currency_code !== undefined && (typeof validatedBody.currency_code !== 'string' || validatedBody.currency_code.length !== 3)) {
      return NextResponse.json(
        { error: 'Currency code must be a 3-character string' },
        { status: 400 }
      )
    }
    
    if (validatedBody.hours_per_day !== undefined && (typeof validatedBody.hours_per_day !== 'number' || validatedBody.hours_per_day < 1 || validatedBody.hours_per_day > 24)) {
      return NextResponse.json(
        { error: 'Hours per day must be a number between 1 and 24' },
        { status: 400 }
      )
    }
    
    if (validatedBody.tax_percentage !== undefined && (typeof validatedBody.tax_percentage !== 'number' || validatedBody.tax_percentage < 0 || validatedBody.tax_percentage > 100)) {
      return NextResponse.json(
        { error: 'Tax percentage must be a number between 0 and 100' },
        { status: 400 }
      )
    }
    
    if (validatedBody.working_week !== undefined && !['MON_TO_FRI', 'MON_TO_SAT', 'CUSTOM'].includes(validatedBody.working_week)) {
      return NextResponse.json(
        { error: 'Working week must be one of: MON_TO_FRI, MON_TO_SAT, CUSTOM' },
        { status: 400 }
      )
    }
    
    if (validatedBody.status !== undefined && !['ACTIVE', 'DRAFT', 'COMPLETED', 'CANCELLED'].includes(validatedBody.status)) {
      return NextResponse.json(
        { error: 'Status must be one of: ACTIVE, DRAFT, COMPLETED, CANCELLED' },
        { status: 400 }
      )
    }
    
    // Validate numeric fields
    if (validatedBody.execution_days !== undefined && (typeof validatedBody.execution_days !== 'number' || validatedBody.execution_days < 0)) {
      return NextResponse.json(
        { error: 'Execution days must be a non-negative number' },
        { status: 400 }
      )
    }
    
    if (validatedBody.buffer_days !== undefined && (typeof validatedBody.buffer_days !== 'number' || validatedBody.buffer_days < 0)) {
      return NextResponse.json(
        { error: 'Buffer days must be a non-negative number' },
        { status: 400 }
      )
    }
    
    if (validatedBody.guarantee_days !== undefined && (typeof validatedBody.guarantee_days !== 'number' || validatedBody.guarantee_days < 0)) {
      return NextResponse.json(
        { error: 'Guarantee days must be a non-negative number' },
        { status: 400 }
      )
    }
    
    if (validatedBody.proposed_price !== undefined && validatedBody.proposed_price !== null && (typeof validatedBody.proposed_price !== 'number' || validatedBody.proposed_price < 0)) {
      return NextResponse.json(
        { error: 'Proposed price must be a non-negative number or null' },
        { status: 400 }
      )
    }

    const { data: updatedProject, error } = await supabaseAdmin()
      .from('projects')
      .update({
        ...validatedBody,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return NextResponse.json(
        { error: `Failed to update project: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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


    const { error } = await supabaseAdmin()
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
