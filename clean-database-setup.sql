-- CLEAN DATABASE SETUP - DROPS EVERYTHING FIRST, THEN RECREATES
-- This script will remove all existing tables and policies, then create everything fresh

-- Step 1: Drop all existing policies (if they exist)
DO $$ 
BEGIN
    -- Drop policies for users table
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    
    -- Drop policies for tutors table
    DROP POLICY IF EXISTS "Anyone can view tutors" ON public.tutors;
    DROP POLICY IF EXISTS "Anyone can view approved tutors" ON public.tutors;
    DROP POLICY IF EXISTS "Users can manage their own tutor profile" ON public.tutors;
    
    -- Drop policies for students table
    DROP POLICY IF EXISTS "Users can manage their own student profile" ON public.students;
    
    -- Drop policies for chats table
    DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
    DROP POLICY IF EXISTS "Users can create chats they participate in" ON public.chats;
    DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
    
    -- Drop policies for messages table
    DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
    
    -- Drop policies for reviews table
    DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Students can create reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Students can update their own reviews" ON public.reviews;
    
    -- Drop policies for tutor_availability table
    DROP POLICY IF EXISTS "Anyone can view tutor availability" ON public.tutor_availability;
    DROP POLICY IF EXISTS "Tutors can manage their own availability" ON public.tutor_availability;
    
    -- Drop policies for lessons table
    DROP POLICY IF EXISTS "Users can view their own lessons" ON public.lessons;
    DROP POLICY IF EXISTS "Users can manage their own lessons" ON public.lessons;
    
    -- Drop policies for lesson_requests table
    DROP POLICY IF EXISTS "Users can view their own lesson requests" ON public.lesson_requests;
    DROP POLICY IF EXISTS "Students can create lesson requests" ON public.lesson_requests;
    DROP POLICY IF EXISTS "Users can update their own lesson requests" ON public.lesson_requests;
    
    -- Drop enhanced messaging policies
    DROP POLICY IF EXISTS "Users can view typing indicators in their chats" ON public.typing_indicators;
    DROP POLICY IF EXISTS "Users can update their own typing indicators" ON public.typing_indicators;
    DROP POLICY IF EXISTS "Users can view message status for their messages" ON public.message_status;
    DROP POLICY IF EXISTS "Users can update message status" ON public.message_status;
    DROP POLICY IF EXISTS "Users can view reactions in their chats" ON public.message_reactions;
    DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.message_reactions;
    DROP POLICY IF EXISTS "Users can manage their own chat settings" ON public.chat_settings;
    
    RAISE NOTICE 'All existing policies dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies did not exist, continuing';
END $$;

-- Step 2: Drop all existing tables (in correct order to avoid foreign key issues)
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.message_status CASCADE;
DROP TABLE IF EXISTS public.typing_indicators CASCADE;
DROP TABLE IF EXISTS public.chat_settings CASCADE;
DROP TABLE IF EXISTS public.lesson_requests CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.tutor_availability CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.tutors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.create_chat(UUID, UUID);
DROP FUNCTION IF EXISTS public.update_tutor_rating(UUID);
DROP FUNCTION IF EXISTS public.get_unread_count(UUID, UUID);
DROP FUNCTION IF EXISTS public.mark_messages_as_read(UUID, UUID);
DROP FUNCTION IF EXISTS public.cleanup_old_typing_indicators();
DROP FUNCTION IF EXISTS public.trigger_cleanup_typing_indicators();
DROP FUNCTION IF EXISTS public.trigger_update_tutor_rating();

-- Step 3: Create all tables fresh
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tutors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    bio TEXT,
    languages TEXT[] DEFAULT '{}',
    specialties TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    rate DECIMAL(10,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    photo_url TEXT,
    video_url TEXT,
    tutor_type TEXT DEFAULT 'community',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    learning_goals TEXT,
    preferred_languages TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, tutor_id)
);

CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tutor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, day_of_week, start_time)
);

CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.lesson_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_date DATE NOT NULL,
    requested_start_time TIME NOT NULL,
    requested_end_time TIME NOT NULL,
    status TEXT DEFAULT 'pending',
    student_message TEXT,
    tutor_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced messaging tables
CREATE TABLE public.typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

CREATE TABLE public.message_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id)
);

CREATE TABLE public.message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

CREATE TABLE public.chat_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chat_id)
);

-- Step 4: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'CLEAN DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'All old tables and policies removed';
    RAISE NOTICE 'All base tables created (9 tables)';
    RAISE NOTICE 'All enhanced messaging tables created (4 tables)';
    RAISE NOTICE 'Row Level Security enabled on all tables';
    RAISE NOTICE 'Total: 13 tables created and ready';
    RAISE NOTICE 'Now run: add-policies-and-functions.sql';
END $$;
