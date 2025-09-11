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
        default:
          holidays = await fetchLocalThaiHolidays(year)
      }
    } catch (fetchError) {
      console.error(`Error fetching holidays from ${source}:`, fetchError)
      return NextResponse.json(
        { error: `Failed to fetch holidays from ${source}` },
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
        { id: 'thaiLocal', name: 'Thai Local Holidays', description: 'Local Thai holiday data' },
        { id: 'external', name: 'External API', description: 'External holiday API (if available)' }
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
 * Fetch holidays from external API
 * This is a placeholder for external holiday APIs
 */
async function fetchExternalHolidays(year: string): Promise<HolidayData[]> {
  try {
    // This is a placeholder for external holiday APIs
    // You can implement actual external API calls here
    console.log(`Fetching external holidays for year ${year}`)
    
    // For now, return empty array as external API is not implemented
    return []
  } catch (error) {
    console.error('Error fetching external holidays:', error)
    throw new Error('Failed to fetch external holidays')
  }
}
