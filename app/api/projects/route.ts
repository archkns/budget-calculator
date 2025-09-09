import { NextRequest, NextResponse } from 'next/server'

// Mock projects data - in a real app, this would come from a database
const mockProjects = []

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(mockProjects)
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
    const projectData = body.project || body
    
    // Validate required fields
    if (!projectData || !projectData.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }
    
    const newProject = {
      id: mockProjects.length + 1,
      name: projectData.name,
      client: projectData.client || '',
      currency_code: projectData.currency_code || 'THB',
      currency_symbol: projectData.currency_symbol || '฿',
      hours_per_day: projectData.hours_per_day || 7,
      tax_enabled: projectData.tax_enabled || false,
      tax_percentage: projectData.tax_percentage || 7,
      proposed_price: projectData.proposed_price || null,
      working_week: projectData.working_week || 'MON_TO_FRI',
      // Default timeline values that will be configured in the workspace
      execution_days: 0,
      buffer_days: 0,
      guarantee_days: 8,
      start_date: null,
      end_date: null,
      calendar_mode: false,
      // Additional fields
      assignments: body.assignments || [],
      holidays: body.holidays || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: projectData.status || 'ACTIVE'
    }
    
    mockProjects.push(newProject)
    
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
