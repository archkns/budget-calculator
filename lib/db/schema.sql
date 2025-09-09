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
