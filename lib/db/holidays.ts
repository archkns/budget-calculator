import { supabaseAdmin } from '@/lib/supabase'

export interface Holiday {
  id: number
  project_id: number | null
  date: string
  name: string
  is_custom: boolean
  created_at: string
}

export interface CreateHolidayData {
  project_id?: number | null
  date: string
  name: string
  is_custom?: boolean
}

export interface UpdateHolidayData {
  project_id?: number | null
  date?: string
  name?: string
  is_custom?: boolean
}

export class HolidayService {
  private supabase = supabaseAdmin()

  /**
   * Get all holidays with optional filters
   */
  async getHolidays(filters?: {
    projectId?: number
    year?: number
    isCustom?: boolean
  }): Promise<Holiday[]> {
    let query = this.supabase
      .from('public_holidays')
      .select('*')
      .order('date', { ascending: true })

    if (filters?.projectId) {
      query = query.or(`project_id.is.null,project_id.eq.${filters.projectId}`)
    }

    if (filters?.year) {
      const startDate = `${filters.year}-01-01`
      const endDate = `${filters.year}-12-31`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    if (filters?.isCustom !== undefined) {
      query = query.eq('is_custom', filters.isCustom)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching holidays:', error)
      throw new Error('Failed to fetch holidays')
    }

    return data || []
  }

  /**
   * Get holiday by ID
   */
  async getHolidayById(id: number): Promise<Holiday | null> {
    const { data, error } = await this.supabase
      .from('public_holidays')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching holiday by ID:', error)
      throw new Error('Failed to fetch holiday')
    }

    return data
  }

  /**
   * Create a new holiday
   */
  async createHoliday(holidayData: CreateHolidayData): Promise<Holiday> {
    const { data, error } = await this.supabase
      .from('public_holidays')
      .insert([holidayData])
      .select()
      .single()

    if (error) {
      console.error('Error creating holiday:', error)
      throw new Error('Failed to create holiday')
    }

    return data
  }

  /**
   * Update a holiday
   */
  async updateHoliday(id: number, holidayData: UpdateHolidayData): Promise<Holiday> {
    const { data, error } = await this.supabase
      .from('public_holidays')
      .update(holidayData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating holiday:', error)
      throw new Error('Failed to update holiday')
    }

    return data
  }

  /**
   * Delete a holiday
   */
  async deleteHoliday(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('public_holidays')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting holiday:', error)
      throw new Error('Failed to delete holiday')
    }
  }

  /**
   * Bulk insert holidays
   */
  async bulkInsertHolidays(holidays: CreateHolidayData[]): Promise<Holiday[]> {
    const { data, error } = await this.supabase
      .from('public_holidays')
      .insert(holidays)
      .select()

    if (error) {
      console.error('Error bulk inserting holidays:', error)
      throw new Error('Failed to bulk insert holidays')
    }

    return data || []
  }

  /**
   * Delete holidays by year and type
   */
  async deleteHolidaysByYearAndType(
    year: number, 
    isCustom: boolean = false
  ): Promise<void> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { error } = await this.supabase
      .from('public_holidays')
      .delete()
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_custom', isCustom)

    if (error) {
      console.error('Error deleting holidays by year and type:', error)
      throw new Error('Failed to delete holidays')
    }
  }

  /**
   * Check if holidays exist for a year
   */
  async hasHolidaysForYear(year: number, isCustom: boolean = false): Promise<boolean> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await this.supabase
      .from('public_holidays')
      .select('id')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_custom', isCustom)
      .limit(1)

    if (error) {
      console.error('Error checking holidays for year:', error)
      throw new Error('Failed to check holidays for year')
    }

    return (data && data.length > 0) || false
  }

  /**
   * Get holiday statistics for a year
   */
  async getHolidayStats(year: number): Promise<{
    total: number
    custom: number
    system: number
    byMonth: Record<string, number>
  }> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await this.supabase
      .from('public_holidays')
      .select('date, is_custom')
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) {
      console.error('Error fetching holiday stats:', error)
      throw new Error('Failed to fetch holiday statistics')
    }

    const holidays = data || []
    const custom = holidays.filter(h => h.is_custom).length
    const system = holidays.filter(h => !h.is_custom).length

    // Group by month
    const byMonth: Record<string, number> = {}
    holidays.forEach(holiday => {
      const month = holiday.date.substring(0, 7) // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + 1
    })

    return {
      total: holidays.length,
      custom,
      system,
      byMonth
    }
  }

  /**
   * Sync holidays from external source
   */
  async syncHolidays(
    holidays: CreateHolidayData[],
    year: number,
    overwrite: boolean = false
  ): Promise<{
    inserted: number
    deleted: number
    holidays: Holiday[]
  }> {
    let deletedCount = 0

    // Delete existing system holidays for the year if overwrite is true
    if (overwrite) {
      await this.deleteHolidaysByYearAndType(year, false)
      deletedCount = await this.getHolidayCountForYear(year, false)
    }

    // Insert new holidays
    const insertedHolidays = await this.bulkInsertHolidays(holidays)

    return {
      inserted: insertedHolidays.length,
      deleted: deletedCount,
      holidays: insertedHolidays
    }
  }

  /**
   * Get holiday count for a year and type
   */
  private async getHolidayCountForYear(year: number, isCustom: boolean): Promise<number> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { count, error } = await this.supabase
      .from('public_holidays')
      .select('*', { count: 'exact', head: true })
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_custom', isCustom)

    if (error) {
      console.error('Error counting holidays:', error)
      return 0
    }

    return count || 0
  }
}

// Export singleton instance
export const holidayService = new HolidayService()
