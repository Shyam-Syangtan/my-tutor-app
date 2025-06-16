-- =====================================================
-- ENSURE MESSAGING TABLES EXIST FOR REACT APP
-- Run this script in Supabase SQL Editor to ensure messaging works
-- =====================================================

-- 1. Ensure users table exists (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure tutors table exists
CREATE TABLE IF NOT EXISTS public.tutors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    bio TEXT,
    language TEXT NOT NULL,
    rate INTEGER NOT NULL,
    rating DECIMAL(3,2) DEFAULT 4.5,
    photo_url TEXT,
    native_language TEXT,
    languages_spoken JSONB,
    tags JSONB,
    country_flag TEXT DEFAULT '🇮🇳',
    total_students INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    is_professional BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT false,
    video_url TEXT,
    about_me TEXT,
    teaching_style TEXT,
    resume TEXT,
    experience TEXT,
    specialties TEXT,
    availability TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure chats table exists with proper structure
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id UUID,
    UNIQUE(user1_id, user2_id)
);

-- 4. Ensure messages table exists
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user1_id ON public.chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2_id ON public.chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_approved ON public.tutors(approved);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Create RLS policies for tutors table
DROP POLICY IF EXISTS "Anyone can view approved tutors" ON public.tutors;
CREATE POLICY "Anyone can view approved tutors" ON public.tutors
    FOR SELECT USING (approved = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own tutor profile" ON public.tutors;
CREATE POLICY "Users can manage their own tutor profile" ON public.tutors
    FOR ALL USING (auth.uid() = user_id);

-- 9. Create RLS policies for chats table
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
CREATE POLICY "Users can update their own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 10. Create RLS policies for messages table
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
CREATE POLICY "Users can send messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
        )
    );

-- 11. Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Create function to update chat timestamp when message is sent
CREATE OR REPLACE FUNCTION public.update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats 
    SET updated_at = NOW(), last_message_id = NEW.id
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger for updating chat timestamp
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_chat_timestamp();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ MESSAGING TABLES SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'Tables verified/created:';
    RAISE NOTICE '- users (profile extension)';
    RAISE NOTICE '- tutors (tutor profiles)';
    RAISE NOTICE '- chats (conversations)';
    RAISE NOTICE '- messages (chat messages)';
    RAISE NOTICE 'All RLS policies, indexes, and triggers created!';
    RAISE NOTICE 'Your React messaging system should now work properly.';
END $$;
