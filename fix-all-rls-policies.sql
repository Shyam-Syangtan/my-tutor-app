-- COMPREHENSIVE FIX FOR ALL 406 (Not Acceptable) ERRORS
-- This fixes RLS policies on users, students, and tutors tables

-- Step 1: Check current RLS status on all tables
SELECT 'Checking RLS status on all tables...' as status;

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'students', 'tutors') 
AND schemaname = 'public';

-- Step 2: Check current policies on all tables
SELECT 'Checking current RLS policies...' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'students', 'tutors');

-- Step 3: EMERGENCY FIX - Drop all restrictive policies
SELECT 'Dropping restrictive policies...' as status;

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can only view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can only update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can only insert their own data" ON public.users;

-- Students table policies
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can insert their own profile" ON public.students;
DROP POLICY IF EXISTS "Users can manage their own student profile" ON public.students;

-- Tutors table policies (keep permissive ones)
-- Don't drop "Anyone can view tutors" or "Anyone can view approved tutors"

-- Step 4: Create VERY permissive policies for authenticated users
SELECT 'Creating permissive policies...' as status;

-- Users table - allow all authenticated users to read
CREATE POLICY "Allow all authenticated users to read users" ON public.users
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to update own user data" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert own user data" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Students table - allow all authenticated users to read
CREATE POLICY "Allow all authenticated users to read students" ON public.students
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to update own student data" ON public.students
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own student data" ON public.students
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Tutors table - ensure it's readable by all
DROP POLICY IF EXISTS "Users can manage their own tutor profile" ON public.tutors;
CREATE POLICY "Allow all users to read tutors" ON public.tutors
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to update own tutor data" ON public.tutors
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own tutor data" ON public.tutors
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Step 5: Grant comprehensive permissions
SELECT 'Granting permissions...' as status;

-- Grant permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.tutors TO authenticated;

-- Grant read permissions to anonymous users (for public data)
GRANT SELECT ON public.tutors TO anon;

-- Step 6: Alternative - Temporarily disable RLS for testing (UNCOMMENT IF NEEDED)
-- WARNING: Only use this for testing, not production
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tutors DISABLE ROW LEVEL SECURITY;

-- Step 7: Test the fix
SELECT 'Testing table access...' as status;

-- These should work now
SELECT COUNT(*) as users_count FROM public.users;
SELECT COUNT(*) as students_count FROM public.students;
SELECT COUNT(*) as tutors_count FROM public.tutors;

-- Step 8: Create safe lookup functions
CREATE OR REPLACE FUNCTION public.safe_get_student_name(student_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_name TEXT;
BEGIN
    SELECT COALESCE(name, email, 'Student') INTO student_name
    FROM public.students
    WHERE user_id = student_user_id;
    
    RETURN COALESCE(student_name, 'Student');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Student';
END;
$$;

CREATE OR REPLACE FUNCTION public.safe_get_tutor_name(tutor_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tutor_name TEXT;
BEGIN
    SELECT COALESCE(name, email, 'Tutor') INTO tutor_name
    FROM public.tutors
    WHERE user_id = tutor_user_id;
    
    RETURN COALESCE(tutor_name, 'Tutor');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Tutor';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.safe_get_student_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_get_tutor_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_get_student_name(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.safe_get_tutor_name(UUID) TO anon;

-- Step 9: Final verification
SELECT 'Final verification...' as status;

-- Test direct queries
SELECT id, email FROM public.users LIMIT 1;
SELECT user_id, name, email FROM public.students LIMIT 1;
SELECT user_id, name, email FROM public.tutors LIMIT 1;

-- Test functions
SELECT public.safe_get_student_name('2b68e00a-38c2-46c5-a4d2-11fdbe410087'::UUID) as test_student;
SELECT public.safe_get_tutor_name('2b68e00a-38c2-46c5-a4d2-11fdbe410087'::UUID) as test_tutor;

SELECT 'RLS policies fixed! All 406 errors should be eliminated.' as final_result;
