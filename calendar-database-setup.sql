-- =====================================================
-- CALENDAR AND SCHEDULING SYSTEM DATABASE SETUP
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. Clean up existing scheduling tables (if any)
DROP TABLE IF EXISTS public.lesson_requests CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.tutor_availability CASCADE;

-- 2. Create tutor_availability table for weekly recurring availability
CREATE TABLE public.tutor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, day_of_week, start_time)
);

-- 3. Create lessons table for actual scheduled lessons
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    lesson_type VARCHAR(50) DEFAULT 'conversation_practice',
    notes TEXT,
    google_meet_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create lesson_requests table for booking workflow
CREATE TABLE public.lesson_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_date DATE NOT NULL,
    requested_start_time TIME NOT NULL,
    requested_end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    student_message TEXT,
    tutor_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX idx_tutor_availability_tutor_day ON public.tutor_availability(tutor_id, day_of_week);
CREATE INDEX idx_lessons_tutor_date ON public.lessons(tutor_id, lesson_date);
CREATE INDEX idx_lessons_student_date ON public.lessons(student_id, lesson_date);
CREATE INDEX idx_lesson_requests_tutor_status ON public.lesson_requests(tutor_id, status);
CREATE INDEX idx_lesson_requests_student_status ON public.lesson_requests(student_id, status);

-- 6. Enable Row Level Security
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for tutor_availability
CREATE POLICY "Tutors can manage their own availability" ON public.tutor_availability
    FOR ALL USING (tutor_id = auth.uid());

CREATE POLICY "Students can view tutor availability" ON public.tutor_availability
    FOR SELECT USING (is_available = true);

-- 8. Create RLS policies for lessons
CREATE POLICY "Users can view their own lessons" ON public.lessons
    FOR SELECT USING (tutor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Tutors can manage lessons they teach" ON public.lessons
    FOR ALL USING (tutor_id = auth.uid());

CREATE POLICY "Students can view lessons they booked" ON public.lessons
    FOR SELECT USING (student_id = auth.uid());

-- 9. Create RLS policies for lesson_requests
CREATE POLICY "Users can view their own lesson requests" ON public.lesson_requests
    FOR SELECT USING (tutor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Students can create lesson requests" ON public.lesson_requests
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Tutors can update requests for their lessons" ON public.lesson_requests
    FOR UPDATE USING (tutor_id = auth.uid());

-- 10. Enable Realtime for lesson requests (for notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;

-- 11. Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers for updated_at
CREATE TRIGGER update_tutor_availability_updated_at
    BEFORE UPDATE ON public.tutor_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_requests_updated_at
    BEFORE UPDATE ON public.lesson_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Grant permissions
GRANT ALL ON public.tutor_availability TO authenticated;
GRANT ALL ON public.lessons TO authenticated;
GRANT ALL ON public.lesson_requests TO authenticated;

-- 14. Insert sample availability data (optional - for testing)
-- Uncomment to add sample data:
/*
INSERT INTO public.tutor_availability (tutor_id, day_of_week, start_time, end_time) VALUES
-- Sample for Monday (1) - 9 AM to 5 PM with 1-hour slots
(auth.uid(), 1, '09:00', '10:00'),
(auth.uid(), 1, '10:00', '11:00'),
(auth.uid(), 1, '11:00', '12:00'),
(auth.uid(), 1, '14:00', '15:00'),
(auth.uid(), 1, '15:00', '16:00'),
(auth.uid(), 1, '16:00', '17:00');
*/

-- 15. Verification queries
SELECT 'tutor_availability table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_availability');

SELECT 'lessons table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons');

SELECT 'lesson_requests table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_requests');

-- Success message
SELECT 'Calendar and Scheduling Database Setup Complete!' as result;
