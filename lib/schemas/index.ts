import { z } from 'zod';

// Enums
export const TierLevel = z.enum(['TEAM_LEAD', 'SENIOR', 'JUNIOR']);
export const TeamMemberStatus = z.enum(['ACTIVE', 'INACTIVE']);
export const WorkingWeek = z.enum(['MON_TO_FRI', 'MON_TO_SAT', 'CUSTOM']);

// Base schemas
export const RoleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Role name is required').max(100),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const RateCardSchema = z.object({
  id: z.number().optional(),
  role_id: z.number(),
  tier: TierLevel,
  daily_rate: z.number().positive('Daily rate must be positive'),
  is_active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const TeamMemberSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  role_id: z.number().optional(),
  custom_role: z.string().max(100).optional(),
  tier: TierLevel.optional(),
  default_rate_per_day: z.number().positive('Default rate must be positive'),
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
  currency_symbol: z.string().max(5).default('฿'),
  hours_per_day: z.number().int().min(1).max(24).default(7),
  tax_enabled: z.boolean().default(false),
  tax_percentage: z.number().min(0).max(100).default(0),
  proposed_price: z.number().min(0).optional(),
  execution_days: z.number().int().min(0).default(0),
  buffer_days: z.number().int().min(0).default(0),
  calendar_mode: z.boolean().default(false),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  working_week: WorkingWeek.default('MON_TO_FRI'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const ProjectAssignmentSchema = z.object({
  id: z.number().optional(),
  project_id: z.number(),
  team_member_id: z.number().optional(),
  custom_name: z.string().max(255).optional(),
  custom_role: z.string().max(100).optional(),
  custom_tier: TierLevel.optional(),
  daily_rate: z.number().positive('Daily rate must be positive'),
  days_allocated: z.number().min(0).default(0),
  utilization_percentage: z.number().min(0).max(100).default(100),
  is_billable: z.boolean().default(true),
  ignore_holidays: z.boolean().default(false),
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

export const ProjectTemplateSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().optional(),
  template_data: z.record(z.string(), z.any()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// CSV Import schemas
export const TeamMemberCSVSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  level: TierLevel,
  defaultRatePerDay: z.number().positive('Rate must be positive'),
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
export type Role = z.infer<typeof RoleSchema>;
export type RateCard = z.infer<typeof RateCardSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectAssignment = z.infer<typeof ProjectAssignmentSchema>;
export type PublicHoliday = z.infer<typeof PublicHolidaySchema>;
export type ProjectTemplate = z.infer<typeof ProjectTemplateSchema>;
export type TeamMemberCSV = z.infer<typeof TeamMemberCSVSchema>;
export type HolidayCSV = z.infer<typeof HolidayCSVSchema>;
export type TierLevelType = z.infer<typeof TierLevel>;
export type TeamMemberStatusType = z.infer<typeof TeamMemberStatus>;
