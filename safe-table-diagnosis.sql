-- SAFE TABLE DIAGNOSIS - No assumptions about table structure
-- This script safely checks what tables and columns actually exist

-- Step 1: Check what lesson-related tables exist
SELECT 
    'LESSON-RELATED TABLES' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%lesson%' OR table_name LIKE '%booking%' OR table_name LIKE '%schedule%')
ORDER BY table_name;

-- Step 2: Check lessons table specifically
SELECT 
    'LESSONS TABLE CHECK' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as table_status;

-- Step 3: If lessons table exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public') THEN
        RAISE NOTICE 'Lessons table exists - structure will be shown below';
    ELSE
        RAISE NOTICE 'Lessons table does not exist - may need to be created';
    END IF;
END $$;

-- Step 4: Show lessons table columns (only if table exists)
SELECT 
    'LESSONS TABLE STRUCTURE' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public')
ORDER BY ordinal_position;

-- Step 5: Check for common column patterns
DO $$
DECLARE
    has_student_id BOOLEAN := FALSE;
    has_tutor_id BOOLEAN := FALSE;
    has_lesson_date BOOLEAN := FALSE;
    has_scheduled_at BOOLEAN := FALSE;
    has_user_id BOOLEAN := FALSE;
    table_exists BOOLEAN := FALSE;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'lessons' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check for common columns
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'student_id' AND table_schema = 'public'
        ) INTO has_student_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'tutor_id' AND table_schema = 'public'
        ) INTO has_tutor_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'lesson_date' AND table_schema = 'public'
        ) INTO has_lesson_date;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'scheduled_at' AND table_schema = 'public'
        ) INTO has_scheduled_at;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'user_id' AND table_schema = 'public'
        ) INTO has_user_id;
        
        RAISE NOTICE 'COLUMN ANALYSIS:';
        RAISE NOTICE 'student_id: %', has_student_id;
        RAISE NOTICE 'tutor_id: %', has_tutor_id;
        RAISE NOTICE 'lesson_date: %', has_lesson_date;
        RAISE NOTICE 'scheduled_at: %', has_scheduled_at;
        RAISE NOTICE 'user_id: %', has_user_id;
        
        IF NOT has_student_id AND NOT has_tutor_id THEN
            RAISE NOTICE 'WARNING: No student_id or tutor_id columns found!';
            RAISE NOTICE 'This table may not be set up for lesson management';
        END IF;
        
    ELSE
        RAISE NOTICE 'Cannot analyze columns - lessons table does not exist';
    END IF;
END $$;

-- Step 6: Check lesson_requests table
SELECT 
    'LESSON_REQUESTS TABLE CHECK' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as table_status;

-- Step 7: Show lesson_requests structure if it exists
SELECT 
    'LESSON_REQUESTS STRUCTURE' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lesson_requests' 
AND table_schema = 'public'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests' AND table_schema = 'public')
ORDER BY ordinal_position;

-- Step 8: Count records in existing tables
DO $$
DECLARE
    lessons_count INTEGER := 0;
    requests_count INTEGER := 0;
    lessons_exists BOOLEAN := FALSE;
    requests_exists BOOLEAN := FALSE;
BEGIN
    -- Check lessons table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'lessons' AND table_schema = 'public'
    ) INTO lessons_exists;
    
    -- Check lesson_requests table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'lesson_requests' AND table_schema = 'public'
    ) INTO requests_exists;
    
    IF lessons_exists THEN
        SELECT COUNT(*) INTO lessons_count FROM public.lessons;
        RAISE NOTICE 'Lessons table: % records', lessons_count;
    ELSE
        RAISE NOTICE 'Lessons table: does not exist';
    END IF;
    
    IF requests_exists THEN
        SELECT COUNT(*) INTO requests_count FROM public.lesson_requests;
        RAISE NOTICE 'Lesson requests table: % records', requests_count;
    ELSE
        RAISE NOTICE 'Lesson requests table: does not exist';
    END IF;
END $$;

-- Step 9: Provide recommendations
DO $$
DECLARE
    lessons_exists BOOLEAN := FALSE;
    requests_exists BOOLEAN := FALSE;
    has_student_id BOOLEAN := FALSE;
    has_tutor_id BOOLEAN := FALSE;
BEGIN
    -- Check table existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'lessons' AND table_schema = 'public'
    ) INTO lessons_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'lesson_requests' AND table_schema = 'public'
    ) INTO requests_exists;
    
    IF lessons_exists THEN
        -- Check for required columns
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'student_id' AND table_schema = 'public'
        ) INTO has_student_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'tutor_id' AND table_schema = 'public'
        ) INTO has_tutor_id;
    END IF;
    
    RAISE NOTICE 'RECOMMENDATIONS:';
    
    IF NOT lessons_exists THEN
        RAISE NOTICE '1. Create lessons table with proper structure';
        RAISE NOTICE '2. Run the complete workflow fix script first';
    ELSIF NOT has_student_id OR NOT has_tutor_id THEN
        RAISE NOTICE '1. Lessons table exists but missing required columns';
        RAISE NOTICE '2. Add student_id and tutor_id columns';
        RAISE NOTICE '3. Or recreate table with proper structure';
    ELSE
        RAISE NOTICE '1. Lessons table structure looks good';
        RAISE NOTICE '2. Can proceed with student dashboard fixes';
    END IF;
    
    IF NOT requests_exists THEN
        RAISE NOTICE '3. Consider creating lesson_requests table for booking workflow';
    END IF;
END $$;

-- Step 10: Show completion
SELECT 
    'SAFE DIAGNOSIS COMPLETE' as status,
    'Check the results above for your actual table structure' as next_step,
    'Use recommendations to determine next actions' as guidance;
