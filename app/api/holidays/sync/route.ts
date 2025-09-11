import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
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
        case 'iapp':
          holidays = await fetchIAppThaiHolidays(year)
          break
        case 'thaiLocal':
          holidays = await fetchLocalThaiHolidays(year)
          break
        case 'external':
          holidays = await fetchExternalHolidays(year)
          break
        default:
          // Default to iApp API as first priority
          holidays = await fetchIAppThaiHolidays(year)
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
    const autoSync = searchParams.get('autoSync') === 'true'

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Check if auto-sync should be triggered
    if (autoSync) {
      const shouldAutoSync = checkAutoSyncSchedule()
      if (shouldAutoSync.shouldSync) {
        console.log(`Auto-sync triggered: ${shouldAutoSync.reason}`)
        try {
          // Perform auto-sync with iApp API for next 365 days
          const autoSyncResult = await performAutoSync()
          if (autoSyncResult.success) {
            console.log(`Auto-sync completed: ${autoSyncResult.count} holidays synced`)
          } else {
            console.warn(`Auto-sync failed: ${autoSyncResult.error}`)
          }
        } catch (autoSyncError) {
          console.error('Auto-sync error:', autoSyncError)
        }
      }
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
        { id: 'iapp', name: 'iApp Thai Holiday API', description: 'Official Thai holiday data from iApp Technology (recommended)' },
        { id: 'thaiLocal', name: 'Thai Local Holidays', description: 'Local Thai holiday data (fallback)' },
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

    console.log(`Fetching financial holidays from iApp Thai Holiday API for year ${year} (2 years ahead)`)
    
    const allHolidays: HolidayData[] = []
    
    // Fetch financial holidays in smaller chunks to avoid API limitations
    const chunkSize = 365 // 1 year at a time
    const today = new Date()
    const endDate = new Date(`${parseInt(year) + 2}-12-31`)
    const totalDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    console.log(`Fetching financial holidays in chunks of ${chunkSize} days (total: ${totalDays} days)`)
    
    for (let offset = 0; offset < totalDays; offset += chunkSize) {
      const currentChunkSize = Math.min(chunkSize, totalDays - offset)
      console.log(`Fetching financial holidays chunk: ${offset} to ${offset + currentChunkSize} days`)
      
      try {
        const financialResponse = await fetch(`https://api.iapp.co.th/data/thai-holidays/holidays?holiday_type=financial&days_after=${currentChunkSize}`, {
          headers: {
            'apikey': apiKey,
            'Accept': 'application/json',
            'User-Agent': 'Budget-Calculator/1.0'
          }
        })

        if (financialResponse.ok) {
          const financialData = await financialResponse.json()
          console.log(`iApp API response for chunk: ${financialData.holidays?.length || 0} financial holidays found`)

          // Process financial holidays
          if (financialData.holidays && Array.isArray(financialData.holidays)) {
            for (const holiday of financialData.holidays) {
              // Filter holidays for the requested year and next 2 years
              const holidayYear = parseInt(holiday.date.substring(0, 4))
              if (holidayYear >= parseInt(year) && holidayYear <= parseInt(year) + 2) {
                allHolidays.push({
                  id: `iapp-financial-${holiday.date}`,
                  name: holiday.name || 'Thai Financial Holiday',
                  date: holiday.date,
                  type: 'financial',
                  notes: holiday.weekday ? `Day: ${holiday.weekday} (Financial)` : 'Financial Holiday',
                  country: 'TH'
                })
              }
            }
          }
        } else {
          console.warn(`Financial holidays API returned status ${financialResponse.status} for chunk ${offset}-${offset + currentChunkSize}`)
        }
      } catch (chunkError) {
        console.warn(`Failed to fetch financial holidays for chunk ${offset}-${offset + currentChunkSize}:`, chunkError)
      }
      
      // Break after first successful chunk to avoid duplicates
      if (allHolidays.length > 0) {
        break
      }
    }

    console.log(`Found ${allHolidays.length} financial holidays from iApp API for years ${year}-${parseInt(year) + 2}`)
    return allHolidays

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

/**
 * Check if auto-sync should be triggered based on schedule (Jan 1 and Jul 1)
 */
function checkAutoSyncSchedule(): { shouldSync: boolean; reason: string } {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentDay = now.getDate()
  
  // Check if it's January 1st or July 1st
  if ((currentMonth === 1 && currentDay === 1) || (currentMonth === 7 && currentDay === 1)) {
    return {
      shouldSync: true,
      reason: `Scheduled auto-sync on ${currentMonth === 1 ? 'January 1st' : 'July 1st'}`
    }
  }
  
  return {
    shouldSync: false,
    reason: `Not a scheduled sync date (current: ${currentMonth}/${currentDay})`
  }
}

/**
 * Perform automatic sync of financial holidays for next 365 days
 */
async function performAutoSync(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const apiKey = process.env.THAI_HOLIDAY_API_KEY
    
    if (!apiKey) {
      return {
        success: false,
        count: 0,
        error: 'Thai Holiday API key not configured'
      }
    }

    console.log('Performing auto-sync: fetching financial holidays for next 365 days')
    
    // Fetch financial holidays for next 365 days
    const financialResponse = await fetch(`https://api.iapp.co.th/data/thai-holidays/holidays?holiday_type=financial&days_after=365`, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'Budget-Calculator/1.0'
      }
    })

    if (!financialResponse.ok) {
      return {
        success: false,
        count: 0,
        error: `HTTP error: ${financialResponse.status}`
      }
    }

    const financialData = await financialResponse.json()
    console.log(`Auto-sync API response: ${financialData.holidays?.length || 0} financial holidays found`)

    if (!financialData.holidays || !Array.isArray(financialData.holidays)) {
      return {
        success: false,
        count: 0,
        error: 'Invalid API response format'
      }
    }

    // Process and sync holidays
    const holidaysToInsert: HolidayData[] = []
    
    for (const holiday of financialData.holidays) {
      holidaysToInsert.push({
        id: `iapp-financial-${holiday.date}`,
        name: holiday.name || 'Thai Financial Holiday',
        date: holiday.date,
        type: 'financial',
        notes: holiday.weekday ? `Day: ${holiday.weekday} (Financial)` : 'Financial Holiday',
        country: 'TH'
      })
    }

    console.log(`Found ${holidaysToInsert.length} financial holidays from iApp API for next 365 days`)
    
    // Sync holidays to database
    const currentYear = new Date().getFullYear()
    const syncResult = await holidayService.syncHolidays(holidaysToInsert, currentYear, true)
    
    return {
      success: true,
      count: syncResult.inserted
    }

  } catch (error) {
    console.error('Auto-sync error:', error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
