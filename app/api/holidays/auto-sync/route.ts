import { NextRequest, NextResponse } from 'next/server'
import { holidayService } from '@/lib/db/holidays'

export const runtime = 'nodejs'

/**
 * Auto-sync endpoint for financial holidays
 * Can be called manually or by cron jobs
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const days = parseInt(searchParams.get('days') || '365')
    
    console.log('Auto-sync endpoint called', { force, days })
    
    // Check if auto-sync should be triggered (unless forced)
    if (!force) {
      const shouldAutoSync = checkAutoSyncSchedule()
      if (!shouldAutoSync.shouldSync) {
        return NextResponse.json({
          success: false,
          message: 'Auto-sync not scheduled',
          reason: shouldAutoSync.reason,
          nextSyncDates: getNextSyncDates()
        })
      }
    }

    // Perform auto-sync
    const autoSyncResult = await performAutoSync(days)
    
    if (autoSyncResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Auto-sync completed successfully',
        count: autoSyncResult.count,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Auto-sync failed',
        error: autoSyncResult.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Auto-sync endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Auto-sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get auto-sync status and schedule information
 */
export async function GET() {
  try {
    const shouldAutoSync = checkAutoSyncSchedule()
    const nextSyncDates = getNextSyncDates()
    
    return NextResponse.json({
      success: true,
      shouldSync: shouldAutoSync.shouldSync,
      reason: shouldAutoSync.reason,
      nextSyncDates,
      schedule: {
        description: 'Auto-sync runs twice a year on January 1st and July 1st',
        dates: ['January 1st', 'July 1st'],
        purpose: 'Fetch financial holidays for the next 365 days'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Auto-sync status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get auto-sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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
 * Get the next scheduled sync dates
 */
function getNextSyncDates(): string[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  const nextSyncDates: string[] = []
  
  // Add January 1st of next year
  nextSyncDates.push(`${currentYear + 1}-01-01`)
  
  // Add July 1st of current year if we haven't passed it yet
  if (currentMonth < 7) {
    nextSyncDates.push(`${currentYear}-07-01`)
  } else {
    // Add July 1st of next year if we've passed it
    nextSyncDates.push(`${currentYear + 1}-07-01`)
  }
  
  return nextSyncDates.sort()
}

/**
 * Perform automatic sync of financial holidays for specified number of days
 */
async function performAutoSync(days: number = 365): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const apiKey = process.env.THAI_HOLIDAY_API_KEY
    
    if (!apiKey) {
      return {
        success: false,
        count: 0,
        error: 'Thai Holiday API key not configured'
      }
    }

    console.log(`Performing auto-sync: fetching financial holidays for next ${days} days`)
    
    // Fetch financial holidays in smaller chunks to avoid API limitations
    // The API seems to work best with smaller chunks (30-60 days)
    const chunkSize = 60 // 2 months at a time
    const totalDays = days
    const allHolidays: any[] = []
    const seenHolidays = new Set<string>() // To avoid duplicates
    
    // Try multiple chunks to get more data
    const chunkRanges = [
      { start: 0, end: chunkSize },
      { start: chunkSize, end: chunkSize * 2 },
      { start: chunkSize * 2, end: chunkSize * 3 },
      { start: chunkSize * 3, end: chunkSize * 4 },
      { start: chunkSize * 4, end: chunkSize * 5 },
      { start: chunkSize * 5, end: chunkSize * 6 },
      { start: chunkSize * 6, end: chunkSize * 7 },
      { start: chunkSize * 7, end: chunkSize * 8 },
      { start: chunkSize * 8, end: chunkSize * 9 },
      { start: chunkSize * 9, end: chunkSize * 10 },
      { start: chunkSize * 10, end: chunkSize * 11 },
      { start: chunkSize * 11, end: chunkSize * 12 }
    ]
    
    for (const range of chunkRanges) {
      if (range.start >= totalDays) break
      
      const currentChunkSize = Math.min(range.end - range.start, totalDays - range.start)
      console.log(`Auto-sync fetching chunk: ${range.start} to ${range.start + currentChunkSize} days`)
      
      try {
        // Fetch both financial and public holidays
        const [financialResponse, publicResponse] = await Promise.all([
          fetch(`https://api.iapp.co.th/data/thai-holidays/holidays?holiday_type=financial&days_after=${currentChunkSize}`, {
            headers: {
              'apikey': apiKey,
              'Accept': 'application/json',
              'User-Agent': 'Budget-Calculator/1.0'
            }
          }),
          fetch(`https://api.iapp.co.th/data/thai-holidays/holidays?holiday_type=public&days_after=${currentChunkSize}`, {
            headers: {
              'apikey': apiKey,
              'Accept': 'application/json',
              'User-Agent': 'Budget-Calculator/1.0'
            }
          })
        ])

        // Process financial holidays
        if (financialResponse.ok) {
          const financialData = await financialResponse.json()
          console.log(`Auto-sync financial chunk response: ${financialData.holidays?.length || 0} financial holidays found`)

          if (financialData.holidays && Array.isArray(financialData.holidays)) {
            for (const holiday of financialData.holidays) {
              // Avoid duplicates
              if (!seenHolidays.has(holiday.date)) {
                seenHolidays.add(holiday.date)
                allHolidays.push({
                  date: holiday.date,
                  name: holiday.name || 'Thai Financial Holiday',
                  is_custom: false
                })
              }
            }
          }
        } else {
          console.warn(`Auto-sync financial chunk failed with status: ${financialResponse.status}`)
        }

        // Process public holidays
        if (publicResponse.ok) {
          const publicData = await publicResponse.json()
          console.log(`Auto-sync public chunk response: ${publicData.holidays?.length || 0} public holidays found`)

          if (publicData.holidays && Array.isArray(publicData.holidays)) {
            for (const holiday of publicData.holidays) {
              // Avoid duplicates
              if (!seenHolidays.has(holiday.date)) {
                seenHolidays.add(holiday.date)
                allHolidays.push({
                  date: holiday.date,
                  name: holiday.name || 'Thai Holiday',
                  is_custom: false
                })
              }
            }
          }
        } else {
          console.warn(`Auto-sync public chunk failed with status: ${publicResponse.status}`)
        }
      } catch (chunkError) {
        console.warn(`Auto-sync chunk error:`, chunkError)
      }
      
      // Add a small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`Auto-sync total holidays found: ${allHolidays.length}`)
    
    if (allHolidays.length === 0) {
      return {
        success: false,
        count: 0,
        error: 'No financial holidays found'
      }
    }

    // Sync holidays to database (use current year)
    const currentYear = new Date().getFullYear()
    const syncResult = await holidayService.syncHolidays(allHolidays, currentYear, true)
    
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
