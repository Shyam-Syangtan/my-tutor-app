-- =============================================
-- CREATE LESSON REQUESTS TABLE
-- =============================================
-- This script creates the missing lesson_requests table and sets up basic RLS policies

-- 1. Create lesson_requests table
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_requests_tutor ON lesson_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_student ON lesson_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_status ON lesson_requests(status);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_date ON lesson_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_tutor_status ON lesson_requests(tutor_id, status);

-- 3. Enable Row Level Security
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
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

-- 5. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_lesson_requests_updated_at ON lesson_requests;
CREATE TRIGGER update_lesson_requests_updated_at BEFORE UPDATE ON lesson_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Create function to automatically create lesson when request is approved
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

-- 8. Create trigger to automatically create lesson when request is approved
DROP TRIGGER IF EXISTS on_lesson_request_approved ON lesson_requests;
CREATE TRIGGER on_lesson_request_approved
    AFTER UPDATE ON lesson_requests
    FOR EACH ROW EXECUTE FUNCTION public.create_lesson_from_request();

-- 9. Verification queries
-- Check if table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lesson_requests'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'lesson_requests';

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'lesson_requests'
ORDER BY policyname;

-- Insert a test record (uncomment to test)
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
--     'Test lesson request'
-- );

-- Count records in table
SELECT COUNT(*) as total_lesson_requests FROM lesson_requests;
