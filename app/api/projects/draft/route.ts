import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array')
      return NextResponse.json([])
    }

    const { data: drafts, error } = await supabaseAdmin()
      .from('projects')
      .select('*')
      .eq('status', 'DRAFT')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching drafts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch drafts' },
        { status: 500 }
      )
    }

    return NextResponse.json(drafts || [])
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project } = body
    
    // Validate required fields
    if (!project || !project.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock response')
      // Return a mock response for development
      const mockDraft = {
        id: Date.now(),
        name: project.name,
        client: project.client || null,
        currency_code: project.currency_code || 'THB',
        currency_symbol: project.currency_symbol || '฿',
        hours_per_day: project.hours_per_day || 7,
        tax_enabled: project.tax_enabled || false,
        tax_percentage: project.tax_percentage || 7,
        proposed_price: project.proposed_price || null,
        working_week: project.working_week || 'MON_TO_FRI',
        status: 'DRAFT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json(mockDraft, { status: 201 })
    }
    
    // Prepare data for database insertion
    const insertData = {
      name: project.name,
      client: project.client || null,
      currency_code: project.currency_code || 'THB',
      currency_symbol: project.currency_symbol || '฿',
      hours_per_day: project.hours_per_day || 7,
      tax_enabled: project.tax_enabled || false,
      tax_percentage: project.tax_percentage || 7,
      proposed_price: project.proposed_price || null,
      working_week: project.working_week || 'MON_TO_FRI',
      status: 'DRAFT'
    }
    
    // Insert draft into database
    const { data: newDraft, error } = await supabaseAdmin()
      .from('projects')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving draft:', error)
      return NextResponse.json(
        { error: 'Failed to save draft' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(newDraft, { status: 201 })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}
