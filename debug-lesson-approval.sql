-- Debug Script for Lesson Approval System
-- Run this AFTER running the main fix-lesson-approval-complete.sql script

-- Step 1: Check if trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_lesson_request_approved';

-- Step 2: Check if functions exist
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'create_lesson_from_request',
    'manual_create_lesson',
    'get_student_lessons_optimized',
    'get_student_lessons',
    'fix_missing_lessons'
);

-- Step 3: Check current lesson_requests and lessons data
SELECT 
    'lesson_requests' as table_name,
    status,
    COUNT(*) as count
FROM public.lesson_requests 
GROUP BY status
UNION ALL
SELECT 
    'lessons' as table_name,
    status,
    COUNT(*) as count
FROM public.lessons 
GROUP BY status;

-- Step 4: Find approved requests without corresponding lessons
SELECT 
    lr.id as request_id,
    lr.tutor_id,
    lr.student_id,
    lr.requested_date,
    lr.requested_start_time,
    lr.status as request_status,
    lr.updated_at as approved_at,
    l.id as lesson_id,
    l.status as lesson_status
FROM public.lesson_requests lr
LEFT JOIN public.lessons l ON (
    l.tutor_id = lr.tutor_id 
    AND l.student_id = lr.student_id 
    AND l.lesson_date = lr.requested_date 
    AND l.start_time = lr.requested_start_time
)
WHERE lr.status = 'approved'
ORDER BY lr.updated_at DESC;

-- Step 5: Test trigger manually (creates a test scenario)
-- This will help us see if the trigger fires
DO $$
DECLARE
    test_request_id UUID;
    test_tutor_id UUID;
    test_student_id UUID;
BEGIN
    -- Get a random user ID for testing (or use your own)
    SELECT id INTO test_tutor_id FROM auth.users LIMIT 1;
    test_student_id := test_tutor_id; -- Using same user as both for testing
    
    IF test_tutor_id IS NOT NULL THEN
        -- Create a test request
        INSERT INTO public.lesson_requests (
            tutor_id, student_id, requested_date, requested_start_time, requested_end_time,
            status, student_message
        ) VALUES (
            test_tutor_id, test_student_id, 
            CURRENT_DATE + INTERVAL '1 day',
            '15:00:00', '15:30:00',
            'pending', 'Test request for trigger debugging'
        ) RETURNING id INTO test_request_id;
        
        RAISE NOTICE 'Created test request: %', test_request_id;
        
        -- Now approve it to trigger the function
        UPDATE public.lesson_requests 
        SET status = 'approved', updated_at = NOW()
        WHERE id = test_request_id;
        
        RAISE NOTICE 'Approved test request: %', test_request_id;
        
        -- Check if lesson was created
        IF EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE tutor_id = test_tutor_id 
            AND student_id = test_student_id 
            AND lesson_date = CURRENT_DATE + INTERVAL '1 day'
            AND start_time = '15:00:00'
        ) THEN
            RAISE NOTICE 'SUCCESS: Trigger created lesson for test request %', test_request_id;
        ELSE
            RAISE WARNING 'FAILED: No lesson created for test request %', test_request_id;
        END IF;
        
    ELSE
        RAISE WARNING 'No users found for testing';
    END IF;
END $$;

-- Step 6: Check RLS policies
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
WHERE tablename = 'lessons';

-- Step 7: Test student lesson functions with a real user
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from auth.users
-- SELECT * FROM public.get_student_lessons_optimized('YOUR_USER_ID_HERE');
-- SELECT * FROM public.get_student_lessons('YOUR_USER_ID_HERE');
