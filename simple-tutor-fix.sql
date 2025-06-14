-- SIMPLE TUTOR FIX - Just get tutors working without foreign key issues
-- This is the minimal fix to get the Find Tutors page working

-- Step 1: Add missing columns to tutors table
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[{"language": "English", "proficiency": "Native"}]',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["Conversational", "Grammar"]',
ADD COLUMN IF NOT EXISTS country_flag TEXT DEFAULT '🇺🇸',
ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 25;

-- Step 2: Update any existing tutors
UPDATE public.tutors SET 
    approved = true,
    native_language = COALESCE(native_language, 'English'),
    language = COALESCE(language, 'English'),
    languages_spoken = COALESCE(languages_spoken, '[{"language": "English", "proficiency": "Native"}]'::jsonb),
    tags = COALESCE(tags, '["Conversational", "Grammar"]'::jsonb),
    country_flag = COALESCE(country_flag, '🇺🇸'),
    total_students = COALESCE(total_students, 25)
WHERE approved IS NULL;

-- Step 3: Remove foreign key constraint temporarily to allow data insertion
ALTER TABLE public.tutors ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Clear any existing sample data
DELETE FROM public.tutors WHERE email LIKE '%@tutorapp.com' OR email LIKE '%@example.com';

-- Step 5: Insert sample tutors (minimal data, no foreign keys)
INSERT INTO public.tutors (
    name, email, bio, rate, rating, total_reviews, photo_url, 
    approved, native_language, language, languages_spoken, tags, country_flag, total_students
) VALUES 
('Maria Rodriguez', 'maria@tutorapp.com', 'Native Spanish speaker with 8 years of experience.', 450.00, 4.9, 127, 'https://ui-avatars.com/api/?name=Maria+Rodriguez&background=e11d48&color=fff&size=150', true, 'Spanish', 'Spanish', '[{"language": "Spanish", "proficiency": "Native"}]', '["Conversational", "Business Spanish"]', '🇪🇸', 89),
('John Smith', 'john@tutorapp.com', 'Certified English teacher with TEFL certification.', 380.00, 4.7, 93, 'https://ui-avatars.com/api/?name=John+Smith&background=2563eb&color=fff&size=150', true, 'English', 'English', '[{"language": "English", "proficiency": "Native"}]', '["Academic English", "IELTS Prep"]', '🇺🇸', 67),
('Sophie Dubois', 'sophie@tutorapp.com', 'Native French speaker from Paris.', 420.00, 4.8, 156, 'https://ui-avatars.com/api/?name=Sophie+Dubois&background=7c3aed&color=fff&size=150', true, 'French', 'French', '[{"language": "French", "proficiency": "Native"}]', '["Conversational", "French Culture"]', '🇫🇷', 112),
('Hans Mueller', 'hans@tutorapp.com', 'German language enthusiast with passion for teaching.', 350.00, 4.6, 74, 'https://ui-avatars.com/api/?name=Hans+Mueller&background=059669&color=fff&size=150', true, 'German', 'German', '[{"language": "German", "proficiency": "Native"}]', '["Grammar", "Conversational"]', '🇩🇪', 45),
('Yuki Tanaka', 'yuki@tutorapp.com', 'Certified Japanese teacher for all levels.', 480.00, 4.9, 203, 'https://ui-avatars.com/api/?name=Yuki+Tanaka&background=dc2626&color=fff&size=150', true, 'Japanese', 'Japanese', '[{"language": "Japanese", "proficiency": "Native"}]', '["Hiragana/Katakana", "Business Japanese"]', '🇯🇵', 134),
('Isabella Costa', 'isabella@tutorapp.com', 'Brazilian Portuguese teacher.', 320.00, 4.5, 58, 'https://ui-avatars.com/api/?name=Isabella+Costa&background=ea580c&color=fff&size=150', true, 'Portuguese', 'Portuguese', '[{"language": "Portuguese", "proficiency": "Native"}]', '["Conversational", "Brazilian Culture"]', '🇧🇷', 38),
('Ahmed Hassan', 'ahmed@tutorapp.com', 'Native Arabic speaker, MSA and Egyptian dialect.', 520.00, 4.8, 145, 'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=1d4ed8&color=fff&size=150', true, 'Arabic', 'Arabic', '[{"language": "Arabic", "proficiency": "Native"}]', '["Modern Standard Arabic", "Egyptian Dialect"]', '🇪🇬', 97),
('Li Wei', 'li@tutorapp.com', 'Mandarin Chinese teacher with HSK certification.', 460.00, 4.7, 118, 'https://ui-avatars.com/api/?name=Li+Wei&background=be185d&color=fff&size=150', true, 'Chinese', 'Chinese', '[{"language": "Chinese", "proficiency": "Native"}]', '["HSK Preparation", "Pronunciation"]', '🇨🇳', 76);

-- Step 6: Fix RLS policy to allow viewing approved tutors
DROP POLICY IF EXISTS "Anyone can view tutors" ON public.tutors;
DROP POLICY IF EXISTS "Anyone can view approved tutors" ON public.tutors;
CREATE POLICY "Anyone can view approved tutors" ON public.tutors
    FOR SELECT USING (approved = true);

-- Step 7: Add basic indexes
CREATE INDEX IF NOT EXISTS idx_tutors_approved ON public.tutors(approved);
CREATE INDEX IF NOT EXISTS idx_tutors_language ON public.tutors(language);

-- Success message
SELECT 'SIMPLE TUTOR FIX COMPLETED!' as status,
       'Tutors added: ' || (SELECT COUNT(*) FROM public.tutors WHERE approved = true) as approved_tutors,
       'Ready to test Find Tutors page!' as next_step;
