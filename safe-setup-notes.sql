-- Biztonságos Notes és Simple Tasks táblák létrehozása
-- Ez a script NEM módosítja a meglévő projekteket!
-- Futtasd le a Supabase SQL Editor-ben

-- 1. UUID extension engedélyezése (ha még nincs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Notes tábla létrehozása (csak ha még nem létezik)
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Simple tasks tábla létrehozása (csak ha még nem létezik)
CREATE TABLE IF NOT EXISTS simple_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexek létrehozása (csak ha még nem léteznek)
CREATE INDEX IF NOT EXISTS idx_simple_tasks_note_id ON simple_tasks(note_id);
CREATE INDEX IF NOT EXISTS idx_simple_tasks_is_completed ON simple_tasks(is_completed);

-- 5. Minta adatok beszúrása (csak ha még nem léteznek)
INSERT INTO notes (title, content) VALUES 
  ('Bevásárlás', 'Heti bevásárlás listája'),
  ('Házimunka', 'Heti házimunka feladatok')
ON CONFLICT DO NOTHING;

-- 6. Minta feladatok beszúrása (csak ha még nem léteznek)
INSERT INTO simple_tasks (title, is_completed, note_id) 
SELECT 'Tej', true, id FROM notes WHERE title = 'Bevásárlás'
UNION ALL
SELECT 'Kenyér', false, id FROM notes WHERE title = 'Bevásárlás'
UNION ALL
SELECT 'Számítógép', false, id FROM notes WHERE title = 'Bevásárlás'
ON CONFLICT DO NOTHING;

INSERT INTO simple_tasks (title, is_completed, note_id) 
SELECT 'Mosás', true, id FROM notes WHERE title = 'Házimunka'
UNION ALL
SELECT 'Takarítás', true, id FROM notes WHERE title = 'Házimunka'
UNION ALL
SELECT 'Főzés', false, id FROM notes WHERE title = 'Házimunka'
ON CONFLICT DO NOTHING;

-- 7. Ellenőrzés - kilistázza a létrehozott táblákat
SELECT 'Notes table created successfully' as status, COUNT(*) as note_count FROM notes;
SELECT 'Simple tasks table created successfully' as status, COUNT(*) as task_count FROM simple_tasks;
