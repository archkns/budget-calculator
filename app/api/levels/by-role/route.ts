import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('role_id')

    // Validate required parameter
    if (!roleId) {
      return NextResponse.json(
        { error: 'role_id is required' },
        { status: 400 }
      )
    }

    // Validate that parameter is a number
    if (isNaN(Number(roleId))) {
      return NextResponse.json(
        { error: 'role_id must be a valid number' },
        { status: 400 }
      )
    }

    let levels, error;
    try {
      // Get distinct levels that have rate cards for the specified role
      const result = await supabaseAdmin()
        .from('rate_cards')
        .select(`
          levels:level_id (
            id,
            name,
            display_name
          )
        `)
        .eq('role_id', Number(roleId))
        .eq('is_active', true)
        .not('level_id', 'is', null);
      
      const rateCards = result.data;
      error = result.error;

      if (!error && rateCards) {
        // Extract unique levels from rate cards
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const uniqueLevels = rateCards
          .map((card: any) => card.levels)
          .filter((level: any, index: number, self: any[]) => 
            level && self.findIndex((l: any) => l?.id === level.id) === index
          )
          .sort((a: any, b: any) => a.id - b.id);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        
        levels = uniqueLevels;
      }
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch levels by role');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(levels || []);
  } catch (error) {
    console.error('Error fetching levels by role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch levels by role' },
      { status: 500 }
    );
  }
}
