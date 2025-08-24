# Supabase Beállítás TaskFlow-hoz

## 1. Supabase Projekt Létrehozása

1. Menj a [supabase.com](https://supabase.com)-ra
2. Kattints a "Start your project" gombra
3. Válaszd ki a "New project" opciót
4. Add meg a projekt nevét: `taskflow`
5. Válaszd ki a régiót (pl. West Europe)
6. Add meg a jelszót az adatbázishoz
7. Kattints a "Create new project" gombra

## 2. Adatbázis Beállítása

### SQL Editor megnyitása
1. A projekt dashboard-on kattints a "SQL Editor" menüpontra
2. Kattints a "New query" gombra

### Adatbázis séma létrehozása
Másold be és futtasd le a következő SQL kódot:

```sql
-- TaskFlow Database Setup
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);

-- Function to update project progress automatically
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET 
    progress = (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE is_completed = true) * 100.0) / 
          NULLIF(COUNT(*), 0)
        ), 0
      )
      FROM tasks 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    status = CASE 
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
      ELSE 'created'
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic project progress calculation
DROP TRIGGER IF EXISTS trigger_update_project_progress ON tasks;
CREATE TRIGGER trigger_update_project_progress
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_projects_updated_at ON projects;
CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO clients (name, email, phone, address) VALUES
('ABC Kft.', 'info@abc.hu', '+36 1 234 5678', 'Budapest, Váci utca 1.'),
('XYZ Zrt.', 'contact@xyz.hu', '+36 1 987 6543', 'Debrecen, Fő utca 10.'),
('Tech Solutions', 'hello@techsolutions.hu', '+36 1 555 1234', 'Szeged, Kossuth tér 5.')
ON CONFLICT DO NOTHING;

-- Insert sample projects
INSERT INTO projects (client_id, title, description, status, due_date) 
SELECT 
  c.id,
  'Weboldal Fejlesztés',
  'Modern, reszponzív weboldal fejlesztése e-commerce funkcionalitással',
  'in_progress',
  '2024-02-15'
FROM clients c WHERE c.name = 'ABC Kft.'
ON CONFLICT DO NOTHING;

INSERT INTO projects (client_id, title, description, status, due_date) 
SELECT 
  c.id,
  'Mobil App Design',
  'iOS és Android alkalmazás UI/UX tervezése',
  'completed',
  '2024-01-10'
FROM clients c WHERE c.name = 'XYZ Zrt.'
ON CONFLICT DO NOTHING;

INSERT INTO projects (client_id, title, description, status, due_date) 
SELECT 
  c.id,
  'E-commerce Platform',
  'Teljes e-commerce megoldás fejlesztése',
  'in_progress',
  '2024-02-20'
FROM clients c WHERE c.name = 'Tech Solutions'
ON CONFLICT DO NOTHING;

-- Insert sample tasks
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

INSERT INTO tasks (project_id, title, description, is_completed, priority, due_date, order_index)
SELECT 
  p.id,
  'Adatbázis tervezés',
  'E-commerce adatbázis sémájának megtervezése',
  false,
  'high',
  '2024-01-20',
  0
FROM projects p WHERE p.title = 'E-commerce Platform'
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for now, allow all operations - you can customize these later)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
```

## 3. API Kulcsok Lekérése

### Settings menüpont
1. A projekt dashboard-on kattints a "Settings" menüpontra
2. Kattints az "API" almenüpontra

### Kulcsok másolása
1. **Project URL**: Másold ki a "Project URL" értékét
2. **anon public**: Másold ki az "anon public" kulcsot

## 4. Környezeti Változók Beállítása

Hozz létre egy `.env.local` fájlt a projekt gyökerében:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. Alkalmazás Tesztelése

1. Indítsd el a fejlesztői szervert: `npm run dev`
2. Nyisd meg a böngészőben: `http://localhost:3000`
3. Teszteld a funkciókat:
   - Ügyfelek létrehozása/szerkesztése
   - Projektek létrehozása/szerkesztése
   - Feladatok létrehozása/szerkesztése
   - Drag & drop funkcionalitás

## 6. Hibaelhárítás

### Kapcsolódási hiba
- Ellenőrizd, hogy a környezeti változók helyesen vannak beállítva
- Ellenőrizd, hogy a Supabase projekt aktív

### Adatbázis hiba
- Ellenőrizd, hogy az SQL szkript sikeresen lefutott
- Nézd meg a Supabase Table Editor-ben, hogy a táblák létrejöttek-e

### RLS hiba
- Ellenőrizd, hogy a Row Level Security policy-k helyesen vannak beállítva
- Teszteld a kapcsolatot a Supabase Table Editor-ben

## 7. További Beállítások

### Real-time Subscriptions
Ha real-time frissítéseket szeretnél, engedélyezd a real-time funkciót a Supabase dashboard-on.

### Authentication
Ha felhasználói bejelentkezést szeretnél hozzáadni, konfiguráld az Authentication beállításokat.

### Storage
Ha fájl feltöltést szeretnél, konfiguráld a Storage beállításokat.

---

**Megjegyzés**: Ez a beállítás tesztelési célokra van. Production környezetben érdemes biztonságosabb RLS policy-ket és authentication-t beállítani.
