-- =============================================
-- CREATE MISSING TABLES AND FIX RLS POLICIES
-- =============================================
-- This script creates missing tables and ensures all tables have proper Row Level Security policies

-- =============================================
-- CREATE MISSING TABLES FIRST
-- =============================================

-- 1. Create lesson_requests table if it doesn't exist
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

-- 2. Create users table if it doesn't exist (for role-based authentication)
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

-- 3. Ensure lessons table has required columns
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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'notes') THEN
        ALTER TABLE lessons ADD COLUMN notes TEXT;
    END IF;

    -- Update status column to include 'confirmed' if it doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'status') THEN
        -- Drop existing constraint and add new one
        ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
        ALTER TABLE lessons ADD CONSTRAINT lessons_status_check
            CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));
    END IF;
END $$;

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
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
-- ENABLE RLS ON ALL TABLES
-- =============================================

-- Enable RLS on all tables (only if they exist)
DO $$
BEGIN
    -- Enable RLS on lessons table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
        ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on lesson_requests table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests') THEN
        ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on users table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on tutors table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutors') THEN
        ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on tutor_availability table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_availability') THEN
        ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================
-- LESSONS TABLE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can view their lessons" ON lessons;
DROP POLICY IF EXISTS "Students can create lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can create lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can update their lessons" ON lessons;
DROP POLICY IF EXISTS "Students can update own lessons" ON lessons;

-- Students can view their own lessons
CREATE POLICY "Students can view own lessons" ON lessons
    FOR SELECT USING (auth.uid() = student_id);

-- Tutors can view their lessons
CREATE POLICY "Tutors can view their lessons" ON lessons
    FOR SELECT USING (auth.uid() = tutor_id);

-- Students can create lessons (for direct booking)
CREATE POLICY "Students can create lessons" ON lessons
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Tutors can create lessons (for their own schedule)
CREATE POLICY "Tutors can create lessons" ON lessons
    FOR INSERT WITH CHECK (auth.uid() = tutor_id);

-- Tutors can update their lessons
CREATE POLICY "Tutors can update their lessons" ON lessons
    FOR UPDATE USING (auth.uid() = tutor_id);

-- Students can update their own lessons (limited)
CREATE POLICY "Students can update own lessons" ON lessons
    FOR UPDATE USING (auth.uid() = student_id);

-- =============================================
-- LESSON REQUESTS TABLE POLICIES (Enhanced)
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own requests" ON lesson_requests;
DROP POLICY IF EXISTS "Students can create requests" ON lesson_requests;
DROP POLICY IF EXISTS "Tutors can view their requests" ON lesson_requests;
DROP POLICY IF EXISTS "Tutors can update request status" ON lesson_requests;

-- Students can view their own lesson requests
CREATE POLICY "Students can view own requests" ON lesson_requests
    FOR SELECT USING (auth.uid() = student_id);

-- Students can create lesson requests
CREATE POLICY "Students can create requests" ON lesson_requests
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Tutors can view requests for their lessons
CREATE POLICY "Tutors can view their requests" ON lesson_requests
    FOR SELECT USING (auth.uid() = tutor_id);

-- Tutors can update status of their lesson requests
CREATE POLICY "Tutors can update request status" ON lesson_requests
    FOR UPDATE USING (auth.uid() = tutor_id);

-- =============================================
-- TUTORS TABLE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view tutors" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can insert own profile" ON tutors;

-- Anyone can view tutor profiles (for browsing)
CREATE POLICY "Anyone can view tutors" ON tutors
    FOR SELECT USING (true);

-- Tutors can update their own profile
CREATE POLICY "Tutors can update own profile" ON tutors
    FOR UPDATE USING (auth.uid() = id);

-- Tutors can insert their own profile
CREATE POLICY "Tutors can insert own profile" ON tutors
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- TUTOR AVAILABILITY POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view availability" ON tutor_availability;
DROP POLICY IF EXISTS "Tutors can manage own availability" ON tutor_availability;
DROP POLICY IF EXISTS "Tutors can insert own availability" ON tutor_availability;
DROP POLICY IF EXISTS "Tutors can update own availability" ON tutor_availability;
DROP POLICY IF EXISTS "Tutors can delete own availability" ON tutor_availability;

-- Anyone can view tutor availability (for booking)
CREATE POLICY "Anyone can view availability" ON tutor_availability
    FOR SELECT USING (true);

-- Tutors can insert their own availability
CREATE POLICY "Tutors can insert own availability" ON tutor_availability
    FOR INSERT WITH CHECK (auth.uid() = tutor_id);

-- Tutors can update their own availability
CREATE POLICY "Tutors can update own availability" ON tutor_availability
    FOR UPDATE USING (auth.uid() = tutor_id);

-- Tutors can delete their own availability
CREATE POLICY "Tutors can delete own availability" ON tutor_availability
    FOR DELETE USING (auth.uid() = tutor_id);

-- =============================================
-- USERS TABLE POLICIES (Enhanced)
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view user emails" ON users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow viewing user emails for lesson requests (limited fields)
CREATE POLICY "Anyone can view user emails" ON users
    FOR SELECT USING (true);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('lessons', 'lesson_requests', 'tutors', 'tutor_availability', 'users')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('lessons', 'lesson_requests', 'tutors', 'tutor_availability', 'users')
ORDER BY tablename;

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
