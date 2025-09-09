import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { RateCardSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: rateCards, error } = await supabaseAdmin
      .from('rate_cards')
      .select(`
        *,
        roles:role_id (
          id,
          name
        )
      `)
      .order('role_id', { ascending: true })
      .order('tier', { ascending: true });

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
    const body = await request.json();
    const validatedData = RateCardSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body);

    const { data: newRateCard, error } = await supabaseAdmin
      .from('rate_cards')
      .insert({
        role_id: validatedData.role_id,
        tier: validatedData.tier,
        daily_rate: validatedData.daily_rate,
        is_active: validatedData.is_active ?? true
      })
      .select(`
        *,
        roles:role_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
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
    
    const body = await request.json();
    const validatedData = RateCardSchema.partial().parse(body);

    const { data: updatedRateCard, error } = await supabaseAdmin
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

    if (error) {
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