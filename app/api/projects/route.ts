import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateProjectData } from '@/lib/types/database'

export async function GET() {
  try {
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
    const body = await request.json()
    
    // Handle both old format (with project wrapper) and new format (direct data)
    const projectData: CreateProjectData = body.project || body
    
    // Validate required fields
    if (!projectData || !projectData.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
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
      working_week: projectData.working_week || 'MON_TO_FRI',
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
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
