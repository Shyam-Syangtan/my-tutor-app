-- FIX STUDENT DASHBOARD FINAL - Based on actual table structure
-- This creates the proper lesson workflow and student dashboard functions

-- Step 1: Check lessons table structure first
SELECT 
    'LESSONS TABLE COLUMNS' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Show current lessons data
SELECT 
    'CURRENT LESSONS COUNT' as info,
    COUNT(*) as total_lessons,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_lessons
FROM public.lessons;

-- Step 3: Create function to get student lessons (works with any structure)
CREATE OR REPLACE FUNCTION public.get_student_lessons_final(student_user_id UUID)
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
    lessons_has_lesson_date BOOLEAN;
    lessons_has_scheduled_at BOOLEAN;
    lessons_has_student_id BOOLEAN;
BEGIN
    -- Check what columns exist in lessons table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'lesson_date' AND table_schema = 'public'
    ) INTO lessons_has_lesson_date;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'scheduled_at' AND table_schema = 'public'
    ) INTO lessons_has_scheduled_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'student_id' AND table_schema = 'public'
    ) INTO lessons_has_student_id;
    
    -- If lessons table has proper structure, use it
    IF lessons_has_student_id AND lessons_has_lesson_date THEN
        RETURN QUERY
        SELECT 
            l.id,
            l.tutor_id,
            l.student_id,
            l.lesson_date,
            l.start_time,
            l.end_time,
            COALESCE(l.status, 'confirmed') as status,
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
        
    -- If lessons table uses scheduled_at
    ELSIF lessons_has_student_id AND lessons_has_scheduled_at THEN
        RETURN QUERY
        SELECT 
            l.id,
            l.tutor_id,
            l.student_id,
            l.scheduled_at::DATE as lesson_date,
            l.scheduled_at::TIME as start_time,
            (l.scheduled_at + INTERVAL '1 hour')::TIME as end_time,
            COALESCE(l.status, 'confirmed') as status,
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
        
    -- Fallback: Use lesson_requests for approved lessons if lessons table is empty/wrong
    ELSE
        RETURN QUERY
        SELECT 
            lr.id,
            lr.tutor_id,
            lr.student_id,
            lr.requested_date as lesson_date,
            lr.requested_start_time as start_time,
            lr.requested_end_time as end_time,
            lr.status,
            'conversation_practice' as lesson_type,
            lr.student_message as notes,
            500.00 as price,
            lr.created_at,
            COALESCE(t.name, 'Unknown Tutor') as tutor_name,
            u.email as tutor_email,
            t.photo_url as tutor_profile_picture
        FROM public.lesson_requests lr
        LEFT JOIN auth.users u ON lr.tutor_id = u.id
        LEFT JOIN public.tutors t ON lr.tutor_id = t.user_id
        WHERE lr.student_id = student_user_id
        AND lr.status = 'approved'
        ORDER BY lr.requested_date ASC, lr.requested_start_time ASC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create upcoming lessons function
CREATE OR REPLACE FUNCTION public.get_student_upcoming_lessons_final(student_user_id UUID)
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
    SELECT * FROM public.get_student_lessons_final(student_user_id)
    WHERE lesson_date >= CURRENT_DATE
    AND status IN ('confirmed', 'approved')
    ORDER BY lesson_date ASC, start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to create lessons from approved requests
CREATE OR REPLACE FUNCTION public.create_lesson_from_request()
RETURNS TRIGGER AS $$
BEGIN
    -- When a lesson request is approved, create a lesson
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Check if lessons table has proper structure
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lessons' AND column_name = 'student_id' AND table_schema = 'public'
        ) THEN
            -- Insert into lessons table
            INSERT INTO public.lessons (
                tutor_id,
                student_id,
                lesson_date,
                start_time,
                end_time,
                status,
                lesson_type,
                notes,
                price
            ) VALUES (
                NEW.tutor_id,
                NEW.student_id,
                NEW.requested_date,
                NEW.requested_start_time,
                NEW.requested_end_time,
                'confirmed',
                'conversation_practice',
                NEW.student_message,
                500.00
            );
            
            RAISE NOTICE 'Lesson created from approved request: %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_lesson_request_approved ON public.lesson_requests;
CREATE TRIGGER on_lesson_request_approved
    AFTER UPDATE ON public.lesson_requests
    FOR EACH ROW EXECUTE FUNCTION public.create_lesson_from_request();

-- Step 6: Test the functions
DO $$
DECLARE
    test_student_id UUID;
    lesson_count INTEGER;
BEGIN
    -- Get a student ID for testing
    SELECT DISTINCT student_id INTO test_student_id 
    FROM public.lesson_requests 
    LIMIT 1;
    
    IF test_student_id IS NOT NULL THEN
        -- Test the function
        SELECT COUNT(*) INTO lesson_count
        FROM public.get_student_lessons_final(test_student_id);
        
        RAISE NOTICE 'Found % lessons for student % using final function', lesson_count, test_student_id;
    ELSE
        RAISE NOTICE 'No students found for testing';
    END IF;
END $$;

-- Step 7: Show completion
SELECT 
    'STUDENT DASHBOARD FIXED!' as status,
    'Functions created that work with your table structure' as function_status,
    'Trigger created to make lessons from approved requests' as trigger_status,
    'Ready for testing!' as ready_status;
