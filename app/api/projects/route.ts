import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { CreateProjectData } from '@/lib/types/database'

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array')
      return NextResponse.json([])
    }

    const { data: projects, error } = await supabaseAdmin()
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    const response = NextResponse.json(projects || [])
    
    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    
    return response
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
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
    
    // Handle both old format (with project wrapper) and new format (direct data)
    const projectData: CreateProjectData = (body as { project?: CreateProjectData }).project || (body as CreateProjectData)
    
    // Validate required fields
    if (!projectData || !projectData.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock response')
      // Return a mock response for development
      const mockProject = {
        id: Date.now(),
        name: projectData.name,
        client: projectData.client || null,
        currency_code: projectData.currency_code || 'THB',
        currency_symbol: projectData.currency_symbol || '฿',
        hours_per_day: projectData.hours_per_day || 7,
        tax_enabled: projectData.tax_enabled || false,
        tax_percentage: projectData.tax_percentage || 7,
        proposed_price: projectData.proposed_price || null,
        total_price: projectData.total_price || 0,
        working_week: projectData.working_week || 'MON_TO_FRI',
        execution_days: projectData.execution_days || 0,
        buffer_days: projectData.buffer_days || 0,
        guarantee_days: projectData.guarantee_days || 8,
        start_date: projectData.start_date || null,
        status: projectData.status || 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json(mockProject, { status: 201 })
    }
    
    // Prepare data for database insertion
    const insertData = {
      name: projectData.name,
      client: projectData.client || null,
      currency_code: projectData.currency_code || 'THB',
      currency_symbol: projectData.currency_symbol || '฿',
      hours_per_day: projectData.hours_per_day || 7,
      tax_enabled: projectData.tax_enabled || false,
      tax_percentage: projectData.tax_percentage || 7,
      proposed_price: projectData.proposed_price || null,
      total_price: projectData.total_price || 0, // Will be calculated by triggers
      working_week: projectData.working_week || 'MON_TO_FRI',
      execution_days: projectData.execution_days || 0,
      buffer_days: projectData.buffer_days || 0,
      guarantee_days: projectData.guarantee_days || 8,
      start_date: projectData.start_date || null,
      status: projectData.status || 'ACTIVE'
    }
    
    // Insert project into database
    const { data: newProject, error } = await supabaseAdmin()
      .from('projects')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating project:', error)
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
