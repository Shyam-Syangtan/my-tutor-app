-- Quick SQL to populate tutors table with sample data for testing
-- Run this in your Supabase SQL Editor

-- First, let's make sure we have the required columns
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS native_language TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bio_headline TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS country_flag TEXT DEFAULT '🇮🇳';
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT false;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS teaching_style TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS resume TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS about_me TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS me_as_teacher TEXT;

-- Update existing tutors with missing data
UPDATE tutors SET 
    native_language = COALESCE(native_language, language),
    bio_headline = COALESCE(bio_headline, language || ' Teacher'),
    country = COALESCE(country, 'India'),
    country_flag = COALESCE(country_flag, '🇮🇳'),
    total_students = COALESCE(total_students, FLOOR(RANDOM() * 100 + 20)::int),
    total_lessons = COALESCE(total_lessons, FLOOR(RANDOM() * 500 + 100)::int),
    languages_spoken = COALESCE(languages_spoken, ('[{"language": "' || language || '", "proficiency": "Native"}]')::jsonb),
    bio = COALESCE(bio, 'Experienced ' || language || ' teacher with years of teaching experience.'),
    tags = COALESCE(tags, '["Conversational", "Grammar", "Beginner Friendly"]'::jsonb),
    is_professional = COALESCE(is_professional, (RANDOM() > 0.5)),
    is_active = COALESCE(is_active, true),
    video_url = COALESCE(video_url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    teaching_style = COALESCE(teaching_style, 'Interactive and student-centered approach focusing on practical communication skills.'),
    resume = COALESCE(resume, 'Bachelor''s degree in ' || language || ' Literature. Certified language teacher with 5+ years of experience.'),
    about_me = COALESCE(about_me, 'I have many interests and hobbies, such as playing basketball, playing ping-pong, traveling, watching movies. I am passionate about teaching and helping students achieve their language learning goals.'),
    me_as_teacher = COALESCE(me_as_teacher, 'I have been teaching ' || language || ' for over 5 years. I am patient, friendly, and passionate about helping students achieve their language learning goals.');

-- Insert a few sample tutors if the table is empty
INSERT INTO tutors (
    name, language, photo_url, country, country_flag, native_language,
    languages_spoken, bio, bio_headline, rate, rating, total_students,
    total_lessons, video_url, teaching_style, resume, about_me, me_as_teacher,
    tags, is_professional, is_active
) 
SELECT * FROM (VALUES
    (
        'Dan Chen',
        'Chinese (Mandarin)',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        'China',
        '🇨🇳',
        'Chinese (Mandarin)',
        '[{"language": "Chinese (Mandarin)", "proficiency": "Native"}, {"language": "English", "proficiency": "Fluent"}, {"language": "Korean", "proficiency": "Intermediate"}]'::jsonb,
        'Beginner - Advanced, Conversation, HSK, Business Chinese, The Writer of www.thechairmansbao.com',
        'Professional Chinese Teacher',
        12.00,
        5.0,
        723,
        9481,
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'I focus on practical communication skills and tailor my lessons to each student''s needs and interests. My classes are always efficient, as I focus on the key points without wasting any time.',
        'Bachelor''s degree in Chinese Literature. Certified HSK instructor with 8+ years of experience. Writer for The Chairman''s Bao.',
        'I have many interests and hobbies, such as playing basketball, playing ping-pong, traveling, watching NBA. I am a super fan of NBA. I went to America in March 2017, and stayed there for half a year. During this half a year, I visited many places in America, like Texas, Utah, Los Angeles, Las Vegas, Yellow Stone National Park, Grand Canyon. I like to talk about many different topics, such as travel, sports, movies, music, food, culture, business, etc.',
        'I have been teaching Chinese for over 8 years. I am patient, friendly, and passionate about helping students achieve their language learning goals. I specialize in HSK preparation and business Chinese.',
        '["Business Chinese", "HSK Preparation", "Conversational", "Grammar", "Beginner Friendly"]'::jsonb,
        true,
        true
    )
) AS new_tutors(name, language, photo_url, country, country_flag, native_language, languages_spoken, bio, bio_headline, rate, rating, total_students, total_lessons, video_url, teaching_style, resume, about_me, me_as_teacher, tags, is_professional, is_active)
WHERE NOT EXISTS (SELECT 1 FROM tutors WHERE name = 'Dan Chen');
