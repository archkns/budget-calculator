// Database table interfaces
export interface Role {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface RateCard {
  id: number
  role_id: number
  tier: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  daily_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: number
  name: string
  role_id: number | null
  custom_role: string | null
  tier: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR' | null
  default_rate_per_day: number
  notes: string | null
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
  updated_at: string
}

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

export interface ProjectAssignment {
  id: number
  project_id: number
  team_member_id: number | null
  custom_name: string | null
  custom_role: string | null
  custom_tier: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR' | null
  daily_rate: number
  days_allocated: number
  utilization_percentage: number
  ignore_holidays: boolean
  created_at: string
  updated_at: string
}

export interface PublicHoliday {
  id: number
  project_id: number | null
  date: string
  name: string
  is_custom: boolean
  created_at: string
}

export interface ProjectTemplate {
  id: number
  name: string
  description: string | null
  template_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Create/Update data interfaces
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

export interface CreateTeamMemberData {
  name: string
  role_id?: number
  custom_role?: string
  tier?: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  default_rate_per_day: number
  notes?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface UpdateTeamMemberData extends Partial<CreateTeamMemberData> {
  id: number
}

export interface CreateRoleData {
  name: string
}

export interface UpdateRoleData {
  id: number
  name: string
}

export interface CreateRateCardData {
  role_id: number
  tier: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  daily_rate: number
  is_active?: boolean
}

export interface UpdateRateCardData extends Partial<CreateRateCardData> {
  id: number
}
