-- Notes and Simple Tasks Tables for TaskFlow
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple tasks table (not linked to projects)
CREATE TABLE IF NOT EXISTS simple_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simple_tasks_note_id ON simple_tasks(note_id);
CREATE INDEX IF NOT EXISTS idx_simple_tasks_is_completed ON simple_tasks(is_completed);

-- Function to update note progress automatically
CREATE OR REPLACE FUNCTION update_note_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used to update note progress if needed
  -- For now, we'll calculate progress on the frontend
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update note progress when simple_tasks change
CREATE TRIGGER trigger_update_note_progress
  AFTER INSERT OR UPDATE OR DELETE ON simple_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_note_progress();

-- Insert some sample data
INSERT INTO notes (title, content) VALUES 
  ('Bevásárlás', 'Heti bevásárlás listája'),
  ('Házimunka', 'Heti házimunka feladatok')
ON CONFLICT DO NOTHING;

-- Insert sample tasks for the first note
INSERT INTO simple_tasks (title, is_completed, note_id) 
SELECT 'Tej', true, id FROM notes WHERE title = 'Bevásárlás'
UNION ALL
SELECT 'Kenyér', false, id FROM notes WHERE title = 'Bevásárlás'
UNION ALL
SELECT 'Számítógép', false, id FROM notes WHERE title = 'Bevásárlás'
ON CONFLICT DO NOTHING;

-- Insert sample tasks for the second note
INSERT INTO simple_tasks (title, is_completed, note_id) 
SELECT 'Mosás', true, id FROM notes WHERE title = 'Házimunka'
UNION ALL
SELECT 'Takarítás', true, id FROM notes WHERE title = 'Házimunka'
UNION ALL
SELECT 'Főzés', false, id FROM notes WHERE title = 'Házimunka'
ON CONFLICT DO NOTHING;
