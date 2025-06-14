-- ADD POLICIES AND FUNCTIONS - RUN AFTER clean-database-setup.sql
-- This script adds all RLS policies, indexes, and functions

-- Step 1: Create RLS policies for base tables
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view tutors" ON public.tutors
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own tutor profile" ON public.tutors
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own student profile" ON public.students
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can create chats they participate in" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can update their own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM public.chats 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        chat_id IN (
            SELECT id FROM public.chats 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Students can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Anyone can view tutor availability" ON public.tutor_availability
    FOR SELECT USING (true);

CREATE POLICY "Tutors can manage their own availability" ON public.tutor_availability
    FOR ALL USING (auth.uid() = tutor_id);

CREATE POLICY "Users can view their own lessons" ON public.lessons
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can manage their own lessons" ON public.lessons
    FOR ALL USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Users can view their own lesson requests" ON public.lesson_requests
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Students can create lesson requests" ON public.lesson_requests
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own lesson requests" ON public.lesson_requests
    FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Step 2: Create RLS policies for enhanced messaging tables
CREATE POLICY "Users can view typing indicators in their chats" ON public.typing_indicators
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM public.chats 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own typing indicators" ON public.typing_indicators
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view message status for their messages" ON public.message_status
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM public.messages m
            JOIN public.chats c ON m.chat_id = c.id
            WHERE c.student_id = auth.uid() OR c.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update message status" ON public.message_status
    FOR ALL USING (
        message_id IN (
            SELECT m.id FROM public.messages m
            JOIN public.chats c ON m.chat_id = c.id
            WHERE c.student_id = auth.uid() OR c.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can view reactions in their chats" ON public.message_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM public.messages m
            JOIN public.chats c ON m.chat_id = c.id
            WHERE c.student_id = auth.uid() OR c.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own reactions" ON public.message_reactions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own chat settings" ON public.chat_settings
    FOR ALL USING (user_id = auth.uid());

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON public.chats(student_id, tutor_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor_id ON public.reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor ON public.tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_participants ON public.lessons(student_id, tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_tutor ON public.lesson_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_chat_user ON public.typing_indicators(chat_id, user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated ON public.typing_indicators(updated_at);
CREATE INDEX IF NOT EXISTS idx_message_status_message ON public.message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_user_chat ON public.chat_settings(user_id, chat_id);

-- Step 4: Create helper functions
CREATE OR REPLACE FUNCTION create_chat(student_uuid UUID, tutor_uuid UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    SELECT id INTO chat_id
    FROM public.chats
    WHERE student_id = student_uuid AND tutor_id = tutor_uuid;
    
    IF chat_id IS NULL THEN
        INSERT INTO public.chats (student_id, tutor_id)
        VALUES (student_uuid, tutor_uuid)
        RETURNING id INTO chat_id;
    END IF;
    
    RETURN chat_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID, chat_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    last_seen_time TIMESTAMP WITH TIME ZONE;
    unread_count INTEGER;
BEGIN
    SELECT last_seen INTO last_seen_time
    FROM public.chat_settings
    WHERE user_id = user_uuid AND chat_id = chat_uuid;
    
    IF last_seen_time IS NULL THEN
        SELECT created_at INTO last_seen_time
        FROM public.chats
        WHERE id = chat_uuid;
    END IF;
    
    SELECT COUNT(*) INTO unread_count
    FROM public.messages
    WHERE chat_id = chat_uuid
    AND sender_id != user_uuid
    AND created_at > last_seen_time;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_messages_as_read(user_uuid UUID, chat_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.chat_settings (user_id, chat_id, last_seen, updated_at)
    VALUES (user_uuid, chat_uuid, NOW(), NOW())
    ON CONFLICT (user_id, chat_id)
    DO UPDATE SET last_seen = NOW(), updated_at = NOW();
    
    INSERT INTO public.message_status (message_id, status, updated_at)
    SELECT m.id, 'read', NOW()
    FROM public.messages m
    WHERE m.chat_id = chat_uuid
    AND m.sender_id != user_uuid
    AND NOT EXISTS (
        SELECT 1 FROM public.message_status ms 
        WHERE ms.message_id = m.id AND ms.status = 'read'
    )
    ON CONFLICT (message_id)
    DO UPDATE SET status = 'read', updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM public.typing_indicators 
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create storage policies
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view files in chats they participate in" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chat-files' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.messages m
                JOIN public.chats c ON m.chat_id = c.id
                WHERE m.file_url LIKE '%' || name || '%'
                AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
            )
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'POLICIES AND FUNCTIONS SETUP COMPLETED!';
    RAISE NOTICE 'All RLS policies created (base + enhanced messaging)';
    RAISE NOTICE 'All performance indexes created';
    RAISE NOTICE 'All helper functions created';
    RAISE NOTICE 'Storage bucket and policies created';
    RAISE NOTICE 'DATABASE SETUP 100 PERCENT COMPLETE!';
    RAISE NOTICE 'Ready to test enhanced messaging system!';
END $$;
