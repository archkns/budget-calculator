-- Remove is_billable field from project_assignments table
ALTER TABLE project_assignments DROP COLUMN IF EXISTS is_billable;
