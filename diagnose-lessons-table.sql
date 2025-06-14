-- DIAGNOSE LESSONS TABLE - Check actual table structure and fix issues
-- Run this first to understand what we're working with

-- Step 1: Check if lessons table exists
SELECT 
    'LESSONS TABLE EXISTENCE CHECK' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as table_status;

-- Step 2: Show actual table structure
SELECT 
    'LESSONS TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Show sample data (if any exists) - safe approach
DO $$
DECLARE
    lesson_count INTEGER;
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists first
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'lessons' AND table_schema = 'public'
    ) INTO table_exists;

    IF table_exists THEN
        SELECT COUNT(*) INTO lesson_count FROM public.lessons;
        RAISE NOTICE 'Total lessons in table: %', lesson_count;

        IF lesson_count > 0 THEN
            RAISE NOTICE 'Sample lesson data will be shown below';
        ELSE
            RAISE NOTICE 'No lesson data found - table is empty';
        END IF;
    ELSE
        RAISE NOTICE 'Lessons table does not exist';
    END IF;
END $$;

-- Step 4: Show sample lessons (first 3 rows) - safe approach
DO $$
DECLARE
    table_exists BOOLEAN;
    lesson_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'lessons' AND table_schema = 'public'
    ) INTO table_exists;

    IF table_exists THEN
        SELECT COUNT(*) INTO lesson_count FROM public.lessons;
        IF lesson_count > 0 THEN
            RAISE NOTICE 'Sample lesson data available - check query results below';
        ELSE
            RAISE NOTICE 'No sample data - table is empty';
        END IF;
    ELSE
        RAISE NOTICE 'Cannot show sample data - table does not exist';
    END IF;
END $$;

-- Only run this if table exists and has data
SELECT
    'SAMPLE LESSON DATA' as section,
    *
FROM public.lessons
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public')
LIMIT 3;

-- Step 5: Check for foreign key relationships
SELECT 
    'FOREIGN KEY CONSTRAINTS' as section,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'lessons'
AND tc.table_schema = 'public';

-- Step 6: Check RLS policies
SELECT 
    'RLS POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'lessons'
AND schemaname = 'public';

-- Step 7: Check if we have any lesson_requests for comparison
SELECT 
    'LESSON REQUESTS TABLE CHECK' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests' AND table_schema = 'public')
        THEN (SELECT COUNT(*)::TEXT FROM public.lesson_requests)
        ELSE '0'
    END as record_count;

-- Step 8: Show recent lesson_requests if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests' AND table_schema = 'public') THEN
        RAISE NOTICE 'Lesson requests table exists - checking recent requests';
    ELSE
        RAISE NOTICE 'No lesson_requests table found';
    END IF;
END $$;

-- Step 9: Recommend next steps based on findings
SELECT 
    'DIAGNOSIS COMPLETE' as status,
    'Check the results above to understand table structure' as next_step_1,
    'Use the corrected SQL script based on your table structure' as next_step_2,
    'If table is missing columns, run the complete workflow fix first' as next_step_3;
