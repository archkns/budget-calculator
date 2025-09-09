import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { ProjectSchema } from '@/lib/schemas';

export const runtime = 'edge';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        p.*,
        COUNT(pa.id) as team_count
      FROM projects p
      LEFT JOIN project_assignments pa ON p.id = pa.project_id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ProjectSchema.omit({ 
      id: true, 
      created_at: true, 
      updated_at: true 
    }).parse(body);
    
    const result = await query(
      `INSERT INTO projects 
       (name, client, currency_code, currency_symbol, hours_per_day, 
        tax_enabled, tax_percentage, proposed_price, execution_days, buffer_days) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        validatedData.name,
        validatedData.client || null,
        validatedData.currency_code,
        validatedData.currency_symbol,
        validatedData.hours_per_day,
        validatedData.tax_enabled,
        validatedData.tax_percentage,
        validatedData.proposed_price || null,
        validatedData.execution_days,
        validatedData.buffer_days
      ]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
