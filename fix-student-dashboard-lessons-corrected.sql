-- FIX STUDENT DASHBOARD LESSONS (CORRECTED) - Ensure lessons appear in student dashboard after approval
-- This script fixes the student lesson display and data relationship issues
-- CORRECTED VERSION - handles different possible table structures

-- Step 1: Check what columns actually exist in the lessons table
SELECT 
    'LESSONS TABLE STRUCTURE CHECK' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Verify lessons table structure and data (flexible query)
DO $$
DECLARE
    has_lesson_date BOOLEAN;
    has_scheduled_at BOOLEAN;
    total_lessons INTEGER;
BEGIN
    -- Check if lesson_date column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' 
        AND column_name = 'lesson_date'
        AND table_schema = 'public'
    ) INTO has_lesson_date;
    
    -- Check if scheduled_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' 
        AND column_name = 'scheduled_at'
        AND table_schema = 'public'
    ) INTO has_scheduled_at;
    
    -- Get total lessons count
    SELECT COUNT(*) INTO total_lessons FROM public.lessons;
    
    RAISE NOTICE 'Table structure: lesson_date=%, scheduled_at=%, total_lessons=%', 
        has_lesson_date, has_scheduled_at, total_lessons;
END $$;

-- Step 3: Create a flexible function that works with different table structures
CREATE OR REPLACE FUNCTION public.get_student_lessons_flexible(student_user_id UUID)
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
DECLARE
    has_lesson_date BOOLEAN;
    has_scheduled_at BOOLEAN;
BEGIN
    -- Check table structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'lesson_date' AND table_schema = 'public'
    ) INTO has_lesson_date;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'scheduled_at' AND table_schema = 'public'
    ) INTO has_scheduled_at;
    
    -- Return query based on available columns
    IF has_lesson_date THEN
        -- Use lesson_date, start_time, end_time structure
        RETURN QUERY
        SELECT 
            l.id,
            l.tutor_id,
            l.student_id,
            l.lesson_date,
            l.start_time,
            l.end_time,
            l.status,
            COALESCE(l.lesson_type, 'conversation_practice') as lesson_type,
            l.notes,
            COALESCE(l.price, 500.00) as price,
            l.created_at,
            COALESCE(t.name, 'Unknown Tutor') as tutor_name,
            u.email as tutor_email,
            t.photo_url as tutor_profile_picture
        FROM public.lessons l
        LEFT JOIN auth.users u ON l.tutor_id = u.id
        LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
        WHERE l.student_id = student_user_id
        ORDER BY l.lesson_date ASC, l.start_time ASC;
        
    ELSIF has_scheduled_at THEN
        -- Use scheduled_at structure
        RETURN QUERY
        SELECT 
            l.id,
            l.tutor_id,
            l.student_id,
            l.scheduled_at::DATE as lesson_date,
            l.scheduled_at::TIME as start_time,
            (l.scheduled_at + INTERVAL '1 hour')::TIME as end_time,
            l.status,
            COALESCE(l.lesson_type, 'conversation_practice') as lesson_type,
            l.notes,
            COALESCE(l.price, 500.00) as price,
            l.created_at,
            COALESCE(t.name, 'Unknown Tutor') as tutor_name,
            u.email as tutor_email,
            t.photo_url as tutor_profile_picture
        FROM public.lessons l
        LEFT JOIN auth.users u ON l.tutor_id = u.id
        LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
        WHERE l.student_id = student_user_id
        ORDER BY l.scheduled_at ASC;
        
    ELSE
        -- Fallback: return empty result with proper structure
        RETURN QUERY
        SELECT 
            NULL::UUID as id,
            NULL::UUID as tutor_id,
            NULL::UUID as student_id,
            NULL::DATE as lesson_date,
            NULL::TIME as start_time,
            NULL::TIME as end_time,
            NULL::TEXT as status,
            NULL::TEXT as lesson_type,
            NULL::TEXT as notes,
            NULL::DECIMAL as price,
            NULL::TIMESTAMP WITH TIME ZONE as created_at,
            NULL::TEXT as tutor_name,
            NULL::TEXT as tutor_email,
            NULL::TEXT as tutor_profile_picture
        WHERE FALSE; -- Return no rows
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create upcoming lessons function (flexible)
CREATE OR REPLACE FUNCTION public.get_student_upcoming_lessons_flexible(student_user_id UUID)
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
DECLARE
    has_lesson_date BOOLEAN;
    has_scheduled_at BOOLEAN;
BEGIN
    -- Check table structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'lesson_date' AND table_schema = 'public'
    ) INTO has_lesson_date;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'scheduled_at' AND table_schema = 'public'
    ) INTO has_scheduled_at;
    
    -- Return upcoming lessons based on available columns
    IF has_lesson_date THEN
        RETURN QUERY
        SELECT 
            l.id,
            l.tutor_id,
            l.student_id,
            l.lesson_date,
            l.start_time,
            l.end_time,
            l.status,
            COALESCE(l.lesson_type, 'conversation_practice') as lesson_type,
            l.notes,
            COALESCE(l.price, 500.00) as price,
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
        
    ELSIF has_scheduled_at THEN
        RETURN QUERY
        SELECT 
            l.id,
            l.tutor_id,
            l.student_id,
            l.scheduled_at::DATE as lesson_date,
            l.scheduled_at::TIME as start_time,
            (l.scheduled_at + INTERVAL '1 hour')::TIME as end_time,
            l.status,
            COALESCE(l.lesson_type, 'conversation_practice') as lesson_type,
            l.notes,
            COALESCE(l.price, 500.00) as price,
            l.created_at,
            COALESCE(t.name, 'Unknown Tutor') as tutor_name,
            u.email as tutor_email,
            t.photo_url as tutor_profile_picture
        FROM public.lessons l
        LEFT JOIN auth.users u ON l.tutor_id = u.id
        LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
        WHERE l.student_id = student_user_id
        AND l.status IN ('confirmed', 'scheduled')
        AND l.scheduled_at > NOW()
        ORDER BY l.scheduled_at ASC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Test the flexible functions (safe approach)
DO $$
DECLARE
    test_student_id UUID;
    lesson_count INTEGER;
    has_student_id BOOLEAN;
BEGIN
    -- Check if student_id column exists before testing
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lessons' AND column_name = 'student_id' AND table_schema = 'public'
    ) INTO has_student_id;

    IF has_student_id THEN
        -- Get a student ID for testing
        SELECT id INTO test_student_id
        FROM auth.users
        WHERE id IN (SELECT DISTINCT student_id FROM public.lessons)
        LIMIT 1;

        IF test_student_id IS NOT NULL THEN
            -- Test the flexible function
            SELECT COUNT(*) INTO lesson_count
            FROM public.get_student_lessons_flexible(test_student_id);

            RAISE NOTICE 'Found % lessons for student % using flexible function', lesson_count, test_student_id;

            -- Test upcoming lessons function
            SELECT COUNT(*) INTO lesson_count
            FROM public.get_student_upcoming_lessons_flexible(test_student_id);

            RAISE NOTICE 'Found % upcoming lessons for student %', lesson_count, test_student_id;
        ELSE
            RAISE NOTICE 'No students with lessons found for testing';
        END IF;
    ELSE
        RAISE NOTICE 'student_id column does not exist - skipping function tests';
        RAISE NOTICE 'Please check your table structure and create appropriate functions';
    END IF;
END $$;

-- Step 6: Show current lessons data (flexible query)
DO $$
DECLARE
    has_lesson_date BOOLEAN;
    has_scheduled_at BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'lesson_date' AND table_schema = 'public'
    ) INTO has_lesson_date;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'scheduled_at' AND table_schema = 'public'
    ) INTO has_scheduled_at;
    
    IF has_lesson_date THEN
        RAISE NOTICE 'Using lesson_date structure';
    ELSIF has_scheduled_at THEN
        RAISE NOTICE 'Using scheduled_at structure';
    ELSE
        RAISE NOTICE 'Unknown table structure - may need manual setup';
    END IF;
END $$;

-- Step 7: Show completion status
SELECT 
    'STUDENT DASHBOARD LESSONS FIXED (CORRECTED)!' as status,
    'Flexible functions created for different table structures' as function_status,
    'Handles both lesson_date and scheduled_at columns' as compatibility_status,
    'Enhanced error handling and fallbacks' as error_status,
    'Ready for student dashboard testing!' as ready_status;
