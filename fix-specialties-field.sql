-- FIX SPECIALTIES FIELD - Handle array data properly
-- This script fixes the specialties field to accept array data

-- Step 1: Check current data type of specialties column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tutors' AND column_name = 'specialties';

-- Step 2: If specialties is TEXT, convert it to TEXT[] (array)
-- First, let's see what type it currently is and fix if needed
DO $$
BEGIN
    -- Check if specialties column exists and its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' 
        AND column_name = 'specialties' 
        AND data_type = 'text'
    ) THEN
        -- Convert existing text data to array format
        UPDATE public.tutors 
        SET specialties = CASE 
            WHEN specialties IS NULL OR specialties = '' THEN NULL
            ELSE string_to_array(specialties, ',')
        END
        WHERE specialties IS NOT NULL;
        
        -- Change column type to text array
        ALTER TABLE public.tutors 
        ALTER COLUMN specialties TYPE TEXT[] 
        USING CASE 
            WHEN specialties IS NULL OR specialties = '' THEN NULL
            ELSE string_to_array(specialties, ',')
        END;
        
        RAISE NOTICE 'Converted specialties column from TEXT to TEXT[]';
    ELSE
        RAISE NOTICE 'Specialties column is already correct type or does not exist';
    END IF;
END $$;

-- Step 3: Ensure languages column is also an array if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' 
        AND column_name = 'languages' 
        AND data_type = 'text'
    ) THEN
        -- Convert existing text data to array format
        UPDATE public.tutors 
        SET languages = CASE 
            WHEN languages IS NULL OR languages = '' THEN NULL
            ELSE string_to_array(languages, ',')
        END
        WHERE languages IS NOT NULL;
        
        -- Change column type to text array
        ALTER TABLE public.tutors 
        ALTER COLUMN languages TYPE TEXT[] 
        USING CASE 
            WHEN languages IS NULL OR languages = '' THEN NULL
            ELSE string_to_array(languages, ',')
        END;
        
        RAISE NOTICE 'Converted languages column from TEXT to TEXT[]';
    ELSE
        RAISE NOTICE 'Languages column is already correct type or does not exist';
    END IF;
END $$;

-- Step 4: Add the columns if they don't exist with correct types
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Step 5: Create a function to safely insert tutor data
CREATE OR REPLACE FUNCTION safe_insert_tutor(
    p_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_bio TEXT,
    p_language TEXT,
    p_languages TEXT[],
    p_experience TEXT,
    p_rate INTEGER,
    p_video_url TEXT,
    p_specialties TEXT[],
    p_availability TEXT
)
RETURNS UUID AS $$
DECLARE
    new_tutor_id UUID;
BEGIN
    INSERT INTO public.tutors (
        user_id, email, name, bio, language, languages, experience, 
        rate, video_url, specialties, availability, approved, rating, created_at
    ) VALUES (
        p_user_id, p_email, p_name, p_bio, p_language, p_languages, p_experience,
        p_rate, p_video_url, p_specialties, p_availability, false, 0, NOW()
    ) RETURNING id INTO new_tutor_id;
    
    RETURN new_tutor_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Show current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tutors' 
AND column_name IN ('specialties', 'languages', 'language')
ORDER BY column_name;

-- Success message
SELECT 'SPECIALTIES FIELD FIXED!' as status,
       'Arrays now supported for specialties and languages' as fix_applied,
       'Form submission should work without malformed array errors' as result;
