-- Database schema for Manday Calculator

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate tiers
CREATE TYPE tier_level AS ENUM ('TEAM_LEAD', 'SENIOR', 'JUNIOR');

-- Rate cards table
CREATE TABLE IF NOT EXISTS rate_cards (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  tier tier_level NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, tier)
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  custom_role VARCHAR(100),
  tier tier_level,
  default_rate_per_day DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  currency_code VARCHAR(3) DEFAULT 'THB',
  currency_symbol VARCHAR(5) DEFAULT '฿',
  hours_per_day INTEGER DEFAULT 7,
  tax_enabled BOOLEAN DEFAULT false,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  proposed_price DECIMAL(12,2),
  execution_days INTEGER DEFAULT 0,
  buffer_days INTEGER DEFAULT 0,
  final_days INTEGER GENERATED ALWAYS AS (execution_days + buffer_days) STORED,
  calendar_mode BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  working_week VARCHAR(20) DEFAULT 'MON_TO_FRI',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project team assignments
CREATE TABLE IF NOT EXISTS project_assignments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id INTEGER REFERENCES team_members(id),
  custom_name VARCHAR(255),
  custom_role VARCHAR(100),
  custom_tier tier_level,
  daily_rate DECIMAL(10,2) NOT NULL,
  days_allocated DECIMAL(8,2) DEFAULT 0,
  utilization_percentage DECIMAL(5,2) DEFAULT 100,
  multiplier DECIMAL(5,2) DEFAULT 1.0,
  is_billable BOOLEAN DEFAULT true,
  ignore_holidays BOOLEAN DEFAULT false,
  custom_multipliers JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public holidays table
CREATE TABLE IF NOT EXISTS public_holidays (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  treatment VARCHAR(20) DEFAULT 'EXCLUDE' CHECK (treatment IN ('EXCLUDE', 'BILLABLE', 'INFO_ONLY')),
  multiplier DECIMAL(5,2) DEFAULT 1.0,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project templates
CREATE TABLE IF NOT EXISTS project_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_status_name ON team_members(status, name);
CREATE INDEX IF NOT EXISTS idx_rate_cards_role_tier ON rate_cards(role_id, tier);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_public_holidays_project_date ON public_holidays(project_id, date);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rate_cards_updated_at BEFORE UPDATE ON rate_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_assignments_updated_at BEFORE UPDATE ON project_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
