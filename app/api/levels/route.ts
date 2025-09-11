import { NextResponse } from 'next/server'
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase'

export const runtime = 'nodejs';

export async function GET() {
  try {
    let levels, error;
    try {
      const result = await supabaseAdmin()
        .from('levels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      levels = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch levels');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(levels || []);
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch levels' },
      { status: 500 }
    );
  }
}
