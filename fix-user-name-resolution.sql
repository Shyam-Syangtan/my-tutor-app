-- FIX USER NAME RESOLUTION - Access Real Google Auth Data
-- This script creates enhanced functions to get actual user names from Google authentication

-- Step 1: Create enhanced function to get real user names from auth.users
CREATE OR REPLACE FUNCTION public.get_real_user_name(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_name TEXT;
    user_email TEXT;
    user_metadata JSONB;
BEGIN
    -- Try to get user data from auth.users table (contains Google auth data)
    SELECT 
        email,
        raw_user_meta_data
    INTO user_email, user_metadata
    FROM auth.users 
    WHERE id = user_uuid;
    
    -- Extract name from Google auth metadata
    IF user_metadata IS NOT NULL THEN
        -- Try full_name from Google auth
        user_name := user_metadata->>'full_name';
        
        -- If no full_name, try name field
        IF user_name IS NULL OR user_name = '' THEN
            user_name := user_metadata->>'name';
        END IF;
    END IF;
    
    -- If still no name, extract from email
    IF user_name IS NULL OR user_name = '' THEN
        IF user_email IS NOT NULL THEN
            user_name := split_part(user_email, '@', 1);
        END IF;
    END IF;
    
    -- Final fallback
    IF user_name IS NULL OR user_name = '' THEN
        user_name := 'User';
    END IF;
    
    RETURN user_name;
EXCEPTION
    WHEN OTHERS THEN
        -- If auth.users access fails, try fallback tables
        BEGIN
            -- Try students table
            SELECT COALESCE(name, email) INTO user_name
            FROM public.students
            WHERE user_id = user_uuid;
            
            IF user_name IS NOT NULL THEN
                RETURN user_name;
            END IF;
            
            -- Try users table
            SELECT COALESCE(full_name, email) INTO user_name
            FROM public.users
            WHERE id = user_uuid;
            
            IF user_name IS NOT NULL THEN
                RETURN user_name;
            END IF;
            
            -- Final fallback
            RETURN 'User';
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'User';
        END;
END;
$$;

-- Step 2: Update the safe_get_student_name function to use the new enhanced function
CREATE OR REPLACE FUNCTION public.safe_get_student_name(student_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.get_real_user_name(student_user_id);
END;
$$;

-- Step 3: Create similar function for tutors
CREATE OR REPLACE FUNCTION public.safe_get_tutor_name(tutor_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.get_real_user_name(tutor_user_id);
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_real_user_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_real_user_name(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.safe_get_student_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_get_student_name(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.safe_get_tutor_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_get_tutor_name(UUID) TO anon;

-- Step 5: Test the function with a real user ID
-- Replace this UUID with an actual user ID from your system
SELECT 
    'Testing enhanced user name resolution...' as status,
    public.get_real_user_name('2b68e00a-38c2-46c5-a4d2-11fdbe410087'::UUID) as test_result;

-- Step 6: Show sample of auth.users data to verify structure
SELECT 
    'Sample auth.users data:' as info,
    id,
    email,
    raw_user_meta_data->>'full_name' as google_full_name,
    raw_user_meta_data->>'name' as google_name,
    raw_user_meta_data
FROM auth.users 
LIMIT 3;

SELECT 'Enhanced user name resolution functions created successfully!' as final_result;
