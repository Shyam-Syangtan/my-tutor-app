-- =====================================================
-- COMPLETE MESSAGING SYSTEM FIX
-- Run this script in Supabase SQL Editor to fix all messaging issues
-- =====================================================

-- 1. Ensure chats table exists with correct structure
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id UUID,
    UNIQUE(user1_id, user2_id)
);

-- 2. Ensure messages table exists with correct structure
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create unread_messages table for tracking unread counts
CREATE TABLE IF NOT EXISTS public.unread_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chat_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user1 ON public.chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2 ON public.chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_unread_user_chat ON public.unread_messages(user_id, chat_id);

-- 5. Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unread_messages ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their unread counts" ON public.unread_messages;
DROP POLICY IF EXISTS "Users can manage their unread counts" ON public.unread_messages;

-- 7. Create comprehensive RLS policies for chats table
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (
        auth.uid() = user1_id OR auth.uid() = user2_id
    );

CREATE POLICY "Users can create chats" ON public.chats
    FOR INSERT WITH CHECK (
        auth.uid() = user1_id OR auth.uid() = user2_id
    );

CREATE POLICY "Users can update their own chats" ON public.chats
    FOR UPDATE USING (
        auth.uid() = user1_id OR auth.uid() = user2_id
    );

-- 8. Create comprehensive RLS policies for messages table
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can create messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id OR
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
        )
    );

-- 9. Create RLS policies for unread_messages table
CREATE POLICY "Users can view their unread counts" ON public.unread_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their unread counts" ON public.unread_messages
    FOR ALL USING (auth.uid() = user_id);

-- 10. Enable Realtime for all messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unread_messages;

-- 11. Grant necessary permissions
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.unread_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT SELECT ON public.chats TO authenticated;
GRANT SELECT ON public.unread_messages TO authenticated;

-- 12. Create function to update chat timestamp and unread counts
CREATE OR REPLACE FUNCTION update_chat_and_unread()
RETURNS TRIGGER AS $$
DECLARE
    other_user_id UUID;
BEGIN
    -- Update chat timestamp
    UPDATE public.chats 
    SET updated_at = NOW(), last_message_id = NEW.id
    WHERE id = NEW.chat_id;
    
    -- Get the other user in the chat
    SELECT CASE 
        WHEN user1_id = NEW.sender_id THEN user2_id 
        ELSE user1_id 
    END INTO other_user_id
    FROM public.chats 
    WHERE id = NEW.chat_id;
    
    -- Update unread count for the other user
    INSERT INTO public.unread_messages (user_id, chat_id, unread_count)
    VALUES (other_user_id, NEW.chat_id, 1)
    ON CONFLICT (user_id, chat_id) 
    DO UPDATE SET 
        unread_count = unread_messages.unread_count + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create trigger to automatically update chat and unread counts
DROP TRIGGER IF EXISTS update_chat_and_unread_trigger ON public.messages;
CREATE TRIGGER update_chat_and_unread_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_and_unread();

-- 14. Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_chat_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Mark messages as read
    UPDATE public.messages 
    SET is_read = TRUE 
    WHERE chat_id = p_chat_id 
    AND sender_id != p_user_id 
    AND is_read = FALSE;
    
    -- Reset unread count
    UPDATE public.unread_messages 
    SET unread_count = 0, last_read_at = NOW()
    WHERE chat_id = p_chat_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to get user's total unread count
CREATE OR REPLACE FUNCTION get_user_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_unread INTEGER;
BEGIN
    SELECT COALESCE(SUM(unread_count), 0) INTO total_unread
    FROM public.unread_messages
    WHERE user_id = p_user_id;
    
    RETURN total_unread;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unread_count(UUID) TO authenticated;

-- 17. Create sample data for testing (optional)
-- Uncomment to create test data:
-- INSERT INTO public.chats (user1_id, user2_id) 
-- SELECT u1.id, u2.id 
-- FROM auth.users u1, auth.users u2 
-- WHERE u1.id != u2.id 
-- LIMIT 1
-- ON CONFLICT DO NOTHING;

-- 18. Verification and success message
SELECT 'Messaging system setup completed successfully!' as status;

-- Show table counts
SELECT 
    'chats' as table_name, 
    COUNT(*) as record_count 
FROM public.chats
UNION ALL
SELECT 
    'messages' as table_name, 
    COUNT(*) as record_count 
FROM public.messages
UNION ALL
SELECT 
    'unread_messages' as table_name, 
    COUNT(*) as record_count 
FROM public.unread_messages;
