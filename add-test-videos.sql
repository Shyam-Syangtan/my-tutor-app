-- Add test video URLs to existing tutors for debugging video functionality
-- These are publicly available test videos that should work for testing

-- Update first tutor with a test video
UPDATE tutors 
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE id = (SELECT id FROM tutors ORDER BY created_at LIMIT 1);

-- Update second tutor with another test video
UPDATE tutors 
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
WHERE id = (SELECT id FROM tutors ORDER BY created_at LIMIT 1 OFFSET 1);

-- Update third tutor with another test video
UPDATE tutors 
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
WHERE id = (SELECT id FROM tutors ORDER BY created_at LIMIT 1 OFFSET 2);

-- Check the results
SELECT id, name, video_url FROM tutors WHERE video_url IS NOT NULL;
