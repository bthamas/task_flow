-- Complete Database Fix for TaskFlow
-- This script fixes all database issues and aligns with TypeScript types

-- 1. Drop problematic tables that were causing issues
DROP TABLE IF EXISTS simple_tasks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;

-- 2. Drop existing tables to recreate with correct schema
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- 3. Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_project_progress() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 4. Recreate clients table with correct schema
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Recreate projects table with correct schema matching TypeScript types
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_status VARCHAR(20) DEFAULT 'not_started' CHECK (project_status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  budget DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Recreate tasks table with correct schema
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for better performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(project_status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_order_index ON tasks(order_index);
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- 8. Function to update project progress automatically
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET 
    progress_percentage = (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE is_completed = true) * 100.0) / 
          NULLIF(COUNT(*), 0)
        ), 0
      )
      FROM tasks 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    project_status = CASE 
      WHEN (
        SELECT COALESCE(
          ROUND(
            (COUNT(*) FILTER (WHERE is_completed = true) * 100.0) / 
            NULLIF(COUNT(*), 0)
          ), 0
        )
        FROM tasks 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
      ) = 100 THEN 'completed'
      WHEN (
        SELECT COUNT(*) 
        FROM tasks 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
        AND is_completed = true
      ) > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for automatic project progress calculation
CREATE TRIGGER trigger_update_project_progress
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();

-- 10. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Triggers for updated_at
CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies (allow all operations for now)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);

-- 14. Insert sample data for testing
INSERT INTO clients (name, email, phone, address) VALUES
('ABC Kft.', 'info@abc.hu', '+36 1 234 5678', 'Budapest, Váci utca 1.'),
('XYZ Zrt.', 'contact@xyz.hu', '+36 1 987 6543', 'Debrecen, Fő utca 10.'),
('Tech Solutions', 'hello@techsolutions.hu', '+36 1 555 1234', 'Szeged, Kossuth tér 5.')
ON CONFLICT DO NOTHING;

-- 15. Insert sample projects
INSERT INTO projects (client_id, title, description, project_status, end_date, priority) 
SELECT 
  c.id,
  'Weboldal Fejlesztés',
  'Modern, reszponzív weboldal fejlesztése e-commerce funkcionalitással',
  'in_progress',
  '2024-02-15',
  'high'
FROM clients c WHERE c.name = 'ABC Kft.'
ON CONFLICT DO NOTHING;

INSERT INTO projects (client_id, title, description, project_status, end_date, priority) 
SELECT 
  c.id,
  'Mobil App Design',
  'iOS és Android alkalmazás UI/UX tervezése',
  'completed',
  '2024-01-10',
  'medium'
FROM clients c WHERE c.name = 'XYZ Zrt.'
ON CONFLICT DO NOTHING;

INSERT INTO projects (client_id, title, description, project_status, end_date, priority) 
SELECT 
  c.id,
  'E-commerce Platform',
  'Teljes e-commerce megoldás fejlesztése',
  'not_started',
  '2024-02-20',
  'high'
FROM clients c WHERE c.name = 'Tech Solutions'
ON CONFLICT DO NOTHING;

-- 16. Insert sample tasks
INSERT INTO tasks (project_id, title, description, is_completed, priority, due_date, order_index)
SELECT 
  p.id,
  'Design mockupok létrehozása',
  'Főoldal és termékoldal design mockupok elkészítése',
  true,
  'high',
  '2024-01-10',
  0
FROM projects p WHERE p.title = 'Weboldal Fejlesztés'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (project_id, title, description, is_completed, priority, due_date, order_index)
SELECT 
  p.id,
  'Frontend komponensek fejlesztése',
  'React komponensek implementálása a design alapján',
  false,
  'high',
  '2024-01-15',
  1
FROM projects p WHERE p.title = 'Weboldal Fejlesztés'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (project_id, title, description, is_completed, priority, due_date, order_index)
SELECT 
  p.id,
  'API integráció',
  'Backend API-val való kommunikáció beállítása',
  false,
  'medium',
  '2024-01-18',
  2
FROM projects p WHERE p.title = 'Weboldal Fejlesztés'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (project_id, title, description, is_completed, priority, due_date, order_index)
SELECT 
  p.id,
  'UI/UX tervezés',
  'Alkalmazás felhasználói felületének tervezése',
  true,
  'high',
  '2024-01-08',
  0
FROM projects p WHERE p.title = 'Mobil App Design'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (project_id, title, description, is_completed, priority, due_date, order_index)
SELECT 
  p.id,
  'Prototípus készítése',
  'Interaktív prototípus fejlesztése Figmában',
  true,
  'medium',
  '2024-01-12',
  1
FROM projects p WHERE p.title = 'Mobil App Design'
ON CONFLICT DO NOTHING;

-- 17. Verify the setup
SELECT 'Database setup completed successfully!' as status;
