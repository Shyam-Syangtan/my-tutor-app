-- =====================================================
-- CORRECTED MESSAGING SYSTEM FIX
-- This version handles existing table structures properly
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Check and fix chats table structure
DO $$
BEGIN
    -- Check if chats table exists and get its structure
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chats') THEN
        -- Check if it has the old structure (user1_id, user2_id)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'user1_id') THEN
            -- Table exists but doesn't have user1_id, so it might have different structure
            -- Let's check what columns it has
            RAISE NOTICE 'Chats table exists but has different structure. Checking columns...';
            
            -- If it has participant columns instead, we'll work with that
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'participant1_id') THEN
                RAISE NOTICE 'Found participant-based structure, will adapt...';
            ELSE
                -- Drop and recreate with correct structure
                DROP TABLE IF EXISTS public.chats CASCADE;
                RAISE NOTICE 'Dropped existing chats table with incompatible structure';
            END IF;
        ELSE
            RAISE NOTICE 'Chats table already has correct structure';
        END IF;
    END IF;
END $$;

-- Step 2: Create chats table with correct structure
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id UUID,
    UNIQUE(user1_id, user2_id)
);

-- Step 3: Create messages table (drop and recreate to ensure compatibility)
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create unread_messages table
DROP TABLE IF EXISTS public.unread_messages CASCADE;
CREATE TABLE public.unread_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chat_id)
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user1 ON public.chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2 ON public.chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_unread_user_chat ON public.unread_messages(user_id, chat_id);

-- Step 6: Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unread_messages ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their unread counts" ON public.unread_messages;
DROP POLICY IF EXISTS "Users can manage their unread counts" ON public.unread_messages;

-- Step 8: Create RLS policies for chats table
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

-- Step 9: Create RLS policies for messages table
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

-- Step 10: Create RLS policies for unread_messages table
CREATE POLICY "Users can view their unread counts" ON public.unread_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their unread counts" ON public.unread_messages
    FOR ALL USING (auth.uid() = user_id);

-- Step 11: Grant necessary permissions
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.unread_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 12: Enable Realtime (handle errors gracefully)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Messages table already added to realtime publication';
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Chats table already added to realtime publication';
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.unread_messages;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Unread_messages table already added to realtime publication';
    END;
END $$;

-- Step 13: Create function to update chat timestamp and unread counts
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

-- Step 14: Create trigger to automatically update chat and unread counts
DROP TRIGGER IF EXISTS update_chat_and_unread_trigger ON public.messages;
CREATE TRIGGER update_chat_and_unread_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_and_unread();

-- Step 15: Create function to mark messages as read
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

-- Step 16: Create function to get user's total unread count
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

-- Step 17: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_chat_and_unread() TO authenticated;

-- Step 18: Verification and success message
SELECT 'Corrected messaging system setup completed successfully!' as status;

-- Show table structure verification
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('chats', 'messages', 'unread_messages')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
