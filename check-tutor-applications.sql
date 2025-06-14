-- CHECK TUTOR APPLICATIONS - View current state of real tutor applications
-- Run this to see what real tutor applications exist in your system

-- 1. Show all tutor applications with their status
SELECT 
    t.id,
    t.name,
    t.email,
    t.approved,
    t.tutor_type,
    t.native_language,
    t.experience,
    t.rate,
    t.created_at,
    u.email as user_email
FROM public.tutors t
LEFT JOIN auth.users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- 2. Show summary statistics
SELECT 
    'TUTOR APPLICATION SUMMARY' as report_type,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE approved = true) as approved_tutors,
    COUNT(*) FILTER (WHERE approved = false) as pending_applications,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as applications_this_week,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as applications_this_month
FROM public.tutors;

-- 3. Show pending applications that need admin review
SELECT 
    'PENDING APPLICATIONS FOR REVIEW' as section,
    t.id,
    t.name,
    t.email,
    t.tutor_type,
    t.native_language,
    t.experience,
    t.bio,
    t.video_url,
    t.created_at,
    'Review and approve in Supabase Table Editor' as action_needed
FROM public.tutors t
WHERE approved = false
ORDER BY t.created_at ASC;

-- 4. Show approved tutors currently visible on Find Tutors page
SELECT 
    'APPROVED TUTORS (VISIBLE ON FIND TUTORS)' as section,
    t.id,
    t.name,
    t.email,
    t.native_language,
    t.rate,
    t.rating,
    t.total_reviews,
    t.created_at
FROM public.tutors t
WHERE approved = true
ORDER BY t.created_at DESC;

-- 5. Check for any data inconsistencies
SELECT 
    'DATA CONSISTENCY CHECK' as section,
    COUNT(*) FILTER (WHERE user_id IS NULL) as tutors_without_user_id,
    COUNT(*) FILTER (WHERE name IS NULL OR name = '') as tutors_without_name,
    COUNT(*) FILTER (WHERE email IS NULL OR email = '') as tutors_without_email,
    COUNT(*) FILTER (WHERE approved IS NULL) as tutors_without_approval_status
FROM public.tutors;

-- 6. Show recent user registrations (potential tutor applicants)
SELECT 
    'RECENT USER REGISTRATIONS' as section,
    u.id,
    u.email,
    u.created_at,
    CASE 
        WHEN t.user_id IS NOT NULL THEN 'Has tutor application'
        ELSE 'No tutor application yet'
    END as tutor_status
FROM auth.users u
LEFT JOIN public.tutors t ON u.id = t.user_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC
LIMIT 10;

-- 7. Instructions for admin actions
SELECT 
    'ADMIN INSTRUCTIONS' as section,
    'To approve a tutor application:' as step_1,
    '1. Go to Supabase Dashboard → Table Editor → tutors' as step_2,
    '2. Find the application with approved = false' as step_3,
    '3. Review their details (name, bio, experience, video_url)' as step_4,
    '4. Change approved from false to true' as step_5,
    '5. Save changes - tutor will appear on Find Tutors page' as step_6;
