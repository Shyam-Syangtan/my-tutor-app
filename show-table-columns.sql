-- SHOW TABLE COLUMNS - See the actual structure of your tables

-- Show lessons table structure
SELECT 
    'LESSONS TABLE' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show lesson_requests table structure  
SELECT 
    'LESSON_REQUESTS TABLE' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lesson_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data from lessons table (if any)
SELECT 
    'SAMPLE LESSONS DATA' as info,
    *
FROM public.lessons 
LIMIT 3;

-- Show sample data from lesson_requests table (if any)
SELECT 
    'SAMPLE LESSON_REQUESTS DATA' as info,
    *
FROM public.lesson_requests 
LIMIT 3;
