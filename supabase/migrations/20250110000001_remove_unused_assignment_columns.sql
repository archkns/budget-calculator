-- Remove columns from project_assignments table that don't match frontend UI
-- These columns are not displayed or used in the frontend interface

-- Drop the trigger first since it references columns we're removing
DROP TRIGGER IF EXISTS trigger_calculate_assignment_totals ON project_assignments;

-- Remove unused columns (keeping start_date and end_date for Gantt chart)
ALTER TABLE project_assignments 
DROP COLUMN IF EXISTS utilization_percentage,
DROP COLUMN IF EXISTS ignore_holidays;

-- Recreate the trigger function (simplified without the removed columns)
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

-- Recreate the trigger
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
