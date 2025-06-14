-- Fix Users Table RLS Policies for User Name Resolution
-- This fixes the 406 (Not Acceptable) errors when querying users table

-- Step 1: Check current RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Step 2: Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can only update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can only insert their own data" ON public.users;

-- Step 3: Create permissive policies for authenticated users
-- Allow authenticated users to read basic user info (needed for name resolution)
CREATE POLICY "Authenticated users can read basic user info" ON public.users
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;

-- Step 6: Test the fix
SELECT 'Testing users table access...' as status;

-- This should work now for authenticated users
SELECT id, email, role FROM public.users LIMIT 3;

SELECT 'Users table RLS policies fixed successfully!' as result;

-- Step 7: Alternative approach - Create a function for safe user lookup
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    display_name TEXT;
BEGIN
    -- Try to get email from users table
    SELECT email INTO display_name
    FROM public.users
    WHERE id = user_uuid;
    
    -- Extract username from email
    IF display_name IS NOT NULL THEN
        display_name := SPLIT_PART(display_name, '@', 1);
    ELSE
        display_name := 'User';
    END IF;
    
    RETURN display_name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO authenticated;

-- Test the function
SELECT 'Testing get_user_display_name function...' as status;
SELECT public.get_user_display_name('00000000-0000-0000-0000-000000000000'::UUID) as test_result;

SELECT 'RLS fix completed! Users table should now be accessible.' as final_result;
