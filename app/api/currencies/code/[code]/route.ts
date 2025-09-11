import { NextRequest, NextResponse } from 'next/server'
import { currencyService } from '@/lib/db/currencies'

export const runtime = 'nodejs'

/**
 * GET /api/currencies/code/[code]
 * Get a specific currency by code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase()
    
    if (!/^[A-Z]{3}$/.test(code)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid currency code',
          message: 'Currency code must be 3 uppercase letters (ISO 4217 format)'
        },
        { status: 400 }
      )
    }

    const currency = await currencyService.getCurrencyByCode(code)

    if (!currency) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Currency not found',
          message: `Currency with code ${code} not found`
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      currency
    })
  } catch (error) {
    console.error('Error fetching currency by code:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch currency',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
