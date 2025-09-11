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
    
    console.log('Auto-sync endpoint called', { force })
    
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
    const autoSyncResult = await performAutoSync()
    
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
    
    // Fetch financial holidays in smaller chunks to avoid API limitations
    const chunkSize = 90 // 3 months at a time
    const totalDays = 365
    const allHolidays: any[] = []
    
    for (let offset = 0; offset < totalDays; offset += chunkSize) {
      const currentChunkSize = Math.min(chunkSize, totalDays - offset)
      console.log(`Auto-sync fetching chunk: ${offset} to ${offset + currentChunkSize} days`)
      
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
          console.log(`Auto-sync chunk response: ${financialData.holidays?.length || 0} financial holidays found`)

          if (financialData.holidays && Array.isArray(financialData.holidays)) {
            for (const holiday of financialData.holidays) {
              allHolidays.push({
                date: holiday.date,
                name: holiday.name || 'Thai Financial Holiday',
                is_custom: false
              })
            }
          }
        } else {
          console.warn(`Auto-sync chunk failed with status: ${financialResponse.status}`)
        }
      } catch (chunkError) {
        console.warn(`Auto-sync chunk error:`, chunkError)
      }
      
      // Break after first successful chunk to avoid duplicates
      if (allHolidays.length > 0) {
        break
      }
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
