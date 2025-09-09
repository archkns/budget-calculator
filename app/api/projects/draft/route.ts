import { NextRequest, NextResponse } from 'next/server'

interface DraftData {
  id: number
  name: string
  client: string
  currency_code: string
  currency_symbol: string
  hours_per_day: number
  tax_enabled: boolean
  tax_percentage: number
  proposed_price: number | null
  working_week: string
  assignments: unknown[]
  holidays: unknown[]
  createdAt: string
  updatedAt: string
  status: string
}

// Mock drafts data - in a real app, this would come from a database
const mockDrafts: DraftData[] = []

export async function GET() {
  try {
    return NextResponse.json(mockDrafts)
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project, assignments, holidays } = body
    
    // Validate required fields
    if (!project || !project.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }
    
    // Check if draft already exists for this project
    const existingDraftIndex = mockDrafts.findIndex(d => d.id === project.id)
    
    const draftData = {
      id: project.id,
      ...project,
      assignments: assignments || [],
      holidays: holidays || [],
      createdAt: existingDraftIndex === -1 ? new Date().toISOString() : mockDrafts[existingDraftIndex].createdAt,
      updatedAt: new Date().toISOString(),
      status: 'DRAFT'
    }
    
    if (existingDraftIndex !== -1) {
      // Update existing draft
      mockDrafts[existingDraftIndex] = draftData
    } else {
      // Create new draft
      mockDrafts.push(draftData)
    }
    
    return NextResponse.json(draftData, { status: 201 })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}
