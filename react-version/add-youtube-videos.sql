-- Add YouTube video URLs to existing tutors for testing
-- Run this in your Supabase SQL Editor

-- Update some existing tutors with sample YouTube video URLs
-- These are educational/language learning videos for demonstration

-- First, let's see what tutors we have
SELECT id, name, video_url, approved FROM tutors WHERE approved = true ORDER BY name LIMIT 10;

-- Update tutors with different YouTube URL formats for testing
UPDATE tutors
SET video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
WHERE id IN (
    SELECT id FROM tutors
    WHERE approved = true AND video_url IS NULL
    ORDER BY name
    LIMIT 1
);

UPDATE tutors
SET video_url = 'https://youtu.be/dQw4w9WgXcQ'
WHERE id IN (
    SELECT id FROM tutors
    WHERE approved = true AND video_url IS NULL
    ORDER BY name
    LIMIT 1
);

UPDATE tutors
SET video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
WHERE id IN (
    SELECT id FROM tutors
    WHERE approved = true AND video_url IS NULL
    ORDER BY name
    LIMIT 1
);

-- Add a direct video file URL for testing non-YouTube videos
UPDATE tutors
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE id IN (
    SELECT id FROM tutors
    WHERE approved = true AND video_url IS NULL
    ORDER BY name
    LIMIT 1
);

-- Alternative: Update specific tutors by ID (replace with actual IDs from your database)
-- First run: SELECT id, name FROM tutors WHERE approved = true ORDER BY name;
-- Then use the actual IDs below:

-- UPDATE tutors SET video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' WHERE id = 'your-tutor-id-1';
-- UPDATE tutors SET video_url = 'https://youtu.be/dQw4w9WgXcQ' WHERE id = 'your-tutor-id-2';
-- UPDATE tutors SET video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ' WHERE id = 'your-tutor-id-3';

-- Check the results
SELECT name, video_url, approved
FROM tutors
WHERE video_url IS NOT NULL
ORDER BY name;

-- Note: Replace the sample YouTube URLs above with actual educational content URLs
-- The URLs used here are just for testing the video preview functionality

-- Example with real educational YouTube videos (replace the IDs above):
-- 'https://www.youtube.com/watch?v=YQHsXMglC9A' -- English lesson example
-- 'https://youtu.be/VuNIsY6JdUw' -- Language learning example
-- 'https://www.youtube.com/watch?v=3i_HEzPHMOc' -- Teaching example
