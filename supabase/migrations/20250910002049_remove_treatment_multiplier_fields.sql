-- Remove treatment and multiplier fields from public_holidays table
ALTER TABLE public_holidays DROP COLUMN IF EXISTS treatment;
ALTER TABLE public_holidays DROP COLUMN IF EXISTS multiplier;

-- Remove multiplier and custom_multipliers fields from project_assignments table
ALTER TABLE project_assignments DROP COLUMN IF EXISTS multiplier;
ALTER TABLE project_assignments DROP COLUMN IF EXISTS custom_multipliers;
