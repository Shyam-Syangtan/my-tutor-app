-- Enhanced Messaging System Database Schema
-- IMPORTANT: Run complete-database-setup.sql FIRST before running this file!

-- 1. Create typing_indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- 2. Create message_status table for delivery/read receipts
CREATE TABLE IF NOT EXISTS public.message_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id)
);

-- 3. Add file support columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 4. Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- 5. Create chat_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.chat_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chat_id)
);

-- 6. Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Set up Row Level Security (RLS) policies

-- Typing indicators policies
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing indicators in their chats" ON public.typing_indicators
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM public.chats
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own typing indicators" ON public.typing_indicators
    FOR ALL USING (user_id = auth.uid());

-- Message status policies
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

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

-- Message reactions policies
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

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

-- Chat settings policies
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat settings" ON public.chat_settings
    FOR ALL USING (user_id = auth.uid());

-- Storage policies for chat files
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
                SELECT 1 FROM messages m
                JOIN chats c ON m.chat_id = c.id
                WHERE m.file_url LIKE '%' || name || '%'
                AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
            )
        )
    );

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_chat_user ON public.typing_indicators(chat_id, user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated ON public.typing_indicators(updated_at);
CREATE INDEX IF NOT EXISTS idx_message_status_message ON public.message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_user_chat ON public.chat_settings(user_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_file_url ON public.messages(file_url) WHERE file_url IS NOT NULL;

-- 9. Create functions for enhanced messaging

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM public.typing_indicators
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID, chat_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    last_seen_time TIMESTAMP WITH TIME ZONE;
    unread_count INTEGER;
BEGIN
    -- Get user's last seen time for this chat
    SELECT last_seen INTO last_seen_time
    FROM public.chat_settings
    WHERE user_id = user_uuid AND chat_id = chat_uuid;

    -- If no last seen time, use chat creation time
    IF last_seen_time IS NULL THEN
        SELECT created_at INTO last_seen_time
        FROM public.chats
        WHERE id = chat_uuid;
    END IF;

    -- Count unread messages
    SELECT COUNT(*) INTO unread_count
    FROM public.messages
    WHERE chat_id = chat_uuid
    AND sender_id != user_uuid
    AND created_at > last_seen_time;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(user_uuid UUID, chat_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Update last seen time
    INSERT INTO public.chat_settings (user_id, chat_id, last_seen, updated_at)
    VALUES (user_uuid, chat_uuid, NOW(), NOW())
    ON CONFLICT (user_id, chat_id)
    DO UPDATE SET last_seen = NOW(), updated_at = NOW();

    -- Update message status to read for messages sent by other user
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

-- 10. Create triggers for automatic cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_typing_indicators()
RETURNS trigger AS $$
BEGIN
    -- Clean up old typing indicators when new ones are inserted
    PERFORM cleanup_old_typing_indicators();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_typing_indicators_trigger
    AFTER INSERT ON public.typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_typing_indicators();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced messaging schema created successfully!';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '- Typing indicators';
    RAISE NOTICE '- Message status tracking (sent/delivered/read)';
    RAISE NOTICE '- File sharing support';
    RAISE NOTICE '- Message reactions';
    RAISE NOTICE '- Chat settings and preferences';
    RAISE NOTICE '- Automatic cleanup functions';
    RAISE NOTICE '- Performance indexes';
    RAISE NOTICE 'Ready for enhanced messaging features!';
END $$;
