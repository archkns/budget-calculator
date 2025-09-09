import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { RateCardSchema } from '@/lib/schemas';

export const runtime = 'edge';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        rc.*,
        r.name as role_name
      FROM rate_cards rc
      JOIN roles r ON rc.role_id = r.id
      WHERE rc.is_active = true
      ORDER BY r.name, rc.tier
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching rate cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate cards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RateCardSchema.omit({ 
      id: true, 
      created_at: true, 
      updated_at: true 
    }).parse(body);
    
    const result = await query(
      `INSERT INTO rate_cards (role_id, tier, daily_rate, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        validatedData.role_id,
        validatedData.tier,
        validatedData.daily_rate,
        validatedData.is_active
      ]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating rate card:', error);
    return NextResponse.json(
      { error: 'Failed to create rate card' },
      { status: 500 }
    );
  }
}
