-- Supabase Configuration Updates for Next.js Migration
-- Run these in your Supabase SQL Editor

-- 1. Verify RLS policies are working with Next.js SSR
-- Check tutors table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('tutors', 'lessons', 'messages', 'users');

-- 2. Add any missing indexes for Next.js SSR performance
CREATE INDEX IF NOT EXISTS idx_tutors_approved_rating ON tutors(approved, rating DESC) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_student ON lessons(tutor_id, student_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);

-- 3. Ensure proper permissions for Next.js server-side queries
-- Grant necessary permissions for anon role (used in getServerSideProps)
GRANT SELECT ON tutors TO anon;
GRANT SELECT ON lessons TO anon;

-- 4. Add function for Next.js SSR data fetching
CREATE OR REPLACE FUNCTION get_tutor_stats()
RETURNS TABLE(
  total_tutors bigint,
  total_students bigint,
  avg_rating numeric
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    (SELECT COUNT(*) FROM tutors WHERE approved = true) as total_tutors,
    (SELECT COUNT(DISTINCT student_id) FROM lessons) as total_students,
    (SELECT AVG(rating) FROM tutors WHERE approved = true AND rating IS NOT NULL) as avg_rating;
$$;

-- 5. Create function for dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_data(user_uuid uuid)
RETURNS TABLE(
  is_tutor boolean,
  tutor_approved boolean,
  lesson_count bigint,
  message_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    EXISTS(SELECT 1 FROM tutors WHERE user_id = user_uuid) as is_tutor,
    COALESCE((SELECT approved FROM tutors WHERE user_id = user_uuid), false) as tutor_approved,
    (SELECT COUNT(*) FROM lessons WHERE student_id = user_uuid OR tutor_id = (SELECT id FROM tutors WHERE user_id = user_uuid)) as lesson_count,
    (SELECT COUNT(*) FROM messages WHERE sender_id = user_uuid OR receiver_id = user_uuid) as message_count;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tutor_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data(uuid) TO authenticated;

-- 7. Verify all tables exist and have proper structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('tutors', 'lessons', 'messages', 'users')
ORDER BY table_name, ordinal_position;
