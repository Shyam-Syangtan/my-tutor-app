-- Create profiles table for user roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('tutor', 'student')) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing availability table if it exists to avoid conflicts
DROP TABLE IF EXISTS availability CASCADE;

-- Create availability table
CREATE TABLE availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, lesson_date, start_time)
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS Policies for availability
CREATE POLICY "Tutors can manage own availability" ON availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tutor'
            AND profiles.id = availability.tutor_id
        )
    );

CREATE POLICY "Students can view available slots" ON availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'student'
        )
    );

-- Create RLS Policies for lessons
CREATE POLICY "Tutors can view own lessons" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tutor'
            AND profiles.id = lessons.tutor_id
        )
    );

CREATE POLICY "Students can view own lessons" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'student'
            AND profiles.id = lessons.student_id
        )
    );

CREATE POLICY "Students can book lessons" ON lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'student'
            AND profiles.id = lessons.student_id
        )
    );

CREATE POLICY "Tutors can update lesson status" ON lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tutor'
            AND profiles.id = lessons.tutor_id
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_availability_tutor_date ON availability(tutor_id, lesson_date);
CREATE INDEX idx_availability_date_time ON availability(lesson_date, start_time);
CREATE INDEX idx_lessons_tutor_date ON lessons(tutor_id, lesson_date);
CREATE INDEX idx_lessons_student_date ON lessons(student_id, lesson_date);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
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
