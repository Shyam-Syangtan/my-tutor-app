-- SQL Script to Update Tutors Table for New Application System
-- Run this in your Supabase SQL Editor

-- Add new columns to existing tutors table if they don't exist
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS specialties TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS native_languages TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS tutor_type TEXT CHECK (tutor_type IN ('professional', 'community'));
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing tutors to be approved by default (if any exist)
UPDATE tutors SET approved = TRUE WHERE approved IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_approved ON tutors(approved);
CREATE INDEX IF NOT EXISTS idx_tutors_tutor_type ON tutors(tutor_type);

-- Enable Row Level Security
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view approved tutors" ON tutors;
DROP POLICY IF EXISTS "Users can create own tutor profile" ON tutors;
DROP POLICY IF EXISTS "Users can view own tutor profile" ON tutors;
DROP POLICY IF EXISTS "Users can update own pending tutor profile" ON tutors;

-- Create RLS Policies for tutors table
-- Allow users to read approved tutors
CREATE POLICY "Anyone can view approved tutors" ON tutors
    FOR SELECT USING (approved = true);

-- Allow users to insert their own tutor application
CREATE POLICY "Users can create own tutor profile" ON tutors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own tutor profile (approved or not)
CREATE POLICY "Users can view own tutor profile" ON tutors
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own tutor profile (only if not approved yet)
CREATE POLICY "Users can update own pending tutor profile" ON tutors
    FOR UPDATE USING (auth.uid() = user_id AND approved = false);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tutors_updated_at ON tutors;
CREATE TRIGGER update_tutors_updated_at
    BEFORE UPDATE ON tutors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for approved tutors (for better performance)
CREATE OR REPLACE VIEW approved_tutors AS
SELECT * FROM tutors WHERE approved = true;

-- Create function to check if user is approved tutor
CREATE OR REPLACE FUNCTION is_approved_tutor(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tutors
        WHERE user_id = user_uuid AND approved = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tutors'
ORDER BY ordinal_position;
