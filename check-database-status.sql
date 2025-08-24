-- Check current database status
-- This will help identify what's wrong

-- 1. Check if notes table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notes'
ORDER BY ordinal_position;

-- 2. Check if simple_tasks table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'simple_tasks'
ORDER BY ordinal_position;

-- 3. Check if tasks table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 4. Check if projects table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 5. Check if clients table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- 6. Check table counts
SELECT 'notes' as table_name, COUNT(*) as count FROM notes
UNION ALL
SELECT 'simple_tasks' as table_name, COUNT(*) as count FROM simple_tasks
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as count FROM tasks
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'clients' as table_name, COUNT(*) as count FROM clients;
