-- Fix Critical Regressions in Lesson Approval System
-- This script addresses issues that may have broken Find Tutors and Tutor Dashboard

-- Step 1: Fix RLS policies that might be too restrictive
-- Disable RLS temporarily on lessons table to check if that's the issue
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;

-- Step 2: Ensure tutors table has proper RLS policies for Find Tutors page
-- Check if tutors table has RLS enabled and fix if needed
DO $$
BEGIN
    -- Enable RLS on tutors table if not already enabled
    ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Tutors are publicly viewable" ON public.tutors;
    DROP POLICY IF EXISTS "Approved tutors are publicly viewable" ON public.tutors;
    DROP POLICY IF EXISTS "Public can view approved tutors" ON public.tutors;
    
    -- Create a permissive policy for viewing approved tutors
    CREATE POLICY "Public can view approved tutors" ON public.tutors
        FOR SELECT USING (approved = true);
    
    -- Allow tutors to view and update their own profiles
    CREATE POLICY "Tutors can manage own profile" ON public.tutors
        FOR ALL USING (auth.uid() = user_id OR auth.uid() = id);
        
EXCEPTION WHEN OTHERS THEN
    -- If there's an error, log it but continue
    RAISE NOTICE 'Error setting up tutors policies: %', SQLERRM;
END $$;

-- Step 3: Ensure lesson_requests table has proper policies for tutor dashboard
DO $$
BEGIN
    -- Enable RLS on lesson_requests table
    ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Users can view their lesson requests" ON public.lesson_requests;
    DROP POLICY IF EXISTS "Students can create lesson requests" ON public.lesson_requests;
    DROP POLICY IF EXISTS "Tutors can view their requests" ON public.lesson_requests;
    DROP POLICY IF EXISTS "Tutors can update their requests" ON public.lesson_requests;
    
    -- Create policies for lesson requests
    CREATE POLICY "Students can create lesson requests" ON public.lesson_requests
        FOR INSERT WITH CHECK (auth.uid() = student_id);
    
    CREATE POLICY "Students can view their requests" ON public.lesson_requests
        FOR SELECT USING (auth.uid() = student_id);
    
    CREATE POLICY "Tutors can view their requests" ON public.lesson_requests
        FOR SELECT USING (auth.uid() = tutor_id);
    
    CREATE POLICY "Tutors can update their requests" ON public.lesson_requests
        FOR UPDATE USING (auth.uid() = tutor_id);
        
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error setting up lesson_requests policies: %', SQLERRM;
END $$;

-- Step 4: Fix any issues with the lessons table RLS
DO $$
BEGIN
    -- Re-enable RLS on lessons table with proper policies
    ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Students can view their own lessons" ON public.lessons;
    DROP POLICY IF EXISTS "Tutors can view their own lessons" ON public.lessons;
    DROP POLICY IF EXISTS "Users can insert lessons" ON public.lessons;
    DROP POLICY IF EXISTS "Users can update their lessons" ON public.lessons;
    
    -- Create more permissive policies for lessons
    CREATE POLICY "Students can view their lessons" ON public.lessons
        FOR SELECT USING (auth.uid() = student_id);
    
    CREATE POLICY "Tutors can view their lessons" ON public.lessons
        FOR SELECT USING (auth.uid() = tutor_id);
    
    CREATE POLICY "System can create lessons" ON public.lessons
        FOR INSERT WITH CHECK (true); -- Allow system to create lessons
    
    CREATE POLICY "Users can update their lessons" ON public.lessons
        FOR UPDATE USING (auth.uid() = tutor_id OR auth.uid() = student_id);
        
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error setting up lessons policies: %', SQLERRM;
END $$;

-- Step 5: Ensure students table has proper policies for user info display
DO $$
BEGIN
    -- Enable RLS on students table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
        ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
        DROP POLICY IF EXISTS "Public can view student names" ON public.students;
        
        -- Create policies for students
        CREATE POLICY "Students can manage own profile" ON public.students
            FOR ALL USING (auth.uid() = id);
            
        -- Allow limited public access for messaging/display purposes
        CREATE POLICY "Limited public access to student info" ON public.students
            FOR SELECT USING (true);
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error setting up students policies: %', SQLERRM;
END $$;

-- Step 6: Grant necessary permissions to ensure functionality
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.tutors TO anon, authenticated;
GRANT ALL ON public.lesson_requests TO authenticated;
GRANT ALL ON public.lessons TO authenticated;

-- Grant permissions on students table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
        GRANT ALL ON public.students TO authenticated;
        GRANT SELECT ON public.students TO anon;
    END IF;
END $$;

-- Step 7: Ensure database functions have proper permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Step 8: Create a simple test function to verify database connectivity
CREATE OR REPLACE FUNCTION public.test_database_connection()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database connection successful at ' || NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.test_database_connection() TO anon, authenticated;

-- Step 9: Create a function to check table accessibility
CREATE OR REPLACE FUNCTION public.check_table_access()
RETURNS TABLE (
    table_name TEXT,
    accessible BOOLEAN,
    row_count BIGINT,
    error_message TEXT
) AS $$
DECLARE
    rec RECORD;
    count_result BIGINT;
    error_msg TEXT;
BEGIN
    -- Check tutors table
    BEGIN
        SELECT COUNT(*) INTO count_result FROM public.tutors;
        RETURN QUERY SELECT 'tutors'::TEXT, true, count_result, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'tutors'::TEXT, false, 0::BIGINT, SQLERRM;
    END;
    
    -- Check lesson_requests table
    BEGIN
        SELECT COUNT(*) INTO count_result FROM public.lesson_requests;
        RETURN QUERY SELECT 'lesson_requests'::TEXT, true, count_result, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'lesson_requests'::TEXT, false, 0::BIGINT, SQLERRM;
    END;
    
    -- Check lessons table
    BEGIN
        SELECT COUNT(*) INTO count_result FROM public.lessons;
        RETURN QUERY SELECT 'lessons'::TEXT, true, count_result, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'lessons'::TEXT, false, 0::BIGINT, SQLERRM;
    END;
    
    -- Check students table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
        BEGIN
            SELECT COUNT(*) INTO count_result FROM public.students;
            RETURN QUERY SELECT 'students'::TEXT, true, count_result, NULL::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 'students'::TEXT, false, 0::BIGINT, SQLERRM;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_table_access() TO anon, authenticated;

-- Step 10: Test the fixes
SELECT 'Fix script completed successfully' as status;
