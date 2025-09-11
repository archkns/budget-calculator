import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';

export const runtime = 'nodejs';

// PUT /api/currencies/exchange-rates - Update exchange rates for all currencies
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { exchange_rates } = body;

    if (!exchange_rates || typeof exchange_rates !== 'object') {
      return NextResponse.json(
        { error: 'Exchange rates object is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const now = new Date().toISOString();

    // Get all active currencies
    const { data: currencies, error: fetchError } = await supabase
      .from('currencies')
      .select('id, code, is_base_currency')
      .eq('is_active', true);

    if (fetchError) {
      const errorResponse = handleSupabaseError(fetchError, 'fetch currencies');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    // Update exchange rates for each currency
    const updatePromises = currencies.map(async (currency) => {
      if (currency.is_base_currency) {
        // Base currency always has rate of 1
        return supabase
          .from('currencies')
          .update({ 
            exchange_rate: 1.00000000,
            last_updated: now 
          })
          .eq('id', currency.id);
      } else {
        const rate = exchange_rates[currency.code];
        if (rate && typeof rate === 'number' && rate > 0) {
          return supabase
            .from('currencies')
            .update({ 
              exchange_rate: rate,
              last_updated: now 
            })
            .eq('id', currency.id);
        }
      }
    });

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating exchange rates:', errors);
      return NextResponse.json(
        { error: 'Failed to update some exchange rates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Exchange rates updated successfully',
      updated_at: now 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/currencies/exchange-rates - Get current exchange rates
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('code, name, symbol, exchange_rate, last_updated, is_base_currency')
      .eq('is_active', true)
      .order('is_base_currency', { ascending: false })
      .order('code', { ascending: true });

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch exchange rates');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    // Format the response
    const exchangeRates = currencies.reduce((acc, currency) => {
      acc[currency.code] = {
        name: currency.name,
        symbol: currency.symbol,
        rate: currency.exchange_rate,
        last_updated: currency.last_updated,
        is_base: currency.is_base_currency
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ exchange_rates: exchangeRates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
