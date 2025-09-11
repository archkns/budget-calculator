-- Add total_price column to projects table for calculated project costs
-- This migration adds a calculated field that will be automatically updated
-- when project assignments change

-- Step 1: Add total_price column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(15,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN projects.total_price IS 'Total calculated cost from all project assignments including tax';

-- Step 2: Create function to calculate project total price
CREATE OR REPLACE FUNCTION calculate_project_total_price(p_project_id INTEGER)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    subtotal DECIMAL(15,2) := 0;
    tax_amount DECIMAL(15,2) := 0;
    total_cost DECIMAL(15,2) := 0;
    project_tax_enabled BOOLEAN;
    project_tax_percentage DECIMAL(5,2);
BEGIN
    -- Get project tax settings
    SELECT tax_enabled, tax_percentage 
    INTO project_tax_enabled, project_tax_percentage
    FROM projects 
    WHERE id = p_project_id;
    
    -- Calculate subtotal from all assignments
    SELECT COALESCE(SUM(total_price), 0)
    INTO subtotal
    FROM project_assignments 
    WHERE project_id = p_project_id;
    
    -- Calculate tax if enabled
    IF project_tax_enabled THEN
        tax_amount := subtotal * (project_tax_percentage / 100);
    END IF;
    
    -- Calculate total cost
    total_cost := subtotal + tax_amount;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to update project total price
CREATE OR REPLACE FUNCTION update_project_total_price()
RETURNS TRIGGER AS $$
DECLARE
    affected_project_id INTEGER;
    new_total_price DECIMAL(15,2);
BEGIN
    -- Determine which project was affected
    IF TG_OP = 'DELETE' THEN
        affected_project_id := OLD.project_id;
    ELSE
        affected_project_id := NEW.project_id;
    END IF;
    
    -- Calculate new total price for the project
    new_total_price := calculate_project_total_price(affected_project_id);
    
    -- Update the project's total_price
    UPDATE projects 
    SET total_price = new_total_price,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = affected_project_id;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically update project total_price
DROP TRIGGER IF EXISTS trigger_update_project_total_price ON project_assignments;
CREATE TRIGGER trigger_update_project_total_price
    AFTER INSERT OR UPDATE OR DELETE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_total_price();

-- Step 5: Create trigger to update total_price when project tax settings change
CREATE OR REPLACE FUNCTION update_project_total_price_on_tax_change()
RETURNS TRIGGER AS $$
DECLARE
    new_total_price DECIMAL(15,2);
BEGIN
    -- Only recalculate if tax settings changed
    IF (OLD.tax_enabled IS DISTINCT FROM NEW.tax_enabled) OR 
       (OLD.tax_percentage IS DISTINCT FROM NEW.tax_percentage) THEN
        
        new_total_price := calculate_project_total_price(NEW.id);
        
        -- Update the project's total_price
        NEW.total_price := new_total_price;
        NEW.updated_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_total_price_on_tax_change ON projects;
CREATE TRIGGER trigger_update_project_total_price_on_tax_change
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_project_total_price_on_tax_change();

-- Step 6: Update existing projects with calculated total prices
UPDATE projects 
SET total_price = calculate_project_total_price(projects.id),
    updated_at = CURRENT_TIMESTAMP
WHERE total_price = 0 OR total_price IS NULL;

-- Step 7: Add index for performance
CREATE INDEX IF NOT EXISTS idx_projects_total_price ON projects(total_price);
