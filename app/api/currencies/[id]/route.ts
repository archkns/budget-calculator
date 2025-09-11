import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { CurrencySchema } from '@/lib/schemas';
import { z } from 'zod';

export const runtime = 'nodejs';

// GET /api/currencies/[id] - Get a specific currency
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currencyId = parseInt(params.id);
    
    if (isNaN(currencyId)) {
      return NextResponse.json(
        { error: 'Invalid currency ID' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const { data: currency, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('id', currencyId)
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch currency');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ currency });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/currencies/[id] - Update a specific currency
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currencyId = parseInt(params.id);
    
    if (isNaN(currencyId)) {
      return NextResponse.json(
        { error: 'Invalid currency ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate the request body (excluding fields that shouldn't be updated directly)
    const validatedData = CurrencySchema.omit({ 
      id: true, 
      created_at: true, 
      updated_at: true 
    }).partial().parse(body);

    const supabase = supabaseAdmin();

    // Check if currency exists
    const { data: existingCurrency } = await supabase
      .from('currencies')
      .select('id, code')
      .eq('id', currencyId)
      .single();

    if (!existingCurrency) {
      return NextResponse.json(
        { error: 'Currency not found' },
        { status: 404 }
      );
    }

    // If currency code is being changed, check if new code already exists
    if (validatedData.code && validatedData.code !== existingCurrency.code) {
      const { data: duplicateCurrency } = await supabase
        .from('currencies')
        .select('id')
        .eq('code', validatedData.code)
        .single();

      if (duplicateCurrency) {
        return NextResponse.json(
          { error: 'Currency code already exists' },
          { status: 400 }
        );
      }
    }

    // If this is being set as base currency, unset any existing base currency
    if (validatedData.is_base_currency) {
      await supabase
        .from('currencies')
        .update({ is_base_currency: false })
        .eq('is_base_currency', true)
        .neq('id', currencyId);
    }

    // Update the currency
    const { data: currency, error } = await supabase
      .from('currencies')
      .update({
        ...validatedData,
        last_updated: new Date().toISOString(),
      })
      .eq('id', currencyId)
      .select()
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'update currency');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ currency });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/currencies/[id] - Delete a specific currency
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currencyId = parseInt(params.id);
    
    if (isNaN(currencyId)) {
      return NextResponse.json(
        { error: 'Invalid currency ID' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Check if currency exists and is not the base currency
    const { data: currency } = await supabase
      .from('currencies')
      .select('id, is_base_currency, code')
      .eq('id', currencyId)
      .single();

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency not found' },
        { status: 404 }
      );
    }

    if (currency.is_base_currency) {
      return NextResponse.json(
        { error: 'Cannot delete base currency' },
        { status: 400 }
      );
    }

    // Check if currency is being used in any projects
    const { data: projectsUsingCurrency } = await supabase
      .from('projects')
      .select('id')
      .eq('currency_code', currency.code)
      .limit(1);

    if (projectsUsingCurrency && projectsUsingCurrency.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete currency that is being used in projects' },
        { status: 400 }
      );
    }

    // Delete the currency
    const { error } = await supabase
      .from('currencies')
      .delete()
      .eq('id', currencyId);

    if (error) {
      const errorResponse = handleSupabaseError(error, 'delete currency');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ message: 'Currency deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
