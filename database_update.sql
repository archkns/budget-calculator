-- Database Update Script for Team Assignments
-- Run this script to update your database schema to match the frontend requirements

-- Add missing columns to project_assignments table
ALTER TABLE project_assignments 
ADD COLUMN IF NOT EXISTS buffer_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_mandays INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(15,2) DEFAULT 0;

-- Remove unused columns that don't match frontend UI (keeping start_date and end_date for Gantt chart)
ALTER TABLE project_assignments 
DROP COLUMN IF EXISTS utilization_percentage,
DROP COLUMN IF EXISTS ignore_holidays;

-- Add comments for documentation
COMMENT ON COLUMN project_assignments.buffer_days IS 'Buffer days allocated for this assignment';
COMMENT ON COLUMN project_assignments.total_mandays IS 'Total mandays (days_allocated + buffer_days)';
COMMENT ON COLUMN project_assignments.total_price IS 'Total price (daily_rate * total_mandays)';

-- Create a function to automatically calculate total_mandays and total_price
CREATE OR REPLACE FUNCTION calculate_assignment_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total mandays
    NEW.total_mandays = COALESCE(NEW.days_allocated, 0) + COALESCE(NEW.buffer_days, 0);
    
    -- Calculate total price
    NEW.total_price = COALESCE(NEW.daily_rate, 0) * NEW.total_mandays;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update calculated fields
DROP TRIGGER IF EXISTS trigger_calculate_assignment_totals ON project_assignments;
CREATE TRIGGER trigger_calculate_assignment_totals
    BEFORE INSERT OR UPDATE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_assignment_totals();

-- Update existing records to have calculated values
UPDATE project_assignments 
SET 
    total_mandays = COALESCE(days_allocated, 0) + COALESCE(buffer_days, 0),
    total_price = COALESCE(daily_rate, 0) * (COALESCE(days_allocated, 0) + COALESCE(buffer_days, 0))
WHERE total_mandays = 0 OR total_price = 0;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_assignments' 
ORDER BY ordinal_position;
