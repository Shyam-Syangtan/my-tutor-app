-- COMPLETE LESSON APPROVAL SYSTEM FIX
-- This script ensures the entire lesson approval workflow works correctly
-- Run this in Supabase SQL Editor

-- Step 1: Ensure lessons table exists with correct structure
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    lesson_type TEXT DEFAULT 'conversation_practice',
    notes TEXT,
    price DECIMAL(10,2) DEFAULT 500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, student_id, lesson_date, start_time)
);

-- Step 2: Create the trigger function with enhanced logging
CREATE OR REPLACE FUNCTION public.create_lesson_from_request()
RETURNS TRIGGER AS $$
DECLARE
    lesson_exists BOOLEAN;
    lesson_id UUID;
BEGIN
    -- Log trigger execution
    RAISE NOTICE 'Trigger fired: status changed from % to %', OLD.status, NEW.status;
    
    -- Only create lesson if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        RAISE NOTICE 'Creating lesson for approved request: %', NEW.id;
        
        -- Check if lesson already exists
        SELECT EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE tutor_id = NEW.tutor_id 
            AND student_id = NEW.student_id 
            AND lesson_date = NEW.requested_date 
            AND start_time = NEW.requested_start_time
        ) INTO lesson_exists;
        
        IF NOT lesson_exists THEN
            BEGIN
                INSERT INTO public.lessons (
                    tutor_id, student_id, lesson_date, start_time, end_time,
                    status, lesson_type, notes, price, created_at, updated_at
                ) VALUES (
                    NEW.tutor_id, NEW.student_id, NEW.requested_date,
                    NEW.requested_start_time, NEW.requested_end_time,
                    'confirmed', 'conversation_practice',
                    COALESCE(NEW.student_message, 'Lesson created from approved request'),
                    500.00, NOW(), NOW()
                ) RETURNING id INTO lesson_id;
                
                RAISE NOTICE 'SUCCESS: Lesson created with ID: % for request: %', lesson_id, NEW.id;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'FAILED: Could not create lesson for request %: %', NEW.id, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Lesson already exists for request: %', NEW.id;
        END IF;
    ELSE
        RAISE NOTICE 'No action needed - status is % (not approved)', NEW.status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop and recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_lesson_request_approved ON public.lesson_requests;
CREATE TRIGGER on_lesson_request_approved
    AFTER UPDATE ON public.lesson_requests
    FOR EACH ROW EXECUTE FUNCTION public.create_lesson_from_request();

-- Step 4: Create comprehensive student lesson loading function
CREATE OR REPLACE FUNCTION public.get_student_lessons_complete(student_user_id UUID)
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
        t.photo_url as tutor_profile_picture
    FROM public.lessons l
    LEFT JOIN auth.users u ON l.tutor_id = u.id
    LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
    WHERE l.student_id = student_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to fix any missing lessons from approved requests
CREATE OR REPLACE FUNCTION public.fix_all_missing_lessons()
RETURNS TABLE (
    request_id UUID,
    lesson_created BOOLEAN,
    message TEXT
) AS $$
DECLARE
    req RECORD;
    lesson_exists BOOLEAN;
    lesson_id UUID;
BEGIN
    FOR req IN 
        SELECT * FROM public.lesson_requests 
        WHERE status = 'approved'
        ORDER BY updated_at DESC
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE tutor_id = req.tutor_id 
            AND student_id = req.student_id 
            AND lesson_date = req.requested_date 
            AND start_time = req.requested_start_time
        ) INTO lesson_exists;
        
        IF NOT lesson_exists THEN
            BEGIN
                INSERT INTO public.lessons (
                    tutor_id, student_id, lesson_date, start_time, end_time,
                    status, lesson_type, notes, price, created_at, updated_at
                ) VALUES (
                    req.tutor_id, req.student_id, req.requested_date,
                    req.requested_start_time, req.requested_end_time,
                    'confirmed', 'conversation_practice',
                    COALESCE(req.student_message, 'Lesson created from approved request'),
                    500.00, NOW(), NOW()
                ) RETURNING id INTO lesson_id;
                
                RETURN QUERY SELECT req.id, true, 'Lesson created with ID: ' || lesson_id::text;
            EXCEPTION WHEN OTHERS THEN
                RETURN QUERY SELECT req.id, false, 'Failed to create lesson: ' || SQLERRM;
            END;
        ELSE
            RETURN QUERY SELECT req.id, false, 'Lesson already exists';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Set up proper RLS policies
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Tutors can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can update their lessons" ON public.lessons;

-- Create comprehensive RLS policies
CREATE POLICY "Students can view their own lessons" ON public.lessons
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view their own lessons" ON public.lessons
    FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "System can insert lessons" ON public.lessons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their lessons" ON public.lessons
    FOR UPDATE USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- Step 7: Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.lessons TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_lessons_complete(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_lesson_from_request() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fix_all_missing_lessons() TO anon, authenticated;

-- Step 8: Run the fix for any existing approved requests
SELECT 'Fixing existing approved requests...' as status;
SELECT * FROM public.fix_all_missing_lessons();

-- Step 9: Test the trigger with a sample update (if there are approved requests)
DO $$
DECLARE
    test_request_id UUID;
BEGIN
    -- Find an approved request to test trigger
    SELECT id INTO test_request_id 
    FROM public.lesson_requests 
    WHERE status = 'approved' 
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        -- Update the request to trigger the function
        UPDATE public.lesson_requests 
        SET updated_at = NOW()
        WHERE id = test_request_id;
        
        RAISE NOTICE 'Trigger test completed for request: %', test_request_id;
    ELSE
        RAISE NOTICE 'No approved requests found for trigger testing';
    END IF;
END $$;

-- Step 10: Show final status
SELECT 
    'lesson_requests' as table_name,
    status,
    COUNT(*) as count
FROM public.lesson_requests 
GROUP BY status
UNION ALL
SELECT 
    'lessons' as table_name,
    status,
    COUNT(*) as count
FROM public.lessons 
GROUP BY status
ORDER BY table_name, status;
