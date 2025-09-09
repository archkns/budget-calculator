import { NextRequest, NextResponse } from 'next/server'

// Mock team data - in a real app, this would come from a database
const mockTeamMembers = [
  {
    id: 1,
    name: 'John Smith',
    role: 'Frontend Dev',
    level: 'Senior',
    dailyRate: 14000,
    status: 'ACTIVE',
    notes: 'React specialist'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    role: 'Experience Designer (UX/UI)',
    level: 'Team Lead',
    dailyRate: 18000,
    status: 'ACTIVE',
    notes: 'Lead designer with 8+ years experience'
  },
  {
    id: 3,
    name: 'Mike Chen',
    role: 'Backend Dev',
    level: 'Senior',
    dailyRate: 14000,
    status: 'INACTIVE',
    notes: 'Node.js and Python expert'
  },
  {
    id: 4,
    name: 'Lisa Wong',
    role: 'Mobile Developer',
    level: 'Senior',
    dailyRate: 15000,
    status: 'ACTIVE',
    notes: 'iOS and Android development'
  },
  {
    id: 5,
    name: 'David Park',
    role: 'DevOps Engineer',
    level: 'Mid',
    dailyRate: 12000,
    status: 'ACTIVE',
    notes: 'AWS and Docker specialist'
  },
  {
    id: 6,
    name: 'Emma Wilson',
    role: 'QA Engineer',
    level: 'Mid',
    dailyRate: 10000,
    status: 'ACTIVE',
    notes: 'Automation testing expert'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let filteredMembers = mockTeamMembers
    
    if (status) {
      filteredMembers = mockTeamMembers.filter(member => 
        member.status.toLowerCase() === status.toLowerCase()
      )
    }
    
    return NextResponse.json(filteredMembers)
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, role, level, dailyRate, status, notes } = body
    
    // Validate required fields
    if (!name || !role || !level || !dailyRate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const newMember = {
      id: Math.max(...mockTeamMembers.map(m => m.id)) + 1,
      name,
      role,
      level,
      dailyRate: parseFloat(dailyRate),
      status: status || 'ACTIVE',
      notes: notes || ''
    }
    
    mockTeamMembers.push(newMember)
    
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
    const memberIndex = mockTeamMembers.findIndex(m => m.id === parseInt(id))
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }
    
    mockTeamMembers[memberIndex] = {
      ...mockTeamMembers[memberIndex],
      ...body,
      id: parseInt(id)
    }
    
    return NextResponse.json(mockTeamMembers[memberIndex])
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
    
    const memberIndex = mockTeamMembers.findIndex(m => m.id === parseInt(id))
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }
    
    mockTeamMembers.splice(memberIndex, 1)
    
    return NextResponse.json({ message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
