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

    // If role_id or level_id is being updated, check for conflicts
    if (validatedData.role_id || validatedData.level_id) {
      // First, get the current rate card to determine the final values
      const { data: currentRateCard, error: currentError } = await supabaseAdmin()
        .from('rate_cards')
        .select('role_id, level_id')
        .eq('id', id)
        .single();

      if (currentError) {
        const errorResponse = handleSupabaseError(currentError, 'fetch current rate card');
        return NextResponse.json(
          { error: errorResponse.error },
          { status: errorResponse.status }
        );
      }

      const finalRoleId = validatedData.role_id || currentRateCard.role_id;
      const finalLevelId = validatedData.level_id || currentRateCard.level_id;

      // Check if another rate card with the same role and level exists (excluding current one)
      const { data: existingRateCard, error: checkError } = await supabaseAdmin()
        .from('rate_cards')
        .select('id, role_id, level_id')
        .eq('role_id', finalRoleId)
        .eq('level_id', finalLevelId)
        .neq('id', id)
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
    }

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
