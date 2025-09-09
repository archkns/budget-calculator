-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate Cards table
CREATE TABLE IF NOT EXISTS rate_cards (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('TEAM_LEAD', 'SENIOR', 'JUNIOR')),
  daily_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, tier)
);

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  custom_role VARCHAR(100),
  tier VARCHAR(20) CHECK (tier IN ('TEAM_LEAD', 'SENIOR', 'JUNIOR')),
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
  currency_code VARCHAR(10) DEFAULT 'THB',
  currency_symbol VARCHAR(10) DEFAULT '฿',
  hours_per_day INTEGER DEFAULT 7,
  tax_enabled BOOLEAN DEFAULT false,
  tax_percentage DECIMAL(5,2) DEFAULT 7.00,
  proposed_price DECIMAL(15,2),
  working_week VARCHAR(20) DEFAULT 'MON_TO_FRI',
  execution_days INTEGER DEFAULT 0,
  buffer_days INTEGER DEFAULT 0,
  guarantee_days INTEGER DEFAULT 8,
  start_date DATE,
  end_date DATE,
  calendar_mode BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id INTEGER REFERENCES team_members(id) ON DELETE CASCADE,
  custom_name VARCHAR(255),
  custom_role VARCHAR(100),
  custom_tier VARCHAR(20) CHECK (custom_tier IN ('TEAM_LEAD', 'SENIOR', 'JUNIOR')),
  daily_rate DECIMAL(10,2) NOT NULL,
  days_allocated INTEGER DEFAULT 0,
  utilization_percentage INTEGER DEFAULT 100,
  multiplier DECIMAL(5,2) DEFAULT 1.0,
  is_billable BOOLEAN DEFAULT true,
  ignore_holidays BOOLEAN DEFAULT false,
  custom_multipliers JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public Holidays table (renamed from holidays for clarity)
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

-- Project Templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('public', 'company')),
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default public holidays
INSERT INTO holidays (name, date, type, project_id) VALUES
('New Year''s Day', '2025-01-01', 'public', NULL),
('Makha Bucha Day', '2025-02-12', 'public', NULL),
('Chakri Memorial Day', '2025-04-06', 'public', NULL),
('Songkran Festival', '2025-04-13', 'public', NULL),
('Songkran Festival', '2025-04-14', 'public', NULL),
('Songkran Festival', '2025-04-15', 'public', NULL),
('Labour Day', '2025-05-01', 'public', NULL),
('Coronation Day', '2025-05-04', 'public', NULL),
('Visakha Bucha Day', '2025-05-12', 'public', NULL),
('Royal Ploughing Ceremony', '2025-05-19', 'public', NULL),
('Asanha Bucha Day', '2025-07-10', 'public', NULL),
('Buddhist Lent Day', '2025-07-11', 'public', NULL),
('HM Queen''s Birthday', '2025-08-12', 'public', NULL),
('HM King''s Birthday', '2025-07-28', 'public', NULL),
('Chulalongkorn Day', '2025-10-23', 'public', NULL),
('HM King''s Birthday', '2025-12-05', 'public', NULL),
('Constitution Day', '2025-12-10', 'public', NULL),
('New Year''s Eve', '2025-12-31', 'public', NULL);
