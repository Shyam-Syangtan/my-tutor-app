-- COMPLETE DATABASE SETUP FOR TUTOR MARKETPLACE - FIXED VERSION
-- Run this FIRST before running enhanced-messaging-schema.sql

-- 1. Create users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create tutors table
CREATE TABLE IF NOT EXISTS public.tutors (
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

-- 3. Create students table (optional, can use users table directly)
CREATE TABLE IF NOT EXISTS public.students (
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

-- 4. Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, tutor_id)
);

-- 5. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create tutor_availability table
CREATE TABLE IF NOT EXISTS public.tutor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, day_of_week, start_time)
);

-- 8. Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
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

-- 9. Create lesson_requests table
CREATE TABLE IF NOT EXISTS public.lesson_requests (
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

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Tutors policies
CREATE POLICY "Anyone can view tutors" ON public.tutors
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own tutor profile" ON public.tutors
    FOR ALL USING (auth.uid() = user_id);

-- Students policies
CREATE POLICY "Users can manage their own student profile" ON public.students
    FOR ALL USING (auth.uid() = user_id);

-- Chats policies
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can create chats they participate in" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can update their own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Messages policies
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM public.chats 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        chat_id IN (
            SELECT id FROM public.chats 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Students can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = student_id);

-- Tutor availability policies
CREATE POLICY "Anyone can view tutor availability" ON public.tutor_availability
    FOR SELECT USING (true);

CREATE POLICY "Tutors can manage their own availability" ON public.tutor_availability
    FOR ALL USING (auth.uid() = tutor_id);

-- Lessons policies
CREATE POLICY "Users can view their own lessons" ON public.lessons
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can manage their own lessons" ON public.lessons
    FOR ALL USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Lesson requests policies
CREATE POLICY "Users can view their own lesson requests" ON public.lesson_requests
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Students can create lesson requests" ON public.lesson_requests
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own lesson requests" ON public.lesson_requests
    FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- 12. Create basic indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON public.chats(student_id, tutor_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor_id ON public.reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor ON public.tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_participants ON public.lessons(student_id, tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_tutor ON public.lesson_requests(tutor_id);

-- 13. Create functions for common operations

-- Function to create a chat between student and tutor
CREATE OR REPLACE FUNCTION create_chat(student_uuid UUID, tutor_uuid UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- Check if chat already exists
    SELECT id INTO chat_id
    FROM public.chats
    WHERE student_id = student_uuid AND tutor_id = tutor_uuid;
    
    -- If chat doesn't exist, create it
    IF chat_id IS NULL THEN
        INSERT INTO public.chats (student_id, tutor_id)
        VALUES (student_uuid, tutor_uuid)
        RETURNING id INTO chat_id;
    END IF;
    
    RETURN chat_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update tutor rating
CREATE OR REPLACE FUNCTION update_tutor_rating(tutor_uuid UUID)
RETURNS void AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calculate average rating and count
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, review_count
    FROM public.reviews r
    JOIN public.tutors t ON r.tutor_id = t.id
    WHERE t.user_id = tutor_uuid;
    
    -- Update tutor record
    UPDATE public.tutors
    SET rating = COALESCE(avg_rating, 0.00),
        total_reviews = COALESCE(review_count, 0),
        updated_at = NOW()
    WHERE user_id = tutor_uuid;
END;
$$ LANGUAGE plpgsql;

-- 14. Create triggers

-- Trigger to update tutor rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_tutor_rating()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_tutor_rating((SELECT user_id FROM public.tutors WHERE id = OLD.tutor_id));
        RETURN OLD;
    ELSE
        PERFORM update_tutor_rating((SELECT user_id FROM public.tutors WHERE id = NEW.tutor_id));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutor_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_tutor_rating();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Complete database setup completed successfully!';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- users (profile extension)';
    RAISE NOTICE '- tutors (tutor profiles)';
    RAISE NOTICE '- students (student profiles)';
    RAISE NOTICE '- chats (conversations)';
    RAISE NOTICE '- messages (chat messages)';
    RAISE NOTICE '- reviews (tutor reviews)';
    RAISE NOTICE '- tutor_availability (tutor schedules)';
    RAISE NOTICE '- lessons (confirmed lessons)';
    RAISE NOTICE '- lesson_requests (booking requests)';
    RAISE NOTICE 'All RLS policies and indexes created!';
    RAISE NOTICE 'Now you can run enhanced-messaging-schema.sql';
END $$;
