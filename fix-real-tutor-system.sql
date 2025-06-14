-- FIX REAL TUTOR SYSTEM - Remove sample data and restore proper tutor application workflow
-- This script removes sample data and ensures only real approved tutor applications are shown

-- Step 1: Remove all sample/dummy tutor data
DELETE FROM public.tutors WHERE email LIKE '%@tutorapp.com' OR email LIKE '%@example.com';
DELETE FROM public.reviews WHERE tutor_id NOT IN (SELECT id FROM public.tutors);
DELETE FROM public.tutor_availability WHERE tutor_id NOT IN (SELECT user_id FROM public.tutors WHERE user_id IS NOT NULL);

-- Step 2: Ensure tutors table has the correct structure for real applications
-- Add missing columns that the become-tutor application form expects
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS tutor_type TEXT DEFAULT 'community',
ADD COLUMN IF NOT EXISTS native_language TEXT,
ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS country_flag TEXT,
ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS languages_taught TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Make user_id NOT NULL again (it should be required for real applications)
-- First, remove any tutors without user_id
DELETE FROM public.tutors WHERE user_id IS NULL;
-- Then make it required
ALTER TABLE public.tutors ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Set up proper RLS policies for the real tutor application system
DROP POLICY IF EXISTS "Anyone can view tutors" ON public.tutors;
DROP POLICY IF EXISTS "Anyone can view approved tutors" ON public.tutors;
DROP POLICY IF EXISTS "Users can manage their own tutor profile" ON public.tutors;
DROP POLICY IF EXISTS "Users can create own tutor profile" ON public.tutors;
DROP POLICY IF EXISTS "Users can view own tutor profile" ON public.tutors;
DROP POLICY IF EXISTS "Users can update own pending tutor profile" ON public.tutors;

-- Create proper policies for real tutor application workflow
CREATE POLICY "Anyone can view approved tutors" ON public.tutors
    FOR SELECT USING (approved = true);

CREATE POLICY "Users can create own tutor profile" ON public.tutors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tutor profile" ON public.tutors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending tutor profile" ON public.tutors
    FOR UPDATE USING (auth.uid() = user_id AND approved = false);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_approved ON public.tutors(approved);
CREATE INDEX IF NOT EXISTS idx_tutors_approved_created ON public.tutors(approved, created_at);

-- Step 6: Create a view for approved tutors (for better performance)
CREATE OR REPLACE VIEW approved_tutors AS
SELECT * FROM public.tutors WHERE approved = true;

-- Step 7: Create function to check if user is approved tutor
CREATE OR REPLACE FUNCTION is_approved_tutor(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tutors
        WHERE user_id = user_uuid AND approved = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to get tutor application status
CREATE OR REPLACE FUNCTION get_tutor_application_status(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    tutor_record RECORD;
BEGIN
    SELECT approved INTO tutor_record
    FROM public.tutors
    WHERE user_id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN 'none'; -- No application submitted
    ELSIF tutor_record.approved = true THEN
        RETURN 'approved'; -- Application approved
    ELSE
        RETURN 'pending'; -- Application pending review
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tutors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tutors_updated_at_trigger ON public.tutors;
CREATE TRIGGER update_tutors_updated_at_trigger
    BEFORE UPDATE ON public.tutors
    FOR EACH ROW
    EXECUTE FUNCTION update_tutors_updated_at();

-- Step 10: Show current status of real tutor applications
SELECT 
    'REAL TUTOR SYSTEM RESTORED!' as status,
    'Sample data removed' as cleanup_status,
    'Total applications: ' || (SELECT COUNT(*) FROM public.tutors) as total_applications,
    'Pending applications: ' || (SELECT COUNT(*) FROM public.tutors WHERE approved = false) as pending_applications,
    'Approved tutors: ' || (SELECT COUNT(*) FROM public.tutors WHERE approved = true) as approved_tutors,
    'Ready for real tutor workflow!' as system_status;
