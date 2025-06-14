-- Complete Fix for Lesson Approval System
-- This script ensures that approved lesson requests create lessons that appear in student dashboards

-- Step 1: Ensure lessons table has proper structure
DO $$
BEGIN
    -- Check if lessons table exists and has required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public') THEN
        CREATE TABLE public.lessons (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            lesson_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
            lesson_type VARCHAR(50) DEFAULT 'conversation_practice',
            notes TEXT,
            price DECIMAL(10,2) DEFAULT 500.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'price' AND table_schema = 'public') THEN
        ALTER TABLE public.lessons ADD COLUMN price DECIMAL(10,2) DEFAULT 500.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'updated_at' AND table_schema = 'public') THEN
        ALTER TABLE public.lessons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 2: Create improved trigger function for automatic lesson creation
CREATE OR REPLACE FUNCTION public.create_lesson_from_request()
RETURNS TRIGGER AS $$
DECLARE
    lesson_exists BOOLEAN;
    lesson_id UUID;
BEGIN
    -- Only create lesson if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
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
                
                RAISE NOTICE 'Lesson created from approved request: % -> lesson: %', NEW.id, lesson_id;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to create lesson from request %: %', NEW.id, SQLERRM;
            END;
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

-- Step 4: Create manual lesson creation function for JavaScript fallback
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
    lesson_exists BOOLEAN;
BEGIN
    -- Check if lesson already exists
    SELECT EXISTS (
        SELECT 1 FROM public.lessons 
        WHERE tutor_id = p_tutor_id 
        AND student_id = p_student_id 
        AND lesson_date = p_lesson_date 
        AND start_time = p_start_time
    ) INTO lesson_exists;
    
    IF lesson_exists THEN
        -- Return the existing lesson ID
        SELECT id INTO lesson_id FROM public.lessons 
        WHERE tutor_id = p_tutor_id 
        AND student_id = p_student_id 
        AND lesson_date = p_lesson_date 
        AND start_time = p_start_time
        LIMIT 1;
        
        RETURN lesson_id;
    END IF;
    
    INSERT INTO public.lessons (
        tutor_id, student_id, lesson_date, start_time, end_time,
        status, lesson_type, notes, price, created_at, updated_at
    ) VALUES (
        p_tutor_id, p_student_id, p_lesson_date, p_start_time, p_end_time,
        'confirmed', 'conversation_practice',
        COALESCE(p_notes, 'Lesson booked through calendar'),
        500.00, NOW(), NOW()
    ) RETURNING id INTO lesson_id;
    
    RETURN lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create optimized student lessons function
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
        t.photo_url as tutor_profile_picture
    FROM public.lessons l
    LEFT JOIN auth.users u ON l.tutor_id = u.id
    LEFT JOIN public.tutors t ON l.tutor_id = t.user_id
    WHERE l.student_id = student_user_id
    ORDER BY l.lesson_date ASC, l.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Step 6: Create function to fix existing approved requests without lessons
CREATE OR REPLACE FUNCTION public.fix_missing_lessons()
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
                
                RETURN QUERY SELECT req.id, true, 'Lesson created successfully';
            EXCEPTION WHEN OTHERS THEN
                RETURN QUERY SELECT req.id, false, 'Failed to create lesson: ' || SQLERRM;
            END;
        ELSE
            RETURN QUERY SELECT req.id, false, 'Lesson already exists';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Enable RLS and create policies if needed
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Tutors can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can update their lessons" ON public.lessons;

-- Create RLS policies
CREATE POLICY "Students can view their own lessons" ON public.lessons
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view their own lessons" ON public.lessons
    FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Users can insert lessons" ON public.lessons
    FOR INSERT WITH CHECK (auth.uid() = tutor_id OR auth.uid() = student_id);

CREATE POLICY "Users can update their lessons" ON public.lessons
    FOR UPDATE USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.lessons TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_lessons_optimized(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_lessons(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manual_create_lesson(UUID, UUID, DATE, TIME, TIME, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fix_missing_lessons() TO anon, authenticated;

-- Step 9: Run the fix for existing approved requests
SELECT * FROM public.fix_missing_lessons();
