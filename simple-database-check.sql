-- SIMPLE DATABASE CHECK - See what tables actually exist
-- This will show us what's really in your database

-- Step 1: Show ALL tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: Show ALL columns in public schema (if any tables exist)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Step 3: Check if specific tables exist
SELECT 
    'lessons' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
UNION ALL
SELECT 
    'lesson_requests' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
UNION ALL
SELECT 
    'tutors' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutors' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status;
