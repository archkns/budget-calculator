import { NextRequest, NextResponse } from 'next/server'
import { currencyService } from '@/lib/db/currencies'

export const runtime = 'nodejs'

/**
 * POST /api/currencies/convert
 * Convert amount between currencies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, from, to } = body

    // Validate required fields
    if (amount === undefined || !from || !to) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          message: 'amount, from, and to are required'
        },
        { status: 400 }
      )
    }

    // Validate amount
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount < 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid amount',
          message: 'Amount must be a positive number'
        },
        { status: 400 }
      )
    }

    // Validate currency codes
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid currency codes',
          message: 'Currency codes must be 3 uppercase letters (ISO 4217 format)'
        },
        { status: 400 }
      )
    }

    const convertedAmount = await currencyService.convertCurrency(
      numericAmount,
      from.toUpperCase(),
      to.toUpperCase()
    )

    const exchangeRate = await currencyService.getExchangeRate(
      from.toUpperCase(),
      to.toUpperCase()
    )

    return NextResponse.json({
      success: true,
      conversion: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        amount: numericAmount,
        convertedAmount,
        exchangeRate,
        calculation: `${numericAmount} ${from.toUpperCase()} = ${convertedAmount} ${to.toUpperCase()}`
      }
    })
  } catch (error) {
    console.error('Error converting currency:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to convert currency',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
