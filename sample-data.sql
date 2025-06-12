-- =============================================
-- SAMPLE DATA FOR TUTOR MARKETPLACE
-- =============================================

-- First, clean up any existing sample data to avoid duplicates
DELETE FROM reviews WHERE tutor_id IN (SELECT id FROM tutors WHERE name IN ('Priya Sharma', 'Rajesh Kumar', 'Anita Patel', 'Dr. Suresh Reddy', 'Meera Joshi', 'Arjun Singh'));
DELETE FROM tutor_availability WHERE tutor_id IN (SELECT id FROM tutors WHERE name IN ('Priya Sharma', 'Rajesh Kumar', 'Anita Patel', 'Dr. Suresh Reddy', 'Meera Joshi', 'Arjun Singh'));
DELETE FROM tutors WHERE name IN ('Priya Sharma', 'Rajesh Kumar', 'Anita Patel', 'Dr. Suresh Reddy', 'Meera Joshi', 'Arjun Singh');

-- Insert sample tutors with comprehensive data
-- Include the required 'language' column for existing table structure
INSERT INTO tutors (
    name, language, photo_url, country, country_flag, native_language,
    languages_spoken, bio, bio_headline, rate, rating, total_students,
    total_lessons, video_url, teaching_style, resume, about_me, me_as_teacher,
    tags, is_professional, is_active
) VALUES
(
    'Priya Sharma',
    'Hindi',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    'India',
    '🇮🇳',
    'Hindi',
    '[{"language": "Hindi", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}, {"language": "Punjabi", "proficiency": "Conversational"}]'::jsonb,
    'Experienced Hindi teacher with 8+ years of teaching experience. Specializes in conversational Hindi and business communication. Patient and encouraging teaching style.',
    'Professional Hindi teacher specializing in conversational skills',
    450.00,
    4.9,
    156,
    1240,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'I believe in making learning fun and interactive. My classes are conversation-focused with practical examples from daily life. I use multimedia resources and cultural context to make lessons engaging.',
    'M.A. in Hindi Literature from Delhi University. 8+ years teaching experience. Certified language instructor. Previously worked at language institutes in Delhi and Mumbai.',
    'Namaste! I am Priya, a passionate Hindi teacher from Delhi. I love sharing the beauty of Hindi language and Indian culture with students worldwide. My goal is to make you confident in speaking Hindi naturally.',
    'As your teacher, I focus on building your confidence first. I create a supportive environment where making mistakes is part of learning. I adapt my teaching style to match your learning pace and goals.',
    '["Conversational", "Business Hindi", "Grammar", "Cultural Context", "Beginner Friendly"]'::jsonb,
    true,
    true
),
(
    'Rajesh Kumar',
    'Tamil',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'India',
    '🇮🇳',
    'Tamil',
    '[{"language": "Tamil", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}, {"language": "Hindi", "proficiency": "Intermediate"}]'::jsonb,
    'Native Tamil speaker from Chennai with expertise in classical Tamil literature and modern conversational Tamil. Perfect for beginners and advanced learners.',
    'Expert Tamil teacher with classical literature background',
    380.00,
    4.8,
    89,
    670,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'My teaching combines traditional Tamil literature with modern conversational practice. I use stories, songs, and cultural examples to make learning memorable and enjoyable.',
    'B.A. Tamil Literature, M.A. Linguistics. 6 years teaching experience. Specialized in classical Tamil texts and modern conversation.',
    'Vanakkam! I am Rajesh from Chennai. Tamil is not just a language for me, it''s my heritage. I love helping students discover the richness of Tamil culture through language learning.',
    'I believe every student learns differently. I customize my lessons based on your interests - whether it''s Tamil cinema, literature, or business communication. My classes are interactive and culturally rich.',
    '["Classical Tamil", "Conversational", "Literature", "Cultural Studies", "Script Writing"]'::jsonb,
    true,
    true
),
(
    'Anita Patel',
    'Gujarati',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    'India',
    '🇮🇳',
    'Gujarati',
    '[{"language": "Gujarati", "proficiency": "Native"}, {"language": "Hindi", "proficiency": "Fluent"}, {"language": "English", "proficiency": "Fluent"}]'::jsonb,
    'Enthusiastic Gujarati teacher from Ahmedabad. Specializes in business Gujarati and cultural immersion. Makes learning fun with games and real-life scenarios.',
    'Fun and engaging Gujarati teacher for all levels',
    320.00,
    4.7,
    67,
    450,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'Learning should be enjoyable! I use games, role-plays, and real-life scenarios to teach Gujarati. My students love the interactive approach and cultural insights I share.',
    'B.Com from Gujarat University. 4 years teaching experience. Specialized in business communication and cultural studies.',
    'Kem cho! I am Anita from Ahmedabad. I love my vibrant Gujarati culture and enjoy sharing it with students. Food, festivals, and family - we''ll learn Gujarati through all of these!',
    'I make learning personal and relevant. Whether you want to connect with Gujarati family members or do business in Gujarat, I''ll help you achieve your goals with confidence and joy.',
    '["Business Gujarati", "Cultural Immersion", "Family Communication", "Beginner Friendly", "Interactive Learning"]'::jsonb,
    false,
    true
),
(
    'Dr. Suresh Reddy',
    'Telugu',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'India',
    '🇮🇳',
    'Telugu',
    '[{"language": "Telugu", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}, {"language": "Hindi", "proficiency": "Intermediate"}]'::jsonb,
    'PhD in Telugu Literature with 12+ years of teaching experience. Expert in classical Telugu poetry and modern conversation. Academic approach with practical applications.',
    'PhD Telugu expert with academic and practical expertise',
    520.00,
    4.9,
    203,
    1580,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'I combine academic rigor with practical application. My lessons include classical literature appreciation alongside modern conversational skills. Perfect for serious learners.',
    'PhD in Telugu Literature from Osmania University. 12+ years university teaching experience. Published researcher in classical Telugu poetry.',
    'Namaskaram! I am Dr. Suresh from Hyderabad. Telugu literature is my passion, and I love sharing the depth and beauty of our language with dedicated students worldwide.',
    'As an academic, I bring structured learning with deep cultural insights. I help students appreciate not just the language, but the rich literary tradition of Telugu.',
    '["Academic Telugu", "Classical Literature", "Poetry", "Advanced Grammar", "Research Methods"]'::jsonb,
    true,
    true
),
(
    'Meera Joshi',
    'Marathi',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    'India',
    '🇮🇳',
    'Marathi',
    '[{"language": "Marathi", "proficiency": "Native"}, {"language": "Hindi", "proficiency": "Fluent"}, {"language": "English", "proficiency": "Fluent"}]'::jsonb,
    'Passionate Marathi teacher from Pune with a focus on conversational skills and cultural understanding. Great for beginners wanting to connect with Maharashtra.',
    'Passionate Marathi teacher focusing on culture and conversation',
    350.00,
    4.6,
    45,
    320,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'I focus on practical Marathi that you can use immediately. My lessons include cultural context, local expressions, and real-life conversations that make learning meaningful.',
    'M.A. Marathi Literature from Pune University. 5 years teaching experience. Cultural enthusiast and language preservation advocate.',
    'Namaskar! I am Meera from Pune. Marathi is the language of my heart, and I love helping students discover the warmth and richness of Marathi culture.',
    'I believe language learning is cultural learning. Through Marathi, you''ll discover Maharashtra''s festivals, food, and traditions. My classes are warm, welcoming, and culturally rich.',
    '["Cultural Marathi", "Conversational", "Local Expressions", "Beginner Friendly", "Cultural Studies"]'::jsonb,
    false,
    true
),
(
    'Arjun Singh',
    'Punjabi',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'India',
    '🇮🇳',
    'Punjabi',
    '[{"language": "Punjabi", "proficiency": "Native"}, {"language": "Hindi", "proficiency": "Fluent"}, {"language": "English", "proficiency": "Fluent"}]'::jsonb,
    'Energetic Punjabi teacher from Amritsar. Specializes in Gurmukhi script and Sikh cultural context. Makes learning lively with music and storytelling.',
    'Energetic Punjabi teacher with cultural and musical approach',
    400.00,
    4.8,
    78,
    590,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'Punjabi is a language of celebration! I teach through music, stories, and cultural celebrations. My classes are energetic and filled with the joy of Punjabi culture.',
    'B.A. Punjabi Literature from Guru Nanak Dev University. 6 years teaching experience. Cultural performer and storyteller.',
    'Sat Sri Akal! I am Arjun from Amritsar. Punjabi is not just my language, it''s my celebration of life. Let me share the joy and energy of Punjab with you!',
    'I bring the spirit of Punjab into every lesson. Whether learning Gurmukhi script or conversational Punjabi, my classes are filled with music, stories, and cultural pride.',
    '["Gurmukhi Script", "Cultural Punjabi", "Music Integration", "Storytelling", "Religious Context"]'::jsonb,
    false,
    true
);

-- Insert sample availability for tutors (showing different time slots)
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
SELECT
    t.id,
    generate_series(1, 5) as day_of_week, -- Monday to Friday
    '09:00'::time,
    '17:00'::time
FROM tutors t;

-- Insert some weekend availability for some tutors
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
SELECT
    t.id,
    6 as day_of_week, -- Saturday
    '10:00'::time,
    '15:00'::time
FROM tutors t
WHERE t.name IN ('Priya Sharma', 'Dr. Suresh Reddy', 'Arjun Singh');

-- Insert sample reviews
-- Note: You'll need to replace these student_id values with actual student UUIDs from your students table
INSERT INTO reviews (tutor_id, student_id, rating, comment) VALUES
((SELECT id FROM tutors WHERE name = 'Priya Sharma' LIMIT 1),
 '00000000-0000-0000-0000-000000000001'::uuid,
 5,
 'Priya is an excellent teacher! Her lessons are well-structured and she makes Hindi grammar easy to understand. Highly recommended!'),

((SELECT id FROM tutors WHERE name = 'Priya Sharma' LIMIT 1),
 '00000000-0000-0000-0000-000000000002'::uuid,
 5,
 'Amazing teacher! I went from knowing no Hindi to having basic conversations in just 2 months. Priya is patient and encouraging.'),

((SELECT id FROM tutors WHERE name = 'Rajesh Kumar' LIMIT 1),
 '00000000-0000-0000-0000-000000000001'::uuid,
 5,
 'Rajesh brings Tamil literature to life! His cultural insights make learning so much more meaningful.'),

((SELECT id FROM tutors WHERE name = 'Dr. Suresh Reddy' LIMIT 1),
 '00000000-0000-0000-0000-000000000003'::uuid,
 5,
 'Dr. Reddy is incredibly knowledgeable. His academic approach really helped me understand Telugu grammar deeply.'),

((SELECT id FROM tutors WHERE name = 'Anita Patel' LIMIT 1),
 '00000000-0000-0000-0000-000000000002'::uuid,
 4,
 'Anita makes learning Gujarati so fun! Her games and activities keep me engaged throughout the lesson.');