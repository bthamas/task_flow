-- Restore Database to Original Working State
-- This removes the problematic notes and simple_tasks tables
-- and restores the original working structure

-- 1. Drop the problematic tables that were causing issues
DROP TABLE IF EXISTS simple_tasks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;

-- 2. Ensure the original tables exist and are working
-- (These should already exist from the original setup)

-- 3. Verify the original tables are intact
-- clients table should exist
-- projects table should exist  
-- tasks table should exist

-- 4. Check if there are any issues with the original tables
-- If tasks table is missing, recreate it with original structure
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);

-- 6. Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for tasks table
CREATE POLICY "Enable read access for all users" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON tasks
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON tasks
  FOR DELETE USING (true);

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Verify all original tables are working
-- This should restore the database to the working state before the chat started
