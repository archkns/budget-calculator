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
