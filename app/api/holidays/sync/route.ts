import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
import { PublicHolidaySchema } from '@/lib/schemas'
import { holidayService } from '@/lib/db/holidays'

export const runtime = 'nodejs'

interface HolidayData {
  id?: string
  name: string
  date: string
  type?: string
  notes?: string
  country?: string
}

/**
 * Sync holidays from external API to database
 * This endpoint fetches holidays from external sources and updates the database
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'thaiLocal'
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const projectId = searchParams.get('projectId')
    const overwrite = searchParams.get('overwrite') === 'true'

    console.log(`Syncing holidays from ${source} for year ${year}`)

    // Fetch holidays from external source
    let holidays: HolidayData[] = []

    try {
      switch (source) {
        case 'thaiLocal':
          holidays = await fetchLocalThaiHolidays(year)
          break
        case 'external':
          holidays = await fetchExternalHolidays(year)
          break
        case 'iapp':
          holidays = await fetchIAppThaiHolidays(year)
          break
        default:
          holidays = await fetchLocalThaiHolidays(year)
      }
    } catch (fetchError) {
      console.error(`Error fetching holidays from ${source}:`, fetchError)
      return NextResponse.json(
        { 
          error: `Failed to fetch holidays from ${source}`,
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    if (holidays.length === 0) {
      return NextResponse.json(
        { error: 'No holidays found for the specified year' },
        { status: 404 }
      )
    }

    // Check if holidays already exist for this year
    const existingHolidays = await holidayService.getHolidays({
      year: parseInt(year),
      isCustom: false
    })

    // If overwrite is false and holidays exist, return existing holidays
    if (!overwrite && existingHolidays.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Holidays already exist for ${year}. Use overwrite=true to replace them.`,
        existingCount: existingHolidays.length,
        holidays: existingHolidays
      })
    }

    // Prepare holidays for insertion
    const holidaysToInsert = holidays.map(holiday => ({
      name: holiday.name,
      date: holiday.date,
      is_custom: false,
      project_id: projectId ? parseInt(projectId) : null
    }))

    // Use holidays directly without validation for now
    const validatedHolidays = holidaysToInsert

    // Sync holidays using the holiday service
    const syncResult = await holidayService.syncHolidays(
      validatedHolidays,
      parseInt(year),
      overwrite
    )

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncResult.inserted} holidays from ${source}`,
      source,
      year,
      count: syncResult.inserted,
      deleted: syncResult.deleted,
      overwrite,
      holidays: syncResult.holidays
    })

  } catch (error) {
    console.error('Error syncing holidays:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync holidays',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get sync status and available sources
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get holiday statistics for the year
    const stats = await holidayService.getHolidayStats(parseInt(year))
    const existingHolidays = await holidayService.getHolidays({
      year: parseInt(year)
    })

    return NextResponse.json({
      success: true,
      year,
      status: stats,
      availableSources: [
        { id: 'thaiLocal', name: 'Thai Local Holidays', description: 'Local Thai holiday data (recommended)' },
        { id: 'iapp', name: 'iApp Thai Holiday API', description: 'Official Thai holiday data from iApp Technology' },
        { id: 'external', name: 'MyHora API', description: 'External MyHora API (may be blocked by anti-bot protection)' }
      ],
      existingHolidays
    })

  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

/**
 * Fetch Thai holidays from local data
 */
async function fetchLocalThaiHolidays(year: string): Promise<HolidayData[]> {
  try {
    // Import the local Thai holidays data
    const { getThaiHolidays } = await import('@/lib/data/thai-holidays')
    const thaiHolidays = getThaiHolidays(parseInt(year))
    
    return thaiHolidays.map(holiday => ({
      id: `thai-${holiday.date}`,
      name: holiday.name,
      date: holiday.date,
      type: 'public',
      notes: holiday.notes || '',
      country: 'TH'
    }))
  } catch (error) {
    console.error('Error fetching local Thai holidays:', error)
    throw new Error('Failed to fetch local Thai holidays')
  }
}

/**
 * Fetch holidays from MyHora API
 * MyHora provides comprehensive Thai holiday data in JSON format
 */
async function fetchExternalHolidays(year: string): Promise<HolidayData[]> {
  try {
    console.log(`Fetching holidays from MyHora API for year ${year}`)
    
    const response = await fetch('https://www.myhora.com/calendar/ical/holiday.aspx?latest.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.myhora.com/',
        'Origin': 'https://www.myhora.com',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('MyHora API response structure:', Object.keys(data))

    // Parse MyHora JSON response
    const holidays: HolidayData[] = []
    
    // MyHora returns data in iCal format with VCALENDAR array
    if (data.VCALENDAR && Array.isArray(data.VCALENDAR)) {
      for (const calendar of data.VCALENDAR) {
        if (calendar.VEVENT && Array.isArray(calendar.VEVENT)) {
          for (const event of calendar.VEVENT) {
            // Extract date from DTSTART
            const dateStr = event['DTSTART;VALUE=DATE'] || event.DTSTART
            if (dateStr) {
              // Convert from YYYYMMDD format to YYYY-MM-DD
              const formattedDate = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
              
              // Check if the holiday is in the requested year
              if (formattedDate.startsWith(year)) {
                // Extract holiday name from SUMMARY or DESCRIPTION
                let holidayName = event.SUMMARY || 'Thai Holiday'
                
                // If SUMMARY is not available, try to extract from DESCRIPTION
                if (!event.SUMMARY && event.DESCRIPTION) {
                  // DESCRIPTION often contains the holiday name in Thai
                  const desc = event.DESCRIPTION
                  // Try to extract the first line or meaningful part
                  const lines = desc.split('\n')
                  if (lines.length > 0) {
                    holidayName = lines[0].trim()
                  }
                }
                
                holidays.push({
                  id: `myhora-${event.UID || formattedDate}`,
                  name: holidayName,
                  date: formattedDate,
                  type: 'public',
                  notes: event.DESCRIPTION || '',
                  country: 'TH'
                })
              }
            }
          }
        }
      }
    }

    console.log(`Found ${holidays.length} holidays from MyHora for year ${year}`)
    return holidays

  } catch (error) {
    console.error('Error fetching external holidays from MyHora:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    
    // Provide helpful error message for common issues
    if (error instanceof Error && error.message.includes('403')) {
      throw new Error('MyHora API is blocking requests (403 Forbidden). This is likely due to anti-bot protection. Please use the local Thai holidays source instead.')
    }
    
    throw new Error(`Failed to fetch external holidays from MyHora API: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Fetch holidays from iApp Thai Holiday Data API
 * Official Thai holiday data from iApp Technology
 */
async function fetchIAppThaiHolidays(year: string): Promise<HolidayData[]> {
  try {
    const apiKey = process.env.THAI_HOLIDAY_API_KEY
    
    if (!apiKey) {
      throw new Error('Thai Holiday API key not configured. Please set THAI_HOLIDAY_API_KEY environment variable.')
    }

    console.log(`Fetching holidays from iApp Thai Holiday API for year ${year}`)
    
    // Calculate days from start of year to end of year
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year}-12-31`)
    const daysAfter = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const response = await fetch(`https://api.iapp.co.th/data/thai-holidays/holidays?holiday_type=public&days_after=${daysAfter}`, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'Budget-Calculator/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('iApp API response structure:', Object.keys(data))

    // Parse iApp API response
    const holidays: HolidayData[] = []
    
    if (data.holidays && Array.isArray(data.holidays)) {
      for (const holiday of data.holidays) {
        // Filter holidays for the requested year
        if (holiday.date && holiday.date.startsWith(year)) {
          holidays.push({
            id: `iapp-${holiday.date}`,
            name: holiday.name || 'Thai Holiday',
            date: holiday.date,
            type: holiday.type || 'public',
            notes: holiday.weekday ? `Day: ${holiday.weekday}` : '',
            country: 'TH'
          })
        }
      }
    }

    console.log(`Found ${holidays.length} holidays from iApp API for year ${year}`)
    return holidays

  } catch (error) {
    console.error('Error fetching holidays from iApp API:', error)
    
    // Provide helpful error message for common issues
    if (error instanceof Error && error.message.includes('API key not configured')) {
      throw new Error('Thai Holiday API key not configured. Please set THAI_HOLIDAY_API_KEY environment variable.')
    }
    
    if (error instanceof Error && error.message.includes('401')) {
      throw new Error('Invalid API key for iApp Thai Holiday API. Please check your API key.')
    }
    
    throw new Error(`Failed to fetch holidays from iApp API: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
