import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { PublicHolidaySchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid holiday ID is required' },
        { status: 400 }
      );
    }

    const { data: holiday, error } = await supabaseAdmin()
      .from('public_holidays')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch holiday');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    if (!holiday) {
      return NextResponse.json(
        { error: 'Holiday not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Error fetching holiday:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holiday' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid holiday ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = PublicHolidaySchema.omit({ id: true, created_at: true }).partial().parse(body);

    const { data: updatedHoliday, error } = await supabaseAdmin()
      .from('public_holidays')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const errorResponse = handleSupabaseError(error, 'update holiday');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    if (!updatedHoliday) {
      return NextResponse.json(
        { error: 'Holiday not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedHoliday);
  } catch (error) {
    console.error('Error updating holiday:', error);
    return NextResponse.json(
      { error: 'Failed to update holiday' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid holiday ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin()
      .from('public_holidays')
      .delete()
      .eq('id', id);

    if (error) {
      const errorResponse = handleSupabaseError(error, 'delete holiday');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json(
      { error: 'Failed to delete holiday' },
      { status: 500 }
    );
  }
}
