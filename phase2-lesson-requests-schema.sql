-- =============================================
-- PHASE 2: LESSON REQUEST WORKFLOW SCHEMA
-- =============================================
-- This schema supports the complete lesson confirmation and management system

-- 1. LESSON REQUESTS TABLE (Core table for booking workflow)
CREATE TABLE IF NOT EXISTS lesson_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL,
    student_id UUID NOT NULL,
    requested_date DATE NOT NULL,
    requested_start_time TIME NOT NULL,
    requested_end_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
    student_message TEXT,
    tutor_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENHANCED LESSONS TABLE (Updated to work with lesson requests)
-- First, check if lessons table exists and update it
DO $$
BEGIN
    -- Add missing columns to lessons table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_date') THEN
        ALTER TABLE lessons ADD COLUMN lesson_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'start_time') THEN
        ALTER TABLE lessons ADD COLUMN start_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'end_time') THEN
        ALTER TABLE lessons ADD COLUMN end_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_type') THEN
        ALTER TABLE lessons ADD COLUMN lesson_type TEXT DEFAULT 'conversation_practice';
    END IF;

    -- Update status column to include 'confirmed' if it doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'status') THEN
        -- Drop existing constraint and add new one
        ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
        ALTER TABLE lessons ADD CONSTRAINT lessons_status_check 
            CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));
    END IF;
END $$;

-- 3. USERS TABLE (Unified user management)
-- Create users table if it doesn't exist (for role-based authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
    is_tutor_approved BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Lesson requests indexes
CREATE INDEX IF NOT EXISTS idx_lesson_requests_tutor ON lesson_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_student ON lesson_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_status ON lesson_requests(status);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_date ON lesson_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_tutor_status ON lesson_requests(tutor_id, status);

-- Enhanced lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_date ON lessons(tutor_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_student_date ON lessons(student_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_status_date ON lessons(status, lesson_date);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tutor_approved ON users(is_tutor_approved);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lesson Requests Policies
DO $$
BEGIN
    -- Students can view their own lesson requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lesson_requests' AND policyname = 'Students can view own requests') THEN
        CREATE POLICY "Students can view own requests" ON lesson_requests
            FOR SELECT USING (auth.uid() = student_id);
    END IF;

    -- Students can create lesson requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lesson_requests' AND policyname = 'Students can create requests') THEN
        CREATE POLICY "Students can create requests" ON lesson_requests
            FOR INSERT WITH CHECK (auth.uid() = student_id);
    END IF;

    -- Tutors can view requests for their lessons
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lesson_requests' AND policyname = 'Tutors can view their requests') THEN
        CREATE POLICY "Tutors can view their requests" ON lesson_requests
            FOR SELECT USING (auth.uid() = tutor_id);
    END IF;

    -- Tutors can update status of their lesson requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lesson_requests' AND policyname = 'Tutors can update request status') THEN
        CREATE POLICY "Tutors can update request status" ON lesson_requests
            FOR UPDATE USING (auth.uid() = tutor_id);
    END IF;

    -- Users can view their own profile
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
    END IF;

    -- Users can update their own profile
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Users can insert their own profile
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_lesson_requests_updated_at ON lesson_requests;
CREATE TRIGGER update_lesson_requests_updated_at BEFORE UPDATE ON lesson_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create lesson when request is approved
CREATE OR REPLACE FUNCTION public.create_lesson_from_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create lesson if status changed to 'approved'
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        INSERT INTO lessons (
            tutor_id,
            student_id,
            lesson_date,
            start_time,
            end_time,
            status,
            lesson_type,
            notes
        ) VALUES (
            NEW.tutor_id,
            NEW.student_id,
            NEW.requested_date,
            NEW.requested_start_time,
            NEW.requested_end_time,
            'confirmed',
            'conversation_practice',
            COALESCE(NEW.student_message, 'Lesson booked through calendar')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create lesson when request is approved
DROP TRIGGER IF EXISTS on_lesson_request_approved ON lesson_requests;
CREATE TRIGGER on_lesson_request_approved
    AFTER UPDATE ON lesson_requests
    FOR EACH ROW EXECUTE FUNCTION public.create_lesson_from_request();

-- =============================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =============================================

-- Insert sample lesson request (uncomment for testing)
-- INSERT INTO lesson_requests (
--     tutor_id, 
--     student_id, 
--     requested_date, 
--     requested_start_time, 
--     requested_end_time,
--     student_message
-- ) VALUES (
--     'your-tutor-uuid-here',
--     'your-student-uuid-here',
--     CURRENT_DATE + INTERVAL '1 day',
--     '14:00:00',
--     '15:00:00',
--     'Looking forward to practicing conversation skills!'
-- );
