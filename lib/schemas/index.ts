import { z } from 'zod';

// Enums
export const TeamMemberStatus = z.enum(['ACTIVE', 'INACTIVE']);
export const WorkingWeek = z.enum(['MON_TO_FRI', 'MON_TO_SAT', 'CUSTOM']);

// Base schemas
export const CurrencySchema = z.object({
  id: z.number().optional(),
  code: z.string().length(3, 'Currency code must be exactly 3 characters').regex(/^[A-Z]{3}$/, 'Currency code must be uppercase letters'),
  name: z.string().min(1, 'Currency name is required').max(100),
  symbol: z.string().min(1, 'Currency symbol is required').max(10),
  decimal_places: z.number().int().min(0).max(4).default(2),
  is_base_currency: z.boolean().default(false),
  is_active: z.boolean().default(true),
  exchange_rate: z.number().min(0).default(1),
  last_updated: z.date().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const LevelSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Level name is required').max(50),
  display_name: z.string().min(1, 'Display name is required').max(100),
  description: z.string().optional(),
  sort_order: z.number().int(),
  is_active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const RoleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const RateCardSchema = z.object({
  id: z.number().optional(),
  role_id: z.number(),
  level_id: z.number(),
  daily_rate: z.number().positive('Daily rate must be positive'),
  is_active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const TeamMemberSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  role_id: z.number().min(1, 'Role is required'),
  level_id: z.number().min(1, 'Level is required'),
  rate_per_day: z.number().positive('Rate per day must be positive'),
  notes: z.string().optional(),
  status: TeamMemberStatus.default('ACTIVE'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const ProjectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Project name is required').max(255),
  client: z.string().max(255).optional(),
  currency_code: z.string().length(3).default('THB'),
  hours_per_day: z.number().int().min(1).max(24).default(7),
  tax_enabled: z.boolean().default(false),
  tax_percentage: z.number().min(0).max(100).default(0),
  proposed_price: z.number().min(0).nullable().optional(),
  allocated_budget: z.number().min(0).default(0),
  execution_days: z.number().int().min(0).default(0),
  buffer_days: z.number().int().min(0).default(0),
  guarantee_days: z.number().int().min(0).default(0),
  start_date: z.date().nullable().optional(),
  end_date: z.date().nullable().optional(),
  working_week: WorkingWeek.default('MON_TO_FRI'),
  custom_working_days: z.array(z.string()).nullable().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const ProjectAssignmentSchema = z.object({
  id: z.number().optional(),
  project_id: z.number(),
  team_member_id: z.number().optional(),
  daily_rate: z.number().positive('Daily rate must be positive'),
  days_allocated: z.number().min(0).default(0),
  buffer_days: z.number().min(0).default(0),
  total_mandays: z.number().min(0).default(0),
  allocated_budget: z.number().min(0).default(0),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  notes: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const PublicHolidaySchema = z.object({
  id: z.number().optional(),
  project_id: z.number().optional(),
  date: z.date(),
  name: z.string().min(1, 'Holiday name is required').max(255),
  is_custom: z.boolean().default(false),
  created_at: z.date().optional(),
});

// CSV Import schemas
export const TeamMemberCSVSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  level: z.string().min(1, 'Level is required'),
  ratePerDay: z.number().positive('Rate must be positive'),
  notes: z.string().optional().default(''),
  status: TeamMemberStatus.default('ACTIVE'),
});

export const HolidayCSVSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  name: z.string().min(1, 'Holiday name is required'),
});

// Form schemas for frontend
export const ProjectFormSchema = ProjectSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const TeamMemberFormSchema = TeamMemberSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const AssignmentFormSchema = ProjectAssignmentSchema.omit({ 
  id: true, 
  project_id: true, 
  created_at: true, 
  updated_at: true 
});

// Type exports
export type Currency = z.infer<typeof CurrencySchema>;
export type Role = z.infer<typeof RoleSchema>;
export type RateCard = z.infer<typeof RateCardSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectAssignment = z.infer<typeof ProjectAssignmentSchema>;
export type PublicHoliday = z.infer<typeof PublicHolidaySchema>;
export type Level = z.infer<typeof LevelSchema>;
export type TeamMemberCSV = z.infer<typeof TeamMemberCSVSchema>;
export type HolidayCSV = z.infer<typeof HolidayCSVSchema>;
export type TeamMemberStatusType = z.infer<typeof TeamMemberStatus>;
