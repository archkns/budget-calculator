export interface Project {
  id: number
  name: string
  client: string | null
  currency_code: string
  currency_symbol: string
  hours_per_day: number
  tax_enabled: boolean
  tax_percentage: number
  proposed_price: number | null
  working_week: string
  execution_days: number
  buffer_days: number
  guarantee_days: number
  start_date: string | null
  end_date: string | null
  calendar_mode: boolean
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'
  created_at: string
  updated_at: string
}

export interface CreateProjectData {
  name: string
  client?: string
  currency_code?: string
  currency_symbol?: string
  hours_per_day?: number
  tax_enabled?: boolean
  tax_percentage?: number
  proposed_price?: number
  working_week?: string
  status?: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: number
}
