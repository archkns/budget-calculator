import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { TeamMemberFormSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const roleId = searchParams.get('role_id');

    // Build query with optional filters
    let query = supabaseAdmin
      .from('team_members')
      .select(`
        *,
        roles:role_id (
          id,
          name
        )
      `)
      .order('name', { ascending: true });

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    if (roleId) {
      query = query.eq('role_id', roleId);
    }

    const { data: teamMembers, error } = await query;

    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch team members');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(teamMembers || []);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TeamMemberFormSchema.parse(body);

    const { data: newMember, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        name: validatedData.name,
        role_id: validatedData.role_id,
        custom_role: validatedData.custom_role,
        tier: validatedData.tier,
        default_rate_per_day: validatedData.default_rate_per_day,
        notes: validatedData.notes,
        status: validatedData.status || 'ACTIVE'
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
      const errorResponse = handleSupabaseError(error, 'create team member');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}