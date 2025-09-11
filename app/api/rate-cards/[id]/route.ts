import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { RateCardSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid rate card ID is required' },
        { status: 400 }
      );
    }

    const { data: rateCard, error } = await supabaseAdmin()
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
      .eq('id', id)
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch rate card');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    if (!rateCard) {
      return NextResponse.json(
        { error: 'Rate card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rateCard);
  } catch (error) {
    console.error('Error fetching rate card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate card' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid rate card ID is required' },
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

    const { data: updatedRateCard, error } = await supabaseAdmin()
      .from('rate_cards')
      .update(validatedData)
      .eq('id', id)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid rate card ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin()
      .from('rate_cards')
      .delete()
      .eq('id', id);

    if (error) {
      const errorResponse = handleSupabaseError(error, 'delete rate card');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ message: 'Rate card deleted successfully' });
  } catch (error) {
    console.error('Error deleting rate card:', error);
    return NextResponse.json(
      { error: 'Failed to delete rate card' },
      { status: 500 }
    );
  }
}
