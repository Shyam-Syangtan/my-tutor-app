-- Fix Unknown Student/Tutor Issue - CORRECTED VERSION
-- This script works with the actual table structure (no 'name' column)

-- Step 1: Check current state
SELECT 'Current lessons table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lessons' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Current users table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if we have user data
SELECT 'Users in users table:' as info;
SELECT id, email, role FROM public.users LIMIT 10;

-- Step 3: Check lessons and their user references
SELECT 'Lessons with user references:' as info;
SELECT 
    l.id,
    l.tutor_id,
    l.student_id,
    l.lesson_date,
    l.status,
    t.email as tutor_email,
    s.email as student_email
FROM public.lessons l
LEFT JOIN public.users t ON l.tutor_id = t.id AND t.role = 'tutor'
LEFT JOIN public.users s ON l.student_id = s.id AND s.role = 'student'
ORDER BY l.created_at DESC
LIMIT 10;

-- Step 4: Create a function to get lessons with proper user names
-- This version extracts names from email addresses (before @)
CREATE OR REPLACE FUNCTION public.get_lessons_with_users()
RETURNS TABLE (
    lesson_id UUID,
    tutor_id UUID,
    student_id UUID,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    status TEXT,
    lesson_type TEXT,
    notes TEXT,
    price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE,
    tutor_name TEXT,
    tutor_email TEXT,
    student_name TEXT,
    student_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as lesson_id,
        l.tutor_id,
        l.student_id,
        l.lesson_date,
        l.start_time,
        l.end_time,
        l.status::TEXT,
        l.lesson_type::TEXT,
        l.notes::TEXT,
        l.price,
        l.created_at,
        COALESCE(
            SPLIT_PART(t.email, '@', 1),
            'Tutor'
        ) as tutor_name,
        COALESCE(t.email, 'unknown@tutor.com') as tutor_email,
        COALESCE(
            SPLIT_PART(s.email, '@', 1),
            'Student'
        ) as student_name,
        COALESCE(s.email, 'unknown@student.com') as student_email
    FROM public.lessons l
    LEFT JOIN public.users t ON l.tutor_id = t.id AND t.role = 'tutor'
    LEFT JOIN public.users s ON l.student_id = s.id AND s.role = 'student'
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create student-specific function
CREATE OR REPLACE FUNCTION public.get_student_lessons_with_tutors(student_user_id UUID)
RETURNS TABLE (
    id UUID,
    tutor_id UUID,
    student_id UUID,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    status TEXT,
    lesson_type TEXT,
    notes TEXT,
    price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE,
    tutor_name TEXT,
    tutor_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.tutor_id,
        l.student_id,
        l.lesson_date,
        l.start_time,
        l.end_time,
        l.status::TEXT,
        l.lesson_type::TEXT,
        l.notes::TEXT,
        l.price,
        l.created_at,
        COALESCE(
            SPLIT_PART(t.email, '@', 1),
            'Tutor'
        ) as tutor_name,
        COALESCE(t.email, 'unknown@tutor.com') as tutor_email
    FROM public.lessons l
    LEFT JOIN public.users t ON l.tutor_id = t.id AND t.role = 'tutor'
    WHERE l.student_id = student_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create tutor-specific function
CREATE OR REPLACE FUNCTION public.get_tutor_lessons_with_students(tutor_user_id UUID)
RETURNS TABLE (
    id UUID,
    tutor_id UUID,
    student_id UUID,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    status TEXT,
    lesson_type TEXT,
    notes TEXT,
    price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE,
    student_name TEXT,
    student_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.tutor_id,
        l.student_id,
        l.lesson_date,
        l.start_time,
        l.end_time,
        l.status::TEXT,
        l.lesson_type::TEXT,
        l.notes::TEXT,
        l.price,
        l.created_at,
        COALESCE(
            SPLIT_PART(s.email, '@', 1),
            'Student'
        ) as student_name,
        COALESCE(s.email, 'unknown@student.com') as student_email
    FROM public.lessons l
    LEFT JOIN public.users s ON l.student_id = s.id AND s.role = 'student'
    WHERE l.tutor_id = tutor_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_lessons_with_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_lessons_with_tutors(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tutor_lessons_with_students(UUID) TO authenticated;

-- Step 8: Test the functions
SELECT 'Testing get_lessons_with_users function:' as info;
SELECT * FROM public.get_lessons_with_users() LIMIT 5;

SELECT 'Script completed successfully!' as result;
