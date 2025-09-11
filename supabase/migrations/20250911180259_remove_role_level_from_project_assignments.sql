-- Remove role_id and level_id columns from project_assignments table
-- These columns are not needed since role and level information comes from team_members table

-- Drop foreign key constraints first
ALTER TABLE project_assignments DROP CONSTRAINT IF EXISTS project_assignments_role_id_fkey;
ALTER TABLE project_assignments DROP CONSTRAINT IF EXISTS project_assignments_level_id_fkey;

-- Remove the columns
ALTER TABLE project_assignments DROP COLUMN IF EXISTS role_id;
ALTER TABLE project_assignments DROP COLUMN IF EXISTS level_id;

-- Add comment to document the change
COMMENT ON TABLE project_assignments IS 'Project assignments table - role_id and level_id removed as role/level info comes from team_members table';
