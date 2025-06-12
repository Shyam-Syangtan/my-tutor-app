-- =============================================
-- SUPABASE DATABASE SCHEMA FOR TUTOR MARKETPLACE
-- =============================================

-- 1. STUDENTS TABLE (Already exists, but let's ensure proper structure)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TUTORS TABLE (Enhanced with all required fields)
-- First, let's check what columns exist and add missing ones
DO $$
BEGIN
    -- Add missing columns to existing tutors table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'country') THEN
        ALTER TABLE tutors ADD COLUMN country TEXT DEFAULT 'India';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'country_flag') THEN
        ALTER TABLE tutors ADD COLUMN country_flag TEXT DEFAULT '🇮🇳';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'native_language') THEN
        ALTER TABLE tutors ADD COLUMN native_language TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'languages_spoken') THEN
        ALTER TABLE tutors ADD COLUMN languages_spoken JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'bio_headline') THEN
        ALTER TABLE tutors ADD COLUMN bio_headline TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'total_students') THEN
        ALTER TABLE tutors ADD COLUMN total_students INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'total_lessons') THEN
        ALTER TABLE tutors ADD COLUMN total_lessons INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'video_url') THEN
        ALTER TABLE tutors ADD COLUMN video_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'teaching_style') THEN
        ALTER TABLE tutors ADD COLUMN teaching_style TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'resume') THEN
        ALTER TABLE tutors ADD COLUMN resume TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'about_me') THEN
        ALTER TABLE tutors ADD COLUMN about_me TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'me_as_teacher') THEN
        ALTER TABLE tutors ADD COLUMN me_as_teacher TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'tags') THEN
        ALTER TABLE tutors ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'is_professional') THEN
        ALTER TABLE tutors ADD COLUMN is_professional BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'is_active') THEN
        ALTER TABLE tutors ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'created_at') THEN
        ALTER TABLE tutors ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'updated_at') THEN
        ALTER TABLE tutors ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update existing tutors to have native_language based on language column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'language') THEN
        UPDATE tutors SET native_language = language WHERE native_language IS NULL;
    END IF;
END $$;

-- 3. TUTOR AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_helpful BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LESSONS TABLE
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Create index on native_language if column exists, otherwise on language
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'native_language') THEN
        CREATE INDEX IF NOT EXISTS idx_tutors_native_language ON tutors(native_language);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'language') THEN
        CREATE INDEX IF NOT EXISTS idx_tutors_language ON tutors(language);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_tutors_rating ON tutors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_tutors_rate ON tutors(rate);
CREATE INDEX IF NOT EXISTS idx_tutors_active ON tutors(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_availability_tutor ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor ON lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student ON lessons(student_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Students can read their own data
CREATE POLICY "Students can view own profile" ON students
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can update own profile" ON students
    FOR UPDATE USING (auth.uid() = id);

-- Anyone can read tutor profiles (public data)
CREATE POLICY "Anyone can view tutors" ON tutors
    FOR SELECT USING (is_active = true);

-- Anyone can read tutor availability
CREATE POLICY "Anyone can view availability" ON tutor_availability
    FOR SELECT USING (true);

-- Anyone can read reviews
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

-- Students can create reviews for their lessons
CREATE POLICY "Students can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can view their own lessons
CREATE POLICY "Students can view own lessons" ON lessons
    FOR SELECT USING (auth.uid() = student_id);

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
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutors_updated_at BEFORE UPDATE ON tutors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update tutor stats when reviews are added
CREATE OR REPLACE FUNCTION update_tutor_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tutors SET
        rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE tutor_id = NEW.tutor_id
        )
    WHERE id = NEW.tutor_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update tutor rating when review is added
CREATE TRIGGER update_tutor_rating_on_review
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_tutor_stats();
