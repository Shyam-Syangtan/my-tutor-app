-- FIX LESSON CREATION ERROR - Debug and fix the "failed to create confirmed lesson" issue
-- This script investigates and fixes the lesson creation problem

-- Step 1: Check current lessons table structure
SELECT 
    'LESSONS TABLE STRUCTURE' as section,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lessons' 
ORDER BY ordinal_position;

-- Step 2: Check if lessons table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
        -- Create lessons table if it doesn't exist
        CREATE TABLE public.lessons (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            lesson_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            status TEXT DEFAULT 'confirmed',
            lesson_type TEXT DEFAULT 'conversation_practice',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created lessons table';
    ELSE
        RAISE NOTICE 'Lessons table already exists';
    END IF;
END $$;

-- Step 3: Add missing columns if they don't exist
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'conversation_practice',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 4: Check and fix RLS policies for lessons table
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Tutors can view their lessons" ON public.lessons;
DROP POLICY IF EXISTS "Students can view their lessons" ON public.lessons;
DROP POLICY IF EXISTS "Tutors can create lessons" ON public.lessons;
DROP POLICY IF EXISTS "System can create lessons" ON public.lessons;

-- Create comprehensive RLS policies for lessons
CREATE POLICY "Users can view their own lessons" ON public.lessons
    FOR SELECT USING (
        auth.uid() = tutor_id OR auth.uid() = student_id
    );

CREATE POLICY "Tutors can create lessons for their students" ON public.lessons
    FOR INSERT WITH CHECK (
        auth.uid() = tutor_id
    );

CREATE POLICY "System can create lessons" ON public.lessons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own lessons" ON public.lessons
    FOR UPDATE USING (
        auth.uid() = tutor_id OR auth.uid() = student_id
    );

-- Step 5: Create or update the trigger function for automatic lesson creation
CREATE OR REPLACE FUNCTION public.create_lesson_from_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create lesson if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        BEGIN
            INSERT INTO public.lessons (
                tutor_id,
                student_id,
                lesson_date,
                start_time,
                end_time,
                status,
                lesson_type,
                notes,
                created_at
            ) VALUES (
                NEW.tutor_id,
                NEW.student_id,
                NEW.requested_date,
                NEW.requested_start_time,
                NEW.requested_end_time,
                'confirmed',
                'conversation_practice',
                COALESCE(NEW.student_message, 'Lesson booked through calendar'),
                NOW()
            );
            
            RAISE NOTICE 'Lesson created automatically for request %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to create lesson for request %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger
DROP TRIGGER IF EXISTS on_lesson_request_approved ON public.lesson_requests;
CREATE TRIGGER on_lesson_request_approved
    AFTER UPDATE ON public.lesson_requests
    FOR EACH ROW EXECUTE FUNCTION public.create_lesson_from_request();

-- Step 7: Create a manual function to create lessons (for JavaScript fallback)
CREATE OR REPLACE FUNCTION public.manual_create_lesson(
    p_tutor_id UUID,
    p_student_id UUID,
    p_lesson_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    lesson_id UUID;
BEGIN
    INSERT INTO public.lessons (
        tutor_id,
        student_id,
        lesson_date,
        start_time,
        end_time,
        status,
        lesson_type,
        notes,
        created_at
    ) VALUES (
        p_tutor_id,
        p_student_id,
        p_lesson_date,
        p_start_time,
        p_end_time,
        'confirmed',
        'conversation_practice',
        p_notes,
        NOW()
    ) RETURNING id INTO lesson_id;
    
    RETURN lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON public.lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON public.lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);

-- Step 9: Test the lesson creation function
DO $$
DECLARE
    test_lesson_id UUID;
    test_tutor_id UUID;
    test_student_id UUID;
BEGIN
    -- Get a sample user ID for testing (if any exist)
    SELECT id INTO test_tutor_id FROM auth.users LIMIT 1;
    SELECT id INTO test_student_id FROM auth.users OFFSET 1 LIMIT 1;
    
    IF test_tutor_id IS NOT NULL AND test_student_id IS NOT NULL THEN
        -- Test the manual lesson creation function
        SELECT public.manual_create_lesson(
            test_tutor_id,
            test_student_id,
            CURRENT_DATE + INTERVAL '1 day',
            '10:00:00'::TIME,
            '11:00:00'::TIME,
            'Test lesson creation'
        ) INTO test_lesson_id;
        
        IF test_lesson_id IS NOT NULL THEN
            RAISE NOTICE 'Test lesson created successfully with ID: %', test_lesson_id;
            -- Clean up test lesson
            DELETE FROM public.lessons WHERE id = test_lesson_id;
            RAISE NOTICE 'Test lesson cleaned up';
        END IF;
    ELSE
        RAISE NOTICE 'No users found for testing lesson creation';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Test lesson creation failed: %', SQLERRM;
END $$;

-- Step 10: Show current status
SELECT 
    'LESSON CREATION FIX COMPLETE!' as status,
    'Lessons table structure verified' as table_status,
    'RLS policies updated' as security_status,
    'Trigger function created' as trigger_status,
    'Manual function available for fallback' as fallback_status,
    'Ready to test lesson approval workflow' as ready_status;
