-- Seed data for Manday Calculator

-- Insert roles
INSERT INTO roles (name) VALUES 
  ('Project Director'),
  ('Experience Designer (UX/UI)'),
  ('Project Owner'),
  ('Business Innovation Analyst (BA)'),
  ('System Analyst'),
  ('Frontend Dev'),
  ('Backend Dev'),
  ('LINE Dev'),
  ('DevOps'),
  ('QA Tester'),
  ('Operation')
ON CONFLICT (name) DO NOTHING;

-- Insert rate cards with Omelet rates
INSERT INTO rate_cards (role_id, tier, daily_rate) VALUES 
  -- Project Director (only Team Lead)
  ((SELECT id FROM roles WHERE name = 'Project Director'), 'TEAM_LEAD', 60000),
  
  -- Experience Designer (UX/UI)
  ((SELECT id FROM roles WHERE name = 'Experience Designer (UX/UI)'), 'TEAM_LEAD', 18000),
  ((SELECT id FROM roles WHERE name = 'Experience Designer (UX/UI)'), 'SENIOR', 14000),
  ((SELECT id FROM roles WHERE name = 'Experience Designer (UX/UI)'), 'JUNIOR', 10000),
  
  -- Project Owner
  ((SELECT id FROM roles WHERE name = 'Project Owner'), 'TEAM_LEAD', 20000),
  ((SELECT id FROM roles WHERE name = 'Project Owner'), 'SENIOR', 16000),
  ((SELECT id FROM roles WHERE name = 'Project Owner'), 'JUNIOR', 12000),
  
  -- Business Innovation Analyst (BA)
  ((SELECT id FROM roles WHERE name = 'Business Innovation Analyst (BA)'), 'TEAM_LEAD', 20000),
  ((SELECT id FROM roles WHERE name = 'Business Innovation Analyst (BA)'), 'SENIOR', 16000),
  ((SELECT id FROM roles WHERE name = 'Business Innovation Analyst (BA)'), 'JUNIOR', 12000),
  
  -- System Analyst
  ((SELECT id FROM roles WHERE name = 'System Analyst'), 'TEAM_LEAD', 18000),
  ((SELECT id FROM roles WHERE name = 'System Analyst'), 'SENIOR', 14000),
  ((SELECT id FROM roles WHERE name = 'System Analyst'), 'JUNIOR', 12000),
  
  -- Frontend Dev
  ((SELECT id FROM roles WHERE name = 'Frontend Dev'), 'TEAM_LEAD', 18000),
  ((SELECT id FROM roles WHERE name = 'Frontend Dev'), 'SENIOR', 14000),
  ((SELECT id FROM roles WHERE name = 'Frontend Dev'), 'JUNIOR', 12000),
  
  -- Backend Dev
  ((SELECT id FROM roles WHERE name = 'Backend Dev'), 'TEAM_LEAD', 20000),
  ((SELECT id FROM roles WHERE name = 'Backend Dev'), 'SENIOR', 14000),
  ((SELECT id FROM roles WHERE name = 'Backend Dev'), 'JUNIOR', 12000),
  
  -- LINE Dev
  ((SELECT id FROM roles WHERE name = 'LINE Dev'), 'TEAM_LEAD', 22000),
  ((SELECT id FROM roles WHERE name = 'LINE Dev'), 'SENIOR', 16000),
  ((SELECT id FROM roles WHERE name = 'LINE Dev'), 'JUNIOR', 12000),
  
  -- DevOps (no Junior)
  ((SELECT id FROM roles WHERE name = 'DevOps'), 'TEAM_LEAD', 25000),
  ((SELECT id FROM roles WHERE name = 'DevOps'), 'SENIOR', 18000),
  
  -- QA Tester
  ((SELECT id FROM roles WHERE name = 'QA Tester'), 'TEAM_LEAD', 16000),
  ((SELECT id FROM roles WHERE name = 'QA Tester'), 'SENIOR', 13000),
  ((SELECT id FROM roles WHERE name = 'QA Tester'), 'JUNIOR', 10000),
  
  -- Operation
  ((SELECT id FROM roles WHERE name = 'Operation'), 'TEAM_LEAD', 12000),
  ((SELECT id FROM roles WHERE name = 'Operation'), 'SENIOR', 10500),
  ((SELECT id FROM roles WHERE name = 'Operation'), 'JUNIOR', 9000)
ON CONFLICT (role_id, tier) DO NOTHING;

-- Insert standard Thai public holidays for 2025
INSERT INTO public_holidays (project_id, date, name, treatment, is_custom) VALUES 
  (NULL, '2025-01-01', 'New Year''s Day', 'EXCLUDE', false),
  (NULL, '2025-02-12', 'Makha Bucha Day', 'EXCLUDE', false),
  (NULL, '2025-04-06', 'Chakri Memorial Day', 'EXCLUDE', false),
  (NULL, '2025-04-13', 'Songkran Festival', 'EXCLUDE', false),
  (NULL, '2025-04-14', 'Songkran Festival', 'EXCLUDE', false),
  (NULL, '2025-04-15', 'Songkran Festival', 'EXCLUDE', false),
  (NULL, '2025-05-01', 'Labour Day', 'EXCLUDE', false),
  (NULL, '2025-05-05', 'Coronation Day', 'EXCLUDE', false),
  (NULL, '2025-05-11', 'Visakha Bucha Day', 'EXCLUDE', false),
  (NULL, '2025-07-28', 'King Vajiralongkorn''s Birthday', 'EXCLUDE', false),
  (NULL, '2025-08-12', 'Queen Sirikit''s Birthday', 'EXCLUDE', false),
  (NULL, '2025-10-13', 'King Bhumibol Memorial Day', 'EXCLUDE', false),
  (NULL, '2025-10-23', 'Chulalongkorn Day', 'EXCLUDE', false),
  (NULL, '2025-12-05', 'King Bhumibol''s Birthday', 'EXCLUDE', false),
  (NULL, '2025-12-10', 'Constitution Day', 'EXCLUDE', false),
  (NULL, '2025-12-31', 'New Year''s Eve', 'EXCLUDE', false)
ON CONFLICT DO NOTHING;
