-- Check Table Structure Script
-- Run this first to understand your database structure

-- Check users table structure
SELECT 'USERS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check lessons table structure  
SELECT 'LESSONS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'lessons' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if tutors table exists
SELECT 'TUTORS TABLE EXISTS:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tutors' AND table_schema = 'public'
) as tutors_table_exists;

-- If tutors table exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutors' AND table_schema = 'public') THEN
        RAISE NOTICE 'TUTORS TABLE STRUCTURE:';
        -- This will be shown in a separate query below
    END IF;
END $$;

-- Check tutors table structure (if it exists)
SELECT 'TUTORS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tutors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data from users table
SELECT 'SAMPLE USERS DATA:' as info;
SELECT * FROM public.users LIMIT 3;

-- Check sample data from lessons table
SELECT 'SAMPLE LESSONS DATA:' as info;
SELECT * FROM public.lessons LIMIT 3;

-- Check if there are any lessons with user references
SELECT 'LESSONS WITH USER REFERENCES:' as info;
SELECT 
    l.id,
    l.tutor_id,
    l.student_id,
    l.lesson_date,
    l.status
FROM public.lessons l
LIMIT 5;

SELECT 'Table structure check completed!' as result;
