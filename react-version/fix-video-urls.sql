-- Fix video URLs with known embeddable videos
-- Run this in your Supabase SQL Editor

-- First, let's see what tutors we have
SELECT id, name, video_url, approved FROM tutors WHERE approved = true ORDER BY name LIMIT 10;

-- Update with a known embeddable YouTube video (Big Buck Bunny trailer)
-- This video is known to allow embedding
UPDATE tutors
SET video_url = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
WHERE id IN (
    SELECT id FROM tutors
    WHERE approved = true
    ORDER BY name
    LIMIT 1
);

-- Add a direct MP4 video for testing
UPDATE tutors
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE id IN (
    SELECT id FROM tutors
    WHERE approved = true AND video_url IS NULL
    ORDER BY name
    LIMIT 1
);

-- Add another embeddable YouTube video (Sintel trailer)
UPDATE tutors
SET video_url = 'https://www.youtube.com/watch?v=eRsGyueVLvQ'
WHERE id IN (
    SELECT id FROM tutors
    WHERE approved = true AND video_url IS NULL
    ORDER BY name
    LIMIT 1
);

-- Check the results
SELECT name, video_url, approved
FROM tutors
WHERE video_url IS NOT NULL
ORDER BY name;
