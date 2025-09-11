import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('role_id')
    const levelId = searchParams.get('level_id')

    // Validate required parameters
    if (!roleId || !levelId) {
      return NextResponse.json(
        { error: 'Both role_id and level_id are required' },
        { status: 400 }
      )
    }

    // Validate that parameters are numbers
    if (isNaN(Number(roleId)) || isNaN(Number(levelId))) {
      return NextResponse.json(
        { error: 'role_id and level_id must be valid numbers' },
        { status: 400 }
      )
    }

    let rateCard, error;
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
        .eq('role_id', Number(roleId))
        .eq('level_id', Number(levelId))
        .eq('is_active', true)
        .single();
      
      rateCard = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      // If no rate card found, return null instead of error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ rateCard: null });
      }
      
      const errorResponse = handleSupabaseError(error, 'fetch rate card');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ rateCard });
  } catch (error) {
    console.error('Error fetching rate card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate card' },
      { status: 500 }
    );
  }
}
