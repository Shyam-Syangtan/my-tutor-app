-- Add sample video URLs to existing tutors for testing
-- Run this in your Supabase SQL Editor

-- First, let's see what tutors we have
SELECT id, name, video_url FROM public.tutors WHERE approved = true LIMIT 10;

-- Add sample video URLs to existing tutors
-- Using a mix of YouTube videos and direct video files for testing

UPDATE public.tutors 
SET video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
WHERE name ILIKE '%john%' OR name ILIKE '%sarah%' OR name ILIKE '%mike%';

UPDATE public.tutors 
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE name ILIKE '%anna%' OR name ILIKE '%david%' OR name ILIKE '%lisa%';

UPDATE public.tutors 
SET video_url = 'https://www.youtube.com/watch?v=M7lc1UVf-VE'
WHERE name ILIKE '%maria%' OR name ILIKE '%alex%' OR name ILIKE '%emma%';

UPDATE public.tutors 
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
WHERE name ILIKE '%robert%' OR name ILIKE '%jennifer%' OR name ILIKE '%chris%';

-- If no tutors match the above names, update the first few tutors
UPDATE public.tutors 
SET video_url = CASE 
    WHEN id = (SELECT id FROM public.tutors WHERE approved = true ORDER BY created_at LIMIT 1 OFFSET 0) 
        THEN 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    WHEN id = (SELECT id FROM public.tutors WHERE approved = true ORDER BY created_at LIMIT 1 OFFSET 1) 
        THEN 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    WHEN id = (SELECT id FROM public.tutors WHERE approved = true ORDER BY created_at LIMIT 1 OFFSET 2) 
        THEN 'https://www.youtube.com/watch?v=M7lc1UVf-VE'
    WHEN id = (SELECT id FROM public.tutors WHERE approved = true ORDER BY created_at LIMIT 1 OFFSET 3) 
        THEN 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ELSE video_url
END
WHERE approved = true AND video_url IS NULL;

-- Verify the updates
SELECT id, name, video_url FROM public.tutors WHERE video_url IS NOT NULL LIMIT 10;

-- Count tutors with videos
SELECT 
    COUNT(*) as total_tutors,
    COUNT(video_url) as tutors_with_videos,
    COUNT(*) - COUNT(video_url) as tutors_without_videos
FROM public.tutors 
WHERE approved = true;
