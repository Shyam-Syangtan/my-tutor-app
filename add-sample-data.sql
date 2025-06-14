-- ADD SAMPLE DATA - Run this after fix-database-issues.sql
-- This creates realistic tutor profiles and sample data for testing

-- Clear existing sample data first
DELETE FROM public.tutors WHERE email LIKE '%@example.com';

-- Create realistic tutor profiles
INSERT INTO public.tutors (
    user_id, name, email, bio, languages, specialties, experience_years, 
    rate, rating, total_reviews, photo_url, video_url, tutor_type, status,
    approved, native_language, language, languages_spoken, tags, country_flag, total_students
) VALUES 
(
    gen_random_uuid(),
    'Maria Rodriguez',
    'maria.rodriguez@tutorapp.com',
    'Native Spanish speaker with 8 years of teaching experience. I specialize in conversational Spanish and business communication. My lessons are interactive and tailored to your specific needs.',
    ARRAY['Spanish', 'English'],
    ARRAY['Conversation', 'Business Spanish', 'Grammar'],
    8,
    450.00,
    4.9,
    127,
    'https://ui-avatars.com/api/?name=Maria+Rodriguez&background=e11d48&color=fff&size=150',
    'https://example.com/video-maria',
    'professional',
    'approved',
    true,
    'Spanish',
    'Spanish',
    '[{"language": "Spanish", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}]'::jsonb,
    '["Conversational", "Business Spanish", "Grammar", "Pronunciation"]'::jsonb,
    '🇪🇸',
    89
),
(
    gen_random_uuid(),
    'John Smith',
    'john.smith@tutorapp.com',
    'Certified English teacher with TEFL certification. I help students improve their English for academic and professional purposes. Patient and encouraging teaching style.',
    ARRAY['English'],
    ARRAY['Academic English', 'IELTS Prep', 'Business English'],
    5,
    380.00,
    4.7,
    93,
    'https://ui-avatars.com/api/?name=John+Smith&background=2563eb&color=fff&size=150',
    'https://example.com/video-john',
    'professional',
    'approved',
    true,
    'English',
    'English',
    '[{"language": "English", "proficiency": "Native"}]'::jsonb,
    '["Academic English", "IELTS Prep", "Business English", "Grammar"]'::jsonb,
    '🇺🇸',
    67
),
(
    gen_random_uuid(),
    'Sophie Dubois',
    'sophie.dubois@tutorapp.com',
    'Bonjour! I am a native French speaker from Paris. I love sharing my language and culture with students from around the world. My lessons focus on practical French for everyday situations.',
    ARRAY['French', 'English'],
    ARRAY['Conversation', 'French Culture', 'Pronunciation'],
    6,
    420.00,
    4.8,
    156,
    'https://ui-avatars.com/api/?name=Sophie+Dubois&background=7c3aed&color=fff&size=150',
    'https://example.com/video-sophie',
    'community',
    'approved',
    true,
    'French',
    'French',
    '[{"language": "French", "proficiency": "Native"}, {"language": "English", "proficiency": "Advanced"}]'::jsonb,
    '["Conversational", "French Culture", "Pronunciation", "Travel French"]'::jsonb,
    '🇫🇷',
    112
),
(
    gen_random_uuid(),
    'Hans Mueller',
    'hans.mueller@tutorapp.com',
    'Guten Tag! I am a German language enthusiast with a passion for teaching. I make German grammar easy to understand and focus on building confidence in speaking.',
    ARRAY['German', 'English'],
    ARRAY['Grammar', 'Conversation', 'Business German'],
    4,
    350.00,
    4.6,
    74,
    'https://ui-avatars.com/api/?name=Hans+Mueller&background=059669&color=fff&size=150',
    'https://example.com/video-hans',
    'community',
    'approved',
    true,
    'German',
    'German',
    '[{"language": "German", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}]'::jsonb,
    '["Grammar", "Conversational", "Business German", "Beginner Friendly"]'::jsonb,
    '🇩🇪',
    45
),
(
    gen_random_uuid(),
    'Yuki Tanaka',
    'yuki.tanaka@tutorapp.com',
    'こんにちは! I am a certified Japanese teacher with experience teaching both beginners and advanced students. I use modern teaching methods and focus on practical Japanese.',
    ARRAY['Japanese', 'English'],
    ARRAY['Hiragana/Katakana', 'Conversation', 'Business Japanese'],
    7,
    480.00,
    4.9,
    203,
    'https://ui-avatars.com/api/?name=Yuki+Tanaka&background=dc2626&color=fff&size=150',
    'https://example.com/video-yuki',
    'professional',
    'approved',
    true,
    'Japanese',
    'Japanese',
    '[{"language": "Japanese", "proficiency": "Native"}, {"language": "English", "proficiency": "Advanced"}]'::jsonb,
    '["Hiragana/Katakana", "Conversational", "Business Japanese", "JLPT Prep"]'::jsonb,
    '🇯🇵',
    134
),
(
    gen_random_uuid(),
    'Isabella Costa',
    'isabella.costa@tutorapp.com',
    'Olá! I am from Brazil and love teaching Portuguese to international students. My classes are fun, interactive, and focus on real-world communication skills.',
    ARRAY['Portuguese', 'English', 'Spanish'],
    ARRAY['Conversation', 'Brazilian Culture', 'Grammar'],
    3,
    320.00,
    4.5,
    58,
    'https://ui-avatars.com/api/?name=Isabella+Costa&background=ea580c&color=fff&size=150',
    'https://example.com/video-isabella',
    'community',
    'approved',
    true,
    'Portuguese',
    'Portuguese',
    '[{"language": "Portuguese", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}, {"language": "Spanish", "proficiency": "Advanced"}]'::jsonb,
    '["Conversational", "Brazilian Culture", "Grammar", "Travel Portuguese"]'::jsonb,
    '🇧🇷',
    38
),
(
    gen_random_uuid(),
    'Ahmed Hassan',
    'ahmed.hassan@tutorapp.com',
    'مرحبا! I am a native Arabic speaker with expertise in Modern Standard Arabic and Egyptian dialect. I help students learn Arabic for business, travel, or personal interest.',
    ARRAY['Arabic', 'English'],
    ARRAY['Modern Standard Arabic', 'Egyptian Dialect', 'Business Arabic'],
    9,
    520.00,
    4.8,
    145,
    'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=1d4ed8&color=fff&size=150',
    'https://example.com/video-ahmed',
    'professional',
    'approved',
    true,
    'Arabic',
    'Arabic',
    '[{"language": "Arabic", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}]'::jsonb,
    '["Modern Standard Arabic", "Egyptian Dialect", "Business Arabic", "Quran Reading"]'::jsonb,
    '🇪🇬',
    97
),
(
    gen_random_uuid(),
    'Li Wei',
    'li.wei@tutorapp.com',
    '你好! I am a Mandarin Chinese teacher with HSK certification. I specialize in helping students master Chinese pronunciation and characters. My lessons are structured and effective.',
    ARRAY['Chinese', 'English'],
    ARRAY['HSK Preparation', 'Pronunciation', 'Chinese Characters'],
    6,
    460.00,
    4.7,
    118,
    'https://ui-avatars.com/api/?name=Li+Wei&background=be185d&color=fff&size=150',
    'https://example.com/video-li',
    'professional',
    'approved',
    true,
    'Chinese',
    'Chinese',
    '[{"language": "Chinese", "proficiency": "Native"}, {"language": "English", "proficiency": "Advanced"}]'::jsonb,
    '["HSK Preparation", "Pronunciation", "Chinese Characters", "Business Chinese"]'::jsonb,
    '🇨🇳',
    76
);

-- Create corresponding user profiles for these tutors
INSERT INTO public.users (id, email, full_name, role, raw_user_meta_data)
SELECT 
    t.user_id,
    t.email,
    t.name,
    'tutor',
    jsonb_build_object(
        'full_name', t.name,
        'avatar_url', t.photo_url
    )
FROM public.tutors t
WHERE t.email LIKE '%@tutorapp.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Add some sample reviews for the tutors
INSERT INTO public.reviews (tutor_id, student_id, rating, comment)
SELECT 
    t.id,
    (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),
    (4 + random())::integer,
    CASE 
        WHEN random() < 0.3 THEN 'Excellent teacher! Very patient and helpful.'
        WHEN random() < 0.6 THEN 'Great lessons, I learned a lot. Highly recommended!'
        ELSE 'Professional and knowledgeable. Made learning enjoyable.'
    END
FROM public.tutors t
WHERE t.email LIKE '%@tutorapp.com'
LIMIT 5;

-- Add some sample availability for tutors
INSERT INTO public.tutor_availability (tutor_id, day_of_week, start_time, end_time, is_available)
SELECT 
    t.user_id,
    generate_series % 7,
    ('09:00:00'::time + (generate_series % 3 * interval '2 hours')),
    ('11:00:00'::time + (generate_series % 3 * interval '2 hours')),
    true
FROM public.tutors t
CROSS JOIN generate_series(0, 6)
WHERE t.email LIKE '%@tutorapp.com'
AND generate_series % 2 = 0; -- Only add availability for some time slots

-- Success message
SELECT 'SAMPLE DATA ADDED SUCCESSFULLY!' as status,
       'Added ' || (SELECT COUNT(*) FROM public.tutors WHERE email LIKE '%@tutorapp.com') || ' sample tutors' as tutors_added,
       'Added ' || (SELECT COUNT(*) FROM public.reviews) || ' sample reviews' as reviews_added,
       'Added ' || (SELECT COUNT(*) FROM public.tutor_availability) || ' availability slots' as availability_added;
