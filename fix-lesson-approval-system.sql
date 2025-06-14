-- FIX LESSON APPROVAL SYSTEM - Complete Database Setup
-- This script ensures the lesson approval workflow works correctly

-- Step 1: Verify and fix lessons table structure
DO $$
BEGIN
    -- Ensure lessons table has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_date') THEN
        ALTER TABLE lessons ADD COLUMN lesson_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'start_time') THEN
        ALTER TABLE lessons ADD COLUMN start_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'end_time') THEN
        ALTER TABLE lessons ADD COLUMN end_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_type') THEN
        ALTER TABLE lessons ADD COLUMN lesson_type TEXT DEFAULT 'conversation_practice';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'price') THEN
        ALTER TABLE lessons ADD COLUMN price DECIMAL(10,2) DEFAULT 500.00;
    END IF;

    -- Update status column constraint
    ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
    ALTER TABLE lessons ADD CONSTRAINT lessons_status_check 
        CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));
END $$;

-- Step 2: Create/Update the lesson creation trigger function
CREATE OR REPLACE FUNCTION public.create_lesson_from_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create lesson if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Check if lesson already exists to avoid duplicates
        IF NOT EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE tutor_id = NEW.tutor_id 
            AND student_id = NEW.student_id 
            AND lesson_date = NEW.requested_date 
            AND start_time = NEW.requested_start_time
        ) THEN
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
                COALESCE(NEW.student_message, 'Lesson booked through calendar'),
                500.00
            );
            
            RAISE NOTICE 'Lesson created from approved request: % for student: %', NEW.id, NEW.student_id;
        ELSE
            RAISE NOTICE 'Lesson already exists for request: %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create/Update the trigger
DROP TRIGGER IF EXISTS on_lesson_request_approved ON public.lesson_requests;
CREATE TRIGGER on_lesson_request_approved
    AFTER UPDATE ON public.lesson_requests
    FOR EACH ROW EXECUTE FUNCTION public.create_lesson_from_request();

-- Step 4: Create optimized student lessons function
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
        COALESCE(l.status, 'confirmed') as status,
        COALESCE(l.lesson_type, 'conversation_practice') as lesson_type,
        l.notes,
        COALESCE(l.price, 500.00) as price,
        l.created_at,
        COALESCE(t.name, u.email, 'Unknown Tutor') as tutor_name,
        u.email as tutor_email,
        COALESCE(t.photo_url, t.profile_picture) as tutor_profile_picture
    FROM public.lessons l
    LEFT JOIN auth.users u ON l.tutor_id = u.id
    LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
    WHERE l.student_id = student_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create upcoming lessons function
CREATE OR REPLACE FUNCTION public.get_student_upcoming_lessons_optimized(student_user_id UUID)
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
    SELECT * FROM public.get_student_lessons_optimized(student_user_id)
    WHERE lesson_date >= CURRENT_DATE
    AND status IN ('confirmed', 'scheduled')
    ORDER BY lesson_date ASC, start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Ensure RLS policies allow proper access
DO $$
BEGIN
    -- Students can view their own lessons
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Students can view own lessons') THEN
        CREATE POLICY "Students can view own lessons" ON lessons
            FOR SELECT USING (auth.uid() = student_id);
    END IF;

    -- Tutors can view their lessons
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Tutors can view their lessons') THEN
        CREATE POLICY "Tutors can view their lessons" ON lessons
            FOR SELECT USING (auth.uid() = tutor_id);
    END IF;

    -- Allow lesson creation from triggers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Allow lesson creation from triggers') THEN
        CREATE POLICY "Allow lesson creation from triggers" ON lessons
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Step 7: Create a function to manually create missing lessons from approved requests
CREATE OR REPLACE FUNCTION public.create_missing_lessons()
RETURNS TABLE (
    request_id UUID,
    lesson_created BOOLEAN,
    message TEXT
) AS $$
DECLARE
    req RECORD;
    lesson_exists BOOLEAN;
BEGIN
    FOR req IN 
        SELECT * FROM public.lesson_requests 
        WHERE status = 'approved'
        ORDER BY updated_at DESC
    LOOP
        -- Check if lesson already exists
        SELECT EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE tutor_id = req.tutor_id 
            AND student_id = req.student_id 
            AND lesson_date = req.requested_date 
            AND start_time = req.requested_start_time
        ) INTO lesson_exists;
        
        IF NOT lesson_exists THEN
            -- Create the missing lesson
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
                req.tutor_id,
                req.student_id,
                req.requested_date,
                req.requested_start_time,
                req.requested_end_time,
                'confirmed',
                'conversation_practice',
                COALESCE(req.student_message, 'Lesson created from approved request'),
                500.00
            );
            
            RETURN QUERY SELECT req.id, true, 'Lesson created successfully';
        ELSE
            RETURN QUERY SELECT req.id, false, 'Lesson already exists';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Run the missing lessons creation
SELECT 'CREATING MISSING LESSONS FROM APPROVED REQUESTS' as status;
SELECT * FROM public.create_missing_lessons();

-- Step 9: Show final status
SELECT 
    'LESSON APPROVAL SYSTEM FIXED!' as status,
    'Database structure updated' as structure_status,
    'Trigger function created/updated' as trigger_status,
    'Student lesson functions optimized' as function_status,
    'RLS policies ensured' as security_status,
    'Missing lessons created' as data_status,
    'Ready for testing!' as ready_status;
