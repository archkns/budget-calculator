import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Mock holidays data for demonstration
let mockHolidays = [
  {
    id: 1,
    name: 'New Year\'s Day',
    date: '2025-01-01',
    type: 'public',
    project_id: null
  },
  {
    id: 2,
    name: 'Makha Bucha Day',
    date: '2025-02-12',
    type: 'public',
    project_id: null
  },
  {
    id: 3,
    name: 'Chakri Memorial Day',
    date: '2025-04-06',
    type: 'public',
    project_id: null
  },
  {
    id: 4,
    name: 'Songkran Festival',
    date: '2025-04-13',
    type: 'public',
    project_id: null
  },
  {
    id: 5,
    name: 'Songkran Festival',
    date: '2025-04-14',
    type: 'public',
    project_id: null
  },
  {
    id: 6,
    name: 'Songkran Festival',
    date: '2025-04-15',
    type: 'public',
    project_id: null
  },
  {
    id: 7,
    name: 'Labour Day',
    date: '2025-05-01',
    type: 'public',
    project_id: null
  },
  {
    id: 8,
    name: 'Coronation Day',
    date: '2025-05-04',
    type: 'public',
    project_id: null
  },
  {
    id: 9,
    name: 'Visakha Bucha Day',
    date: '2025-05-12',
    type: 'public',
    project_id: null
  },
  {
    id: 10,
    name: 'Royal Ploughing Ceremony',
    date: '2025-05-19',
    type: 'public',
    project_id: null
  },
  {
    id: 11,
    name: 'Asanha Bucha Day',
    date: '2025-07-10',
    type: 'public',
    project_id: null
  },
  {
    id: 12,
    name: 'Buddhist Lent Day',
    date: '2025-07-11',
    type: 'public',
    project_id: null
  },
  {
    id: 13,
    name: 'HM King\'s Birthday',
    date: '2025-07-28',
    type: 'public',
    project_id: null
  },
  {
    id: 14,
    name: 'HM Queen\'s Birthday',
    date: '2025-08-12',
    type: 'public',
    project_id: null
  },
  {
    id: 15,
    name: 'Chulalongkorn Day',
    date: '2025-10-23',
    type: 'public',
    project_id: null
  },
  {
    id: 16,
    name: 'HM King\'s Birthday',
    date: '2025-12-05',
    type: 'public',
    project_id: null
  },
  {
    id: 17,
    name: 'Constitution Day',
    date: '2025-12-10',
    type: 'public',
    project_id: null
  },
  {
    id: 18,
    name: 'New Year\'s Eve',
    date: '2025-12-31',
    type: 'public',
    project_id: null
  },
  // Project-specific holidays
  {
    id: 19,
    name: 'Company Retreat',
    date: '2025-11-15',
    type: 'company',
    project_id: 1
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    
    let filteredHolidays = mockHolidays;
    
    if (projectId) {
      // Return public holidays + project-specific holidays
      filteredHolidays = mockHolidays.filter(h => 
        h.type === 'public' || h.project_id === parseInt(projectId)
      );
    }
    
    return NextResponse.json(filteredHolidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, type, project_id } = body;
    
    if (!name || !date || !type) {
      return NextResponse.json(
        { error: 'Name, date, and type are required' },
        { status: 400 }
      );
    }
    
    const newHoliday = {
      id: mockHolidays.length + 1,
      name,
      date,
      type,
      project_id: project_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockHolidays.push(newHoliday);
    
    return NextResponse.json(newHoliday, { status: 201 });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Holiday ID is required' },
        { status: 400 }
      );
    }
    
    const holidayIndex = mockHolidays.findIndex(h => h.id === parseInt(id));
    
    if (holidayIndex === -1) {
      return NextResponse.json(
        { error: 'Holiday not found' },
        { status: 404 }
      );
    }
    
    mockHolidays.splice(holidayIndex, 1);
    
    return NextResponse.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json(
      { error: 'Failed to delete holiday' },
      { status: 500 }
    );
  }
}
