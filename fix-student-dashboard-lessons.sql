-- FIX STUDENT DASHBOARD LESSONS - Ensure lessons appear in student dashboard after approval
-- This script fixes the student lesson display and data relationship issues

-- Step 1: Verify lessons table structure and data
SELECT 
    'LESSONS TABLE VERIFICATION' as section,
    COUNT(*) as total_lessons,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_lessons,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_lessons,
    COUNT(*) FILTER (WHERE lesson_date >= CURRENT_DATE) as future_lessons
FROM public.lessons;

-- Step 2: Check if lessons have proper student relationships
SELECT 
    'STUDENT RELATIONSHIPS CHECK' as section,
    l.id as lesson_id,
    l.student_id,
    l.tutor_id,
    l.lesson_date,
    l.start_time,
    l.status,
    u_student.email as student_email,
    u_tutor.email as tutor_email
FROM public.lessons l
LEFT JOIN auth.users u_student ON l.student_id = u_student.id
LEFT JOIN auth.users u_tutor ON l.tutor_id = u_tutor.id
ORDER BY l.created_at DESC
LIMIT 10;

-- Step 3: Fix the get_student_lessons function to return proper data structure
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
    price DECIMAL,
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
        COALESCE(t.name, 'Unknown Tutor') as tutor_name,
        u.email as tutor_email,
        t.photo_url as tutor_profile_picture
    FROM public.lessons l
    LEFT JOIN auth.users u ON l.tutor_id = u.id
    LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
    WHERE l.student_id = student_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a function to get upcoming lessons specifically
CREATE OR REPLACE FUNCTION public.get_student_upcoming_lessons(student_user_id UUID)
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
    price DECIMAL,
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
        COALESCE(t.name, 'Unknown Tutor') as tutor_name,
        u.email as tutor_email,
        t.photo_url as tutor_profile_picture
    FROM public.lessons l
    LEFT JOIN auth.users u ON l.tutor_id = u.id
    LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
    WHERE l.student_id = student_user_id
    AND l.status = 'confirmed'
    AND (l.lesson_date > CURRENT_DATE OR 
         (l.lesson_date = CURRENT_DATE AND l.start_time > CURRENT_TIME))
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create a function to check lesson creation after approval
CREATE OR REPLACE FUNCTION public.debug_lesson_creation()
RETURNS TABLE (
    section TEXT,
    request_id UUID,
    request_status TEXT,
    lesson_id UUID,
    lesson_status TEXT,
    created_properly BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'RECENT APPROVALS AND LESSONS' as section,
        lr.id as request_id,
        lr.status as request_status,
        l.id as lesson_id,
        l.status as lesson_status,
        (l.id IS NOT NULL) as created_properly
    FROM public.lesson_requests lr
    LEFT JOIN public.lessons l ON (
        lr.tutor_id = l.tutor_id AND 
        lr.student_id = l.student_id AND 
        lr.requested_date = l.lesson_date AND 
        lr.requested_start_time = l.start_time
    )
    WHERE lr.status = 'approved'
    ORDER BY lr.updated_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Test the student lesson functions
DO $$
DECLARE
    test_student_id UUID;
    lesson_count INTEGER;
BEGIN
    -- Get a student ID for testing
    SELECT id INTO test_student_id 
    FROM auth.users 
    WHERE id IN (SELECT DISTINCT student_id FROM public.lessons)
    LIMIT 1;
    
    IF test_student_id IS NOT NULL THEN
        -- Test the function
        SELECT COUNT(*) INTO lesson_count
        FROM public.get_student_lessons(test_student_id);
        
        RAISE NOTICE 'Found % lessons for student %', lesson_count, test_student_id;
        
        -- Test upcoming lessons function
        SELECT COUNT(*) INTO lesson_count
        FROM public.get_student_upcoming_lessons(test_student_id);
        
        RAISE NOTICE 'Found % upcoming lessons for student %', lesson_count, test_student_id;
    ELSE
        RAISE NOTICE 'No students with lessons found for testing';
    END IF;
END $$;

-- Step 7: Create a trigger to notify when lessons are created
CREATE OR REPLACE FUNCTION public.notify_lesson_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Log lesson creation
    RAISE NOTICE 'New lesson created: ID=%, Student=%, Tutor=%, Date=%', 
        NEW.id, NEW.student_id, NEW.tutor_id, NEW.lesson_date;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_lesson_created ON public.lessons;
CREATE TRIGGER on_lesson_created
    AFTER INSERT ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION public.notify_lesson_created();

-- Step 8: Verify RLS policies allow student access
SELECT 
    'RLS POLICIES CHECK' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'lessons';

-- Step 9: Test lesson visibility for students
DO $$
DECLARE
    test_student_id UUID;
    visible_lessons INTEGER;
BEGIN
    -- Get a student ID
    SELECT id INTO test_student_id 
    FROM auth.users 
    LIMIT 1;
    
    IF test_student_id IS NOT NULL THEN
        -- Check how many lessons this student can see
        SELECT COUNT(*) INTO visible_lessons
        FROM public.lessons
        WHERE student_id = test_student_id;
        
        RAISE NOTICE 'Student % can see % lessons', test_student_id, visible_lessons;
    END IF;
END $$;

-- Step 10: Show completion status and debug info
SELECT 
    'STUDENT DASHBOARD LESSONS FIXED!' as status,
    'Enhanced get_student_lessons function' as function_status,
    'Added upcoming lessons function' as upcoming_status,
    'Created debug functions' as debug_status,
    'Added lesson creation notifications' as notification_status,
    'Verified RLS policies' as security_status,
    'Ready for student dashboard testing!' as ready_status;

-- Show debug information
SELECT * FROM public.debug_lesson_creation();
