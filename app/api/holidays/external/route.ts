import { NextRequest, NextResponse } from 'next/server'
import { getThaiHolidays } from '@/lib/data/thai-holidays'

// Available public holidays API sources
// const HOLIDAY_APIS = {
//   // MyHora API for Thai holidays (primary source)
//   myHora: 'https://www.myhora.com/calendar/ical/holiday.aspx?latest.json',
//   
//   // Local Thai holidays data (fallback)
//   thaiLocal: 'local'
// }


interface HolidayData {
  id?: string
  name: string
  date: string
  type?: string
  notes?: string
  country?: string
}



interface MyHoraEvent {
  'DTSTART;VALUE=DATE': string
  'DTEND;VALUE=DATE': string
  DTSTAMP: string
  UID: string
  CLASS: string
  CREATED: string
  DESCRIPTION: string
  'LAST-MODIFIED': string
  LOCATION: string
  SEQUENCE: string
  STATUS: string
  SUMMARY: string
  TRANSP: string
}

interface MyHoraCalendar {
  PRODID: string
  VERSION: string
  CALSCALE: string
  METHOD: string
  'X-WR-CALNAME': string
  'X-WR-TIMEZONE': string
  'X-WR-CALDESC': string
  VEVENT: MyHoraEvent[]
}

interface MyHoraResponse {
  VCALENDAR: MyHoraCalendar[]
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'myHora'
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    let holidays: HolidayData[] = []

    try {
      switch (source) {
        case 'myHora':
          holidays = await fetchMyHoraHolidays(year)
          break
        case 'thaiLocal':
          holidays = fetchLocalThaiHolidays(year)
          break
        default:
          holidays = await fetchMyHoraHolidays(year)
      }
    } catch (fetchError) {
      console.error(`Error fetching holidays from ${source}:`, fetchError)
      // Fallback to local Thai holidays
      try {
        holidays = fetchLocalThaiHolidays(year)
      } catch (fallbackError) {
        console.error('Local fallback also failed:', fallbackError)
        return NextResponse.json(
          { error: 'Failed to fetch holiday data from all sources' },
          { status: 500 }
        )
      }
    }

    // Transform and standardize the data to match database schema
    const standardizedHolidays = holidays.map((holiday, index) => ({
      id: holiday.id || `holiday-${index}`,
      name: holiday.name,
      date: holiday.date,
      is_custom: false,
      project_id: null,
      type: holiday.type || 'public', // Keep for external API compatibility
      notes: holiday.notes || '',
      country: holiday.country || 'TH',
      source: source
    }))

    return NextResponse.json({
      success: true,
      source,
      year,
      count: standardizedHolidays.length,
      holidays: standardizedHolidays
    })

  } catch (error) {
    console.error('Error in external holidays API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch external holiday data' },
      { status: 500 }
    )
  }
}


/**
 * Fetches Thai holidays from MyHora API
 * MyHora provides comprehensive Thai holiday data in iCal format
 * This is the primary source for Thai holidays as it's reliable and up-to-date
 */
async function fetchMyHoraHolidays(year: string): Promise<HolidayData[]> {
  try {
    const url = 'https://www.myhora.com/calendar/ical/holiday.aspx?latest.json'
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Budget Calculator App'
      }
    })

    if (!response.ok) {
      throw new Error(`MyHora API responded with status: ${response.status}`)
    }

    const data: MyHoraResponse = await response.json()
    
    // Extract holidays from the iCal data
    const holidays: HolidayData[] = []
    
    if (data.VCALENDAR && data.VCALENDAR.length > 0) {
      const calendar = data.VCALENDAR[0]
      
      if (calendar.VEVENT) {
        calendar.VEVENT.forEach(event => {
          // Parse the date from DTSTART;VALUE=DATE format (YYYYMMDD)
          const dateStr = event['DTSTART;VALUE=DATE']
          if (dateStr && dateStr.length === 8) {
            const yearFromDate = dateStr.substring(0, 4)
            const month = dateStr.substring(4, 6)
            const day = dateStr.substring(6, 8)
            const formattedDate = `${yearFromDate}-${month}-${day}`
            
            // Filter by requested year
            if (yearFromDate === year) {
              // Determine holiday type based on summary
              let type = 'public'
              const summary = event.SUMMARY.toLowerCase()
              
              if (summary.includes('buddha') || summary.includes('buddhist') || 
                  summary.includes('makha') || summary.includes('visakha') || 
                  summary.includes('asaha') || summary.includes('เข้าพรรษา')) {
                type = 'religious'
              } else if (summary.includes('จักรี') || summary.includes('ฉัตรมงคล') || 
                        summary.includes('เฉลิม') || summary.includes('ปิยมหาราช') || 
                        summary.includes('รัฐธรรมนูญ') || summary.includes('พ่อ') || 
                        summary.includes('แม่') || summary.includes('นวมินทรมหาราช')) {
                type = 'national'
              }
              
              holidays.push({
                id: event.UID,
                name: event.SUMMARY,
                date: formattedDate,
                type: type,
                notes: event.DESCRIPTION || '',
                country: 'TH'
              })
            }
          }
        })
      }
    }

    // Sort holidays by date
    holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    console.log(`Successfully fetched ${holidays.length} Thai holidays from MyHora for ${year}`)
    return holidays
  } catch (error) {
    console.error('MyHora API error:', error)
    // Fallback to local Thai holidays if MyHora fails
    console.log('Falling back to local Thai holidays due to MyHora API error...')
    return fetchLocalThaiHolidays(year)
  }
}


function fetchLocalThaiHolidays(year: string): HolidayData[] {
  const thaiHolidays = getThaiHolidays(parseInt(year))
  
  return thaiHolidays.map(holiday => ({
    id: holiday.id,
    name: holiday.nameEn,
    date: holiday.date,
    type: holiday.type,
    notes: holiday.notes || '',
    country: 'TH'
  }))
}

// POST endpoint to sync external holidays to database
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'myHora'
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const projectId = searchParams.get('projectId')

    // Fetch external holidays
    const response = await fetch(`${request.url.split('?')[0]}?source=${source}&year=${year}`)
    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(
        { error: 'Failed to fetch external holidays' },
        { status: 500 }
      )
    }

    // Import the Supabase client
    const { supabaseAdmin, isSupabaseConfigured } = await import('@/lib/supabase')

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Insert holidays into database with proper transformation
    const holidaysToInsert = data.holidays.map((holiday: Record<string, unknown>) => ({
      name: holiday.name as string,
      date: holiday.date as string,
      is_custom: (holiday.is_custom as boolean) || false,
      project_id: projectId ? parseInt(projectId) : null
    }))

    const { data: insertedHolidays, error } = await supabaseAdmin()
      .from('public_holidays')
      .insert(holidaysToInsert)
      .select()

    if (error) {
      console.error('Error inserting holidays:', error)
      return NextResponse.json(
        { error: 'Failed to save holidays to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedHolidays.length} holidays`,
      source,
      year,
      holidays: insertedHolidays
    })

  } catch (error) {
    console.error('Error syncing external holidays:', error)
    return NextResponse.json(
      { error: 'Failed to sync external holidays' },
      { status: 500 }
    )
  }
}
