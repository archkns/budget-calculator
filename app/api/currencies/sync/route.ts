import { NextRequest, NextResponse } from 'next/server'
import { currencyService } from '@/lib/db/currencies'

export const runtime = 'nodejs'

/**
 * POST /api/currencies/sync
 * Sync currencies with external API and update exchange rates
 */
export async function POST(request: NextRequest) {
  try {
    await currencyService.syncWithExternalAPI()

    // Get updated currencies
    const currencies = await currencyService.getActiveCurrencies()

    return NextResponse.json({
      success: true,
      message: 'Exchange rates synced successfully',
      currencies,
      count: currencies.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error syncing currencies:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/currencies/sync
 * Get sync status and last update information
 */
export async function GET(request: NextRequest) {
  try {
    const currencies = await currencyService.getActiveCurrencies()
    const baseCurrency = await currencyService.getBaseCurrency()

    // Find the most recent last_updated timestamp
    const lastUpdated = currencies.reduce((latest, currency) => {
      const currencyDate = new Date(currency.last_updated)
      return currencyDate > latest ? currencyDate : latest
    }, new Date(0))

    return NextResponse.json({
      success: true,
      sync: {
        lastUpdated: lastUpdated.toISOString(),
        currencyCount: currencies.length,
        baseCurrency: baseCurrency?.code || null,
        hasRecentUpdates: lastUpdated > new Date(Date.now() - 24 * 60 * 60 * 1000) // Within 24 hours
      },
      currencies: currencies.map(c => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        exchangeRate: c.exchange_rate,
        lastUpdated: c.last_updated,
        isBase: c.is_base_currency
      }))
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
