-- =====================================================
-- FIX TUTORS TABLE: Add missing columns for tutor applications
-- Run this script in Supabase SQL Editor to fix the tutors table
-- =====================================================

-- Add missing columns to tutors table if they don't exist
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS native_language TEXT,
ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS country_flag TEXT DEFAULT '🇮🇳',
ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS teaching_style TEXT,
ADD COLUMN IF NOT EXISTS resume TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT;

-- Ensure specialties column is TEXT type (not JSONB) to prevent malformed array literal errors
ALTER TABLE public.tutors
ALTER COLUMN specialties TYPE TEXT;

-- Update existing records to have default values for new columns
UPDATE public.tutors 
SET 
    is_professional = COALESCE(is_professional, false),
    native_language = COALESCE(native_language, language),
    languages_spoken = COALESCE(languages_spoken, jsonb_build_array(jsonb_build_object('language', language, 'proficiency', 'Native'))),
    tags = COALESCE(tags, '["Conversational", "Grammar"]'::jsonb),
    country_flag = COALESCE(country_flag, '🇮🇳'),
    total_students = COALESCE(total_students, 0),
    total_lessons = COALESCE(total_lessons, 0)
WHERE 
    is_professional IS NULL 
    OR native_language IS NULL 
    OR languages_spoken IS NULL 
    OR tags IS NULL 
    OR country_flag IS NULL 
    OR total_students IS NULL 
    OR total_lessons IS NULL;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_tutors_is_professional ON public.tutors(is_professional);
CREATE INDEX IF NOT EXISTS idx_tutors_native_language ON public.tutors(native_language);

-- Verify the table structure
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if is_professional column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tutors' 
        AND column_name = 'is_professional'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ is_professional column exists';
    ELSE
        RAISE NOTICE '❌ is_professional column missing';
    END IF;
    
    -- Check if native_language column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tutors' 
        AND column_name = 'native_language'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ native_language column exists';
    ELSE
        RAISE NOTICE '❌ native_language column missing';
    END IF;
    
    -- Check if languages_spoken column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tutors'
        AND column_name = 'languages_spoken'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE NOTICE '✅ languages_spoken column exists';
    ELSE
        RAISE NOTICE '❌ languages_spoken column missing';
    END IF;

    -- Check if specialties column is TEXT type
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tutors'
        AND column_name = 'specialties'
        AND data_type = 'text'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE NOTICE '✅ specialties column is TEXT type';
    ELSE
        RAISE NOTICE '❌ specialties column type issue';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ TUTORS TABLE FIX COMPLETED!';
    RAISE NOTICE 'Fixed the malformed array literal error by:';
    RAISE NOTICE '- Ensuring specialties column is TEXT type (not JSONB)';
    RAISE NOTICE '- Added all missing columns with proper defaults';
    RAISE NOTICE '- Updated existing records with sensible defaults';
    RAISE NOTICE '';
    RAISE NOTICE 'Added/Fixed columns:';
    RAISE NOTICE '- is_professional (BOOLEAN)';
    RAISE NOTICE '- native_language (TEXT)';
    RAISE NOTICE '- languages_spoken (JSONB)';
    RAISE NOTICE '- tags (JSONB)';
    RAISE NOTICE '- country_flag (TEXT)';
    RAISE NOTICE '- total_students (INTEGER)';
    RAISE NOTICE '- total_lessons (INTEGER)';
    RAISE NOTICE '- video_url (TEXT)';
    RAISE NOTICE '- about_me (TEXT)';
    RAISE NOTICE '- teaching_style (TEXT)';
    RAISE NOTICE '- resume (TEXT)';
    RAISE NOTICE '- experience (TEXT)';
    RAISE NOTICE '- specialties (TEXT) - Fixed type to prevent JSON errors';
    RAISE NOTICE '- availability (TEXT)';
    RAISE NOTICE '';
    RAISE NOTICE 'Tutor application form should now work without JSON errors!';
END $$;
