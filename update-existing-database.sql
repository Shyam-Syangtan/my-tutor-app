-- UPDATED SQL SCRIPT - Using Your Existing Students Table
-- Run this script in your Supabase SQL Editor

-- First, let's see what we're working with and modify your existing students table
-- Add role column to existing students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('tutor', 'student')) DEFAULT 'student';

-- Update existing records to have student role by default
UPDATE students SET role = 'student' WHERE role IS NULL;

-- Make role column NOT NULL after setting defaults
ALTER TABLE students ALTER COLUMN role SET NOT NULL;

-- Optionally rename students table to users (more generic)
-- Uncomment the next line if you want to rename the table
-- ALTER TABLE students RENAME TO users;

-- Drop the old profiles table if it exists (since we're using students table instead)
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create availability table (referencing students table)
CREATE TABLE availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, lesson_date, start_time)
);

-- Create lessons table (referencing students table)
CREATE TABLE lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    availability_id UUID REFERENCES availability(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    lesson_type TEXT CHECK (lesson_type IN ('trial', 'regular')) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for students (now users) table
CREATE POLICY "Users can view own profile" ON students
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON students
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON students
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS Policies for availability
CREATE POLICY "Tutors can manage own availability" ON availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = auth.uid() 
            AND students.role = 'tutor'
            AND students.id = availability.tutor_id
        )
    );

CREATE POLICY "Students can view available slots" ON availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = auth.uid() 
            AND students.role = 'student'
        )
    );

-- Create RLS Policies for lessons
CREATE POLICY "Tutors can view own lessons" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = auth.uid() 
            AND students.role = 'tutor'
            AND students.id = lessons.tutor_id
        )
    );

CREATE POLICY "Students can view own lessons" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = auth.uid() 
            AND students.role = 'student'
            AND students.id = lessons.student_id
        )
    );

CREATE POLICY "Students can book lessons" ON lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = auth.uid() 
            AND students.role = 'student'
            AND students.id = lessons.student_id
        )
    );

CREATE POLICY "Tutors can update lesson status" ON lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = auth.uid() 
            AND students.role = 'tutor'
            AND students.id = lessons.tutor_id
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_availability_tutor_date ON availability(tutor_id, lesson_date);
CREATE INDEX idx_availability_date_time ON availability(lesson_date, start_time);
CREATE INDEX idx_lessons_tutor_date ON lessons(tutor_id, lesson_date);
CREATE INDEX idx_lessons_student_date ON lessons(student_id, lesson_date);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.students (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update availability when lesson is booked
CREATE OR REPLACE FUNCTION public.book_lesson()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark availability as booked
    UPDATE availability 
    SET is_booked = TRUE, updated_at = NOW()
    WHERE id = NEW.availability_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking lessons
DROP TRIGGER IF EXISTS on_lesson_booked ON lessons;
CREATE TRIGGER on_lesson_booked
    AFTER INSERT ON lessons
    FOR EACH ROW EXECUTE FUNCTION public.book_lesson();

-- Show current students table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
