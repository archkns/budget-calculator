import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { RoleSchema } from '@/lib/schemas';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const result = await query('SELECT * FROM roles WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
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
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const validatedData = RoleSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body);
    
    const result = await query(
      'UPDATE roles SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [validatedData.name, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
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
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Check if role is referenced by team members or rate cards
    const references = await query(
      'SELECT COUNT(*) as count FROM team_members WHERE role_id = $1 UNION ALL SELECT COUNT(*) as count FROM rate_cards WHERE role_id = $1',
      [id]
    );
    
    const totalReferences = references.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    if (totalReferences > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is referenced by team members or rate cards' },
        { status: 409 }
      );
    }
    
    const result = await query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
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
