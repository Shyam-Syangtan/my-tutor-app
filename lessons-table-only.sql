-- LESSONS TABLE STRUCTURE ONLY - Clear view of lessons table

SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
ORDER BY ordinal_position;
