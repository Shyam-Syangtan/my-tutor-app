-- Add YouTube video URLs to existing tutors for testing
-- Run this in your Supabase SQL Editor

-- Update some existing tutors with sample YouTube video URLs
-- These are educational/language learning videos for demonstration

UPDATE tutors 
SET video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
WHERE name ILIKE '%john%' OR name ILIKE '%sarah%' OR name ILIKE '%maria%'
LIMIT 1;

UPDATE tutors 
SET video_url = 'https://youtu.be/dQw4w9WgXcQ'
WHERE name ILIKE '%david%' OR name ILIKE '%anna%' OR name ILIKE '%carlos%'
AND video_url IS NULL
LIMIT 1;

UPDATE tutors 
SET video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
WHERE name ILIKE '%lisa%' OR name ILIKE '%ahmed%' OR name ILIKE '%priya%'
AND video_url IS NULL
LIMIT 1;

-- Add a direct video file URL for testing non-YouTube videos
UPDATE tutors 
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE name ILIKE '%michael%' OR name ILIKE '%elena%' OR name ILIKE '%raj%'
AND video_url IS NULL
LIMIT 1;

-- Check the results
SELECT name, video_url, approved 
FROM tutors 
WHERE video_url IS NOT NULL 
ORDER BY name;

-- Note: Replace the sample YouTube URLs above with actual educational content URLs
-- The URLs used here are just for testing the video preview functionality
