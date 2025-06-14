-- =====================================================
-- FINAL MESSAGING SYSTEM FIX
-- This version handles all existing function conflicts
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop all existing messaging functions and triggers to avoid conflicts
-- Drop triggers first, then functions
DROP TRIGGER IF EXISTS update_chat_and_unread_trigger ON public.messages;
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_unread_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_chat_and_unread() CASCADE;

-- Step 2: Drop existing tables to ensure clean setup
DROP TABLE IF EXISTS public.unread_messages CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;

-- Step 3: Create chats table with correct structure
CREATE TABLE public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id UUID,
    UNIQUE(user1_id, user2_id)
);

-- Step 4: Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create unread_messages table
CREATE TABLE public.unread_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chat_id)
);

-- Step 6: Create indexes for better performance
CREATE INDEX idx_chats_user1 ON public.chats(user1_id);
CREATE INDEX idx_chats_user2 ON public.chats(user2_id);
CREATE INDEX idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_unread_user_chat ON public.unread_messages(user_id, chat_id);

-- Step 7: Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unread_messages ENABLE ROW LEVEL SECURITY;

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
CREATE OR REPLACE FUNCTION public.update_chat_and_unread()
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
CREATE TRIGGER update_chat_and_unread_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_and_unread();

-- Step 15: Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(chat_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Mark messages as read
    UPDATE public.messages 
    SET is_read = TRUE 
    WHERE chat_id = chat_uuid 
    AND sender_id != user_uuid 
    AND is_read = FALSE;
    
    -- Reset unread count
    UPDATE public.unread_messages 
    SET unread_count = 0, last_read_at = NOW()
    WHERE chat_id = chat_uuid AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 16: Create function to get user's total unread count
CREATE OR REPLACE FUNCTION public.get_user_unread_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_unread INTEGER;
BEGIN
    SELECT COALESCE(SUM(unread_count), 0) INTO total_unread
    FROM public.unread_messages
    WHERE user_id = user_uuid;
    
    RETURN total_unread;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 17: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_chat_and_unread() TO authenticated;

-- Step 18: Create test data to verify everything works
DO $$
DECLARE
    test_user_id UUID;
    test_chat_id UUID;
BEGIN
    -- Get a user ID for testing (if any users exist)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Create a test chat
        INSERT INTO public.chats (user1_id, user2_id)
        VALUES (test_user_id, test_user_id)
        ON CONFLICT DO NOTHING
        RETURNING id INTO test_chat_id;
        
        -- If chat already exists, get its ID
        IF test_chat_id IS NULL THEN
            SELECT id INTO test_chat_id 
            FROM public.chats 
            WHERE user1_id = test_user_id AND user2_id = test_user_id;
        END IF;
        
        RAISE NOTICE 'Test chat created/found: %', test_chat_id;
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;

-- Step 19: Verification and success message
SELECT 'Final messaging system setup completed successfully!' as status;

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