import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { CurrencySchema } from '@/lib/schemas';
import { z } from 'zod';

export const runtime = 'nodejs';

// GET /api/currencies - Get all currencies
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('currencies')
      .select('*')
      .order('is_base_currency', { ascending: false })
      .order('code', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: currencies, error } = await query;

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch currencies');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/currencies - Create a new currency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CurrencySchema.omit({ 
      id: true, 
      created_at: true, 
      updated_at: true,
      last_updated: true 
    }).parse(body);

    const supabase = supabaseAdmin();

    // Check if currency code already exists
    const { data: existingCurrency } = await supabase
      .from('currencies')
      .select('id')
      .eq('code', validatedData.code)
      .single();

    if (existingCurrency) {
      return NextResponse.json(
        { error: 'Currency code already exists' },
        { status: 400 }
      );
    }

    // If this is being set as base currency, unset any existing base currency
    if (validatedData.is_base_currency) {
      await supabase
        .from('currencies')
        .update({ is_base_currency: false })
        .eq('is_base_currency', true);
    }

    // Create the new currency
    const { data: currency, error } = await supabase
      .from('currencies')
      .insert([{
        ...validatedData,
        last_updated: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'create currency');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ currency }, { status: 201 });
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
