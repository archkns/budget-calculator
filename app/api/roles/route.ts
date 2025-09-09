import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { RoleSchema } from '@/lib/schemas';

export const runtime = 'edge';

export async function GET() {
  try {
    const result = await query('SELECT * FROM roles ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RoleSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body);
    
    const result = await query(
      'INSERT INTO roles (name) VALUES ($1) RETURNING *',
      [validatedData.name]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
