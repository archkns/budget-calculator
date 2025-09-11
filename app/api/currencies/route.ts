import { NextRequest, NextResponse } from 'next/server'
import { currencyService } from '@/lib/db/currencies'

export const runtime = 'nodejs'

/**
 * GET /api/currencies
 * Get all currencies or active currencies only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const currencies = activeOnly 
      ? await currencyService.getActiveCurrencies()
      : await currencyService.getAllCurrencies()

    return NextResponse.json({
      success: true,
      currencies,
      count: currencies.length
    })
  } catch (error) {
    console.error('Error fetching currencies:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/currencies
 * Create a new currency
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.code || !body.name || !body.symbol) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          message: 'code, name, and symbol are required'
        },
        { status: 400 }
      )
    }

    // Validate currency code format
    if (!/^[A-Z]{3}$/.test(body.code)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid currency code',
          message: 'Currency code must be 3 uppercase letters (ISO 4217 format)'
        },
        { status: 400 }
      )
    }

    const currency = await currencyService.createCurrency(body)

    return NextResponse.json({
      success: true,
      currency,
      message: 'Currency created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating currency:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create currency',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
