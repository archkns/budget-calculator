-- Remove template tables since we're implementing project duplication instead
-- This migration removes the project_templates and template_assignments tables
-- as they are no longer needed with the new project duplication feature

-- Drop foreign key constraints first (only if tables exist)
DO $$ 
BEGIN
    -- Check if template_assignments table exists before dropping constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'template_assignments') THEN
        ALTER TABLE template_assignments DROP CONSTRAINT IF EXISTS template_assignments_template_id_fkey;
        ALTER TABLE template_assignments DROP CONSTRAINT IF EXISTS template_assignments_role_id_fkey;
        ALTER TABLE template_assignments DROP CONSTRAINT IF EXISTS template_assignments_level_id_fkey;
    END IF;
    
    -- Check if projects table exists and has template_id constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_template_id_fkey;
    END IF;
END $$;

-- Remove template_id column from projects table first (before dropping the referenced table)
-- Only if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE projects DROP COLUMN IF EXISTS template_id;
    END IF;
END $$;

-- Drop the template tables (only if they exist)
DROP TABLE IF EXISTS template_assignments;
DROP TABLE IF EXISTS project_templates;

-- Add comments to document the change (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        COMMENT ON TABLE projects IS 'Projects table - template_id removed as we now use project duplication instead of templates';
    END IF;
END $$;
