import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { TeamMemberSchema, TeamMemberCSVSchema } from '@/lib/schemas';
import { sanitizeCSVCell } from '@/lib/calculations';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;
    
    if (status) {
      whereClause += ` AND tm.status = $${++paramCount}`;
      params.push(status);
    }
    
    if (role) {
      whereClause += ` AND (r.name ILIKE $${++paramCount} OR tm.custom_role ILIKE $${++paramCount})`;
      params.push(`%${role}%`, `%${role}%`);
      paramCount++;
    }
    
    if (search) {
      whereClause += ` AND tm.name ILIKE $${++paramCount}`;
      params.push(`%${search}%`);
    }
    
    const offset = (page - 1) * limit;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM team_members tm
      LEFT JOIN roles r ON tm.role_id = r.id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        tm.*,
        r.name as role_name
      FROM team_members tm
      LEFT JOIN roles r ON tm.role_id = r.id
      ${whereClause}
      ORDER BY tm.${sortBy} ${sortOrder}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, params.slice(0, -2)),
      query(dataQuery, params)
    ]);
    
    return NextResponse.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
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
    const validatedData = TeamMemberSchema.omit({ 
      id: true, 
      created_at: true, 
      updated_at: true 
    }).parse(body);
    
    const result = await query(
      `INSERT INTO team_members 
       (name, role_id, custom_role, tier, default_rate_per_day, notes, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        validatedData.name,
        validatedData.role_id || null,
        validatedData.custom_role || null,
        validatedData.tier || null,
        validatedData.default_rate_per_day,
        validatedData.notes || null,
        validatedData.status
      ]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
