-- Fix for function structure mismatch error
-- Run this in Supabase SQL Editor to fix the student lesson loading functions

-- Drop existing functions that have structure issues
DROP FUNCTION IF EXISTS public.get_student_lessons_optimized(UUID);
DROP FUNCTION IF EXISTS public.get_student_lessons(UUID);
DROP FUNCTION IF EXISTS public.get_student_lessons_complete(UUID);

-- Create simplified function that matches the expected structure
CREATE OR REPLACE FUNCTION public.get_student_lessons_optimized(student_user_id UUID)
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
    tutor_email TEXT,
    tutor_profile_picture TEXT
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
        l.status,
        l.lesson_type,
        l.notes,
        l.price,
        l.created_at,
        COALESCE(t.name, u.email, 'Unknown Tutor') as tutor_name,
        u.email as tutor_email,
        t.photo_url as tutor_profile_picture
    FROM public.lessons l
    LEFT JOIN auth.users u ON l.tutor_id = u.id
    LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
    WHERE l.student_id = student_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create basic function as fallback
CREATE OR REPLACE FUNCTION public.get_student_lessons(student_user_id UUID)
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
    tutor_email TEXT,
    tutor_profile_picture TEXT
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
        COALESCE(t.name, 'Unknown Tutor')::TEXT as tutor_name,
        COALESCE(u.email, 'unknown@email.com')::TEXT as tutor_email,
        COALESCE(t.photo_url, '')::TEXT as tutor_profile_picture
    FROM public.lessons l
    LEFT JOIN auth.users u ON l.tutor_id = u.id
    LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
    WHERE l.student_id = student_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_student_lessons_optimized(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_lessons(UUID) TO anon, authenticated;

-- Test the functions
SELECT 'Testing optimized function...' as status;
SELECT COUNT(*) as lesson_count FROM public.get_student_lessons_optimized(
    (SELECT id FROM auth.users LIMIT 1)
);

SELECT 'Testing basic function...' as status;
SELECT COUNT(*) as lesson_count FROM public.get_student_lessons(
    (SELECT id FROM auth.users LIMIT 1)
);

SELECT 'Function fix completed!' as status;
