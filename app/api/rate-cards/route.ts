import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { RateCardSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET() {
  try {

    let rateCards, error;
    try {
      const result = await supabaseAdmin()
        .from('rate_cards')
        .select(`
          *,
          roles:role_id (
            id,
            name
          ),
          levels:level_id (
            id,
            name,
            display_name
          )
        `)
        .order('role_id', { ascending: true })
        .order('level_id', { ascending: true });
      
      rateCards = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch rate cards');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(rateCards || []);
  } catch (error) {
    console.error('Error fetching rate cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate cards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with proper error handling
    let body: unknown
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const validatedData = RateCardSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body as Record<string, unknown>);

    // Check if a rate card with the same role and level already exists
    const { data: existingRateCard, error: checkError } = await supabaseAdmin()
      .from('rate_cards')
      .select('id, role_id, level_id')
      .eq('role_id', validatedData.role_id)
      .eq('level_id', validatedData.level_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we want
      console.error('Error checking existing rate card:', checkError);
      return NextResponse.json(
        { error: 'Failed to validate rate card uniqueness' },
        { status: 500 }
      );
    }

    if (existingRateCard) {
      return NextResponse.json(
        { error: 'A rate card for this role and level combination already exists. Each role can only have one rate card per level.' },
        { status: 409 }
      );
    }

    let newRateCard, error;
    try {
      const result = await supabaseAdmin()
        .from('rate_cards')
        .insert({
          role_id: validatedData.role_id,
          level_id: validatedData.level_id,
          daily_rate: validatedData.daily_rate,
          is_active: validatedData.is_active ?? true
        })
        .select(`
          *,
          roles:role_id (
            id,
            name
          ),
          levels:level_id (
            id,
            name,
            display_name
          )
        `)
        .single();
      
      newRateCard = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      // Handle unique constraint violation specifically
      if (error.code === '23505' && error.message.includes('rate_cards_role_id_level_id_key')) {
        return NextResponse.json(
          { error: 'A rate card for this role and level combination already exists. Each role can only have one rate card per level.' },
          { status: 409 }
        );
      }
      
      const errorResponse = handleSupabaseError(error, 'create rate card');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(newRateCard, { status: 201 });
  } catch (error) {
    console.error('Error creating rate card:', error);
    return NextResponse.json(
      { error: 'Failed to create rate card' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Rate card ID is required' },
        { status: 400 }
      );
    }
    
    // Parse JSON body with proper error handling
    let body: unknown
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const validatedData = RateCardSchema.partial().parse(body as Record<string, unknown>);

    let updatedRateCard, error;
    try {
      const result = await supabaseAdmin()
        .from('rate_cards')
        .update(validatedData)
        .eq('id', id)
        .select(`
          *,
          roles:role_id (
            id,
            name
          )
        `)
        .single();
      
      updatedRateCard = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      // Handle unique constraint violation specifically
      if (error.code === '23505' && error.message.includes('rate_cards_role_id_level_id_key')) {
        return NextResponse.json(
          { error: 'A rate card for this role and level combination already exists. Each role can only have one rate card per level.' },
          { status: 409 }
        );
      }
      
      const errorResponse = handleSupabaseError(error, 'update rate card');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    if (!updatedRateCard) {
      return NextResponse.json(
        { error: 'Rate card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRateCard);
  } catch (error) {
    console.error('Error updating rate card:', error);
    return NextResponse.json(
      { error: 'Failed to update rate card' },
      { status: 500 }
    );
  }
}