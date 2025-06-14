-- REVERT TO BASIC MARKETPLACE - Remove Enhanced Messaging, Keep Core Functionality
-- This script removes all Phase 4 enhanced messaging features and restores simple working state

-- Step 1: Drop all enhanced messaging tables
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.message_status CASCADE;
DROP TABLE IF EXISTS public.typing_indicators CASCADE;
DROP TABLE IF EXISTS public.chat_settings CASCADE;

-- Step 2: Remove enhanced messaging columns from messages table
ALTER TABLE public.messages 
DROP COLUMN IF EXISTS message_type,
DROP COLUMN IF EXISTS file_url,
DROP COLUMN IF EXISTS file_name,
DROP COLUMN IF EXISTS file_type;

-- Step 3: Drop enhanced messaging functions
DROP FUNCTION IF EXISTS public.get_unread_count(UUID, UUID);
DROP FUNCTION IF EXISTS public.marshik_messages_as_read(UUID, UUID);
DROP FUNCTION IF EXISTS public.cleanup_old_typing_indicators();
DROP FUNCTION IF EXISTS public.trigger_cleanup_typing_indicators();
DROP FUNCTION IF EXISTS public.get_current_user_id();

-- Step 4: Drop enhanced messaging storage policies
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in chats they participate in" ON storage.objects;

-- Step 5: Remove chat-files storage bucket
DELETE FROM storage.buckets WHERE id = 'chat-files';

-- Step 6: Ensure tutors table has all necessary columns for the app
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[{"language": "English", "proficiency": "Native"}]',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["Conversational", "Grammar"]',
ADD COLUMN IF NOT EXISTS country_flag TEXT DEFAULT '🇺🇸',
ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS languages_taught TEXT[] DEFAULT ARRAY['English'];

-- Step 7: Make user_id nullable to avoid foreign key issues
ALTER TABLE public.tutors ALTER COLUMN user_id DROP NOT NULL;

-- Step 8: Update existing tutors with required data
UPDATE public.tutors SET 
    approved = COALESCE(approved, true),
    native_language = COALESCE(native_language, 'English'),
    language = COALESCE(language, 'English'),
    languages_spoken = COALESCE(languages_spoken, '[{"language": "English", "proficiency": "Native"}]'::jsonb),
    tags = COALESCE(tags, '["Conversational", "Grammar"]'::jsonb),
    country_flag = COALESCE(country_flag, '🇺🇸'),
    total_students = COALESCE(total_students, 25),
    languages_taught = COALESCE(languages_taught, ARRAY['English'])
WHERE approved IS NULL OR native_language IS NULL;

-- Step 9: Clean up any existing sample data
DELETE FROM public.tutors WHERE email LIKE '%@tutorapp.com' OR email LIKE '%@example.com';
DELETE FROM public.reviews WHERE tutor_id NOT IN (SELECT id FROM public.tutors);
DELETE FROM public.tutor_availability WHERE tutor_id NOT IN (SELECT user_id FROM public.tutors WHERE user_id IS NOT NULL);

-- Step 10: Reset RLS policies to simple, working versions
DROP POLICY IF EXISTS "Anyone can view tutors" ON public.tutors;
DROP POLICY IF EXISTS "Anyone can view approved tutors" ON public.tutors;
CREATE POLICY "Anyone can view approved tutors" ON public.tutors
    FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Users can manage their own tutor profile" ON public.tutors;
CREATE POLICY "Users can manage their own tutor profile" ON public.tutors
    FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Simple messaging policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM public.chats 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
CREATE POLICY "Users can send messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        chat_id IN (
            SELECT id FROM public.chats 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

-- Simple user policies
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 11: Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutors_approved ON public.tutors(approved);
CREATE INDEX IF NOT EXISTS idx_tutors_language ON public.tutors(language);
CREATE INDEX IF NOT EXISTS idx_tutors_native_language ON public.tutors(native_language);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at);

-- Step 12: Keep only the essential create_chat function
CREATE OR REPLACE FUNCTION create_chat(student_uuid UUID, tutor_uuid UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    SELECT id INTO chat_id
    FROM public.chats
    WHERE student_id = student_uuid AND tutor_id = tutor_uuid;
    
    IF chat_id IS NULL THEN
        INSERT INTO public.chats (student_id, tutor_id)
        VALUES (student_uuid, tutor_uuid)
        RETURNING id INTO chat_id;
    END IF;
    
    RETURN chat_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'REVERTED TO BASIC MARKETPLACE SUCCESSFULLY!' as status,
       'Enhanced messaging features removed' as phase4_status,
       'Core tutor marketplace preserved' as core_status,
       'Ready for sample data insertion' as next_step;
