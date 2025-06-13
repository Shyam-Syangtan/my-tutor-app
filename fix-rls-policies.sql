-- =============================================
-- FIX RLS POLICIES FOR ALL TABLES
-- =============================================
-- This script ensures all tables have proper Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;

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
