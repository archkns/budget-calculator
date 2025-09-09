import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { PublicHolidaySchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const year = searchParams.get('year');

    // Build query with optional filters
    let query = supabaseAdmin
      .from('public_holidays')
      .select('*')
      .order('date', { ascending: true });

    if (projectId) {
      query = query.or(`project_id.is.null,project_id.eq.${projectId}`);
    }

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data: holidays, error } = await query;

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch holidays');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    const response = NextResponse.json(holidays || []);
    
    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return response;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = PublicHolidaySchema.omit({ id: true, created_at: true }).parse(body);

    const { data: newHoliday, error } = await supabaseAdmin
      .from('public_holidays')
      .insert({
        project_id: validatedData.project_id,
        date: validatedData.date,
        name: validatedData.name,
        treatment: validatedData.treatment,
        multiplier: validatedData.multiplier,
        is_custom: validatedData.is_custom
      })
      .select()
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'create holiday');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(newHoliday, { status: 201 });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday' },
      { status: 500 }
    );
  }
}