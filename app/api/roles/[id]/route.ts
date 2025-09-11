import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import { RoleSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }


    let role, error;
    try {
      const result = await supabaseAdmin()
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();
      
      role = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    if (error) {
      const errorResponse = handleSupabaseError(error, 'fetch role');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
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
    
    const validatedData = RoleSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body as Record<string, unknown>);


    let updatedRole, error;
    try {
      const result = await supabaseAdmin()
        .from('roles')
        .update({ 
          name: validatedData.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      updatedRole = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'update role');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    if (!updatedRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    
    // Check if role is referenced by team members (but allow deletion of rate cards)
    try {
      const teamMembersResult = await supabaseAdmin()
        .from('team_members')
        .select('id')
        .eq('role_id', id)
        .limit(1);
      
      const hasTeamMembers = teamMembersResult.data && teamMembersResult.data.length > 0;
      
      if (hasTeamMembers) {
        return NextResponse.json(
          { error: 'Cannot delete role that is referenced by team members' },
          { status: 409 }
        );
      }
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    // Delete all rate cards for this role first
    try {
      const { error: rateCardsError } = await supabaseAdmin()
        .from('rate_cards')
        .delete()
        .eq('role_id', id);
      
      if (rateCardsError) {
        console.error('Error deleting rate cards:', rateCardsError);
        return NextResponse.json(
          { error: 'Failed to delete associated rate cards' },
          { status: 500 }
        );
      }
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    let deletedRole, error;
    try {
      const result = await supabaseAdmin()
        .from('roles')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      deletedRole = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Supabase client initialization error:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    if (error) {
      const errorResponse = handleSupabaseError(error, 'delete role');
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }
    
    if (!deletedRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
