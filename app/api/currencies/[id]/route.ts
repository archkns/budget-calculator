import { NextRequest, NextResponse } from 'next/server'
import { currencyService } from '@/lib/db/currencies'

export const runtime = 'nodejs'

/**
 * GET /api/currencies/[id]
 * Get a specific currency by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid currency ID',
          message: 'Currency ID must be a number'
        },
        { status: 400 }
      )
    }

    const currencies = await currencyService.getAllCurrencies()
    const currency = currencies.find(c => c.id === id)

    if (!currency) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Currency not found',
          message: `Currency with ID ${id} not found`
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      currency
    })
  } catch (error) {
    console.error('Error fetching currency:', error)
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

/**
 * PUT /api/currencies/[id]
 * Update a specific currency
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid currency ID',
          message: 'Currency ID must be a number'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Remove code from update data as it shouldn't be changed
    const { code, ...updateData } = body

    const currency = await currencyService.updateCurrency(id, updateData)

    return NextResponse.json({
      success: true,
      currency,
      message: 'Currency updated successfully'
    })
  } catch (error) {
    console.error('Error updating currency:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update currency',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/currencies/[id]
 * Delete a specific currency (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid currency ID',
          message: 'Currency ID must be a number'
        },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      await currencyService.hardDeleteCurrency(id)
    } else {
      await currencyService.deleteCurrency(id)
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Currency permanently deleted' : 'Currency deactivated'
    })
  } catch (error) {
    console.error('Error deleting currency:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete currency',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
