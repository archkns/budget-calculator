// Database table interfaces
export interface Level {
  id: number
  name: string
  display_name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface RateCard {
  id: number
  role_id: number
  level_id: number
  daily_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: number
  name: string
  role_id: number
  level_id: number
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
  hours_per_day: number
  tax_enabled: boolean
  tax_percentage: number
  proposed_price: number | null
  allocated_budget: number
  working_week: string
  custom_working_days: string[] | null
  execution_days: number
  buffer_days: number
  guarantee_days: number
  start_date: string | null
  end_date: string | null
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'
  template_id: number | null
  created_at: string
  updated_at: string
}

export interface ProjectAssignment {
  id: number
  project_id: number
  team_member_id: number | null
  daily_rate: number
  days_allocated: number
  buffer_days: number
  total_mandays: number
  allocated_budget: number
  start_date: string | null
  end_date: string | null
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

// Create/Update data interfaces
export interface CreateProjectData {
  name: string
  client?: string
  currency_code?: string
  hours_per_day?: number
  tax_enabled?: boolean
  tax_percentage?: number
  proposed_price?: number
  allocated_budget?: number
  working_week?: string
  custom_working_days?: string[]
  execution_days?: number
  buffer_days?: number
  guarantee_days?: number
  start_date?: string
  status?: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: number
}

export interface CreateTeamMemberData {
  name: string
  role_id: number
  level_id: number
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
  level_id: number
  daily_rate: number
  is_active?: boolean
}

export interface UpdateRateCardData extends Partial<CreateRateCardData> {
  id: number
}
