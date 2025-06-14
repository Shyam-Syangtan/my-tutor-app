-- =====================================================
-- SAFE MESSAGING SYSTEM FIX
-- This version PRESERVES existing functionality and only adds messaging
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Only create messaging tables if they don't exist (safe approach)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id UUID
);

-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_user1_id_user2_id_key'
    ) THEN
        ALTER TABLE public.chats ADD CONSTRAINT chats_user1_id_user2_id_key UNIQUE(user1_id, user2_id);
    END IF;
END $$;

-- Step 2: Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_message_type_check'
    ) THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check 
        CHECK (message_type IN ('text', 'file', 'image'));
    END IF;
END $$;

-- Step 3: Create unread_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.unread_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unread_messages_user_id_chat_id_key'
    ) THEN
        ALTER TABLE public.unread_messages ADD CONSTRAINT unread_messages_user_id_chat_id_key UNIQUE(user_id, chat_id);
    END IF;
END $$;

-- Step 4: Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_chats_user1 ON public.chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2 ON public.chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_unread_user_chat ON public.unread_messages(user_id, chat_id);

-- Step 5: Enable Row Level Security (safe - won't break if already enabled)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unread_messages ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies only if they don't exist
DO $$
BEGIN
    -- Chats policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'Users can view their own chats') THEN
        CREATE POLICY "Users can view their own chats" ON public.chats
            FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'Users can create chats') THEN
        CREATE POLICY "Users can create chats" ON public.chats
            FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'Users can update their own chats') THEN
        CREATE POLICY "Users can update their own chats" ON public.chats
            FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
    END IF;
    
    -- Messages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages in their chats') THEN
        CREATE POLICY "Users can view messages in their chats" ON public.messages
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.chats 
                    WHERE chats.id = messages.chat_id 
                    AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
                )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can create messages in their chats') THEN
        CREATE POLICY "Users can create messages in their chats" ON public.messages
            FOR INSERT WITH CHECK (
                auth.uid() = sender_id AND
                EXISTS (
                    SELECT 1 FROM public.chats 
                    WHERE chats.id = messages.chat_id 
                    AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
                )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update their messages') THEN
        CREATE POLICY "Users can update their messages" ON public.messages
            FOR UPDATE USING (
                auth.uid() = sender_id OR
                EXISTS (
                    SELECT 1 FROM public.chats 
                    WHERE chats.id = messages.chat_id 
                    AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
                )
            );
    END IF;
    
    -- Unread messages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'unread_messages' AND policyname = 'Users can view their unread counts') THEN
        CREATE POLICY "Users can view their unread counts" ON public.unread_messages
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'unread_messages' AND policyname = 'Users can manage their unread counts') THEN
        CREATE POLICY "Users can manage their unread counts" ON public.unread_messages
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Step 7: Grant permissions (safe - won't break existing permissions)
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.unread_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 8: Enable Realtime safely
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Messages table already added to realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add messages to realtime: %', SQLERRM;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Chats table already added to realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add chats to realtime: %', SQLERRM;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.unread_messages;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Unread_messages table already added to realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add unread_messages to realtime: %', SQLERRM;
    END;
END $$;

-- Step 9: Create messaging functions with safe names (avoid conflicts)
CREATE OR REPLACE FUNCTION public.messaging_update_chat_and_unread()
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

-- Step 10: Create trigger safely
DROP TRIGGER IF EXISTS messaging_update_chat_and_unread_trigger ON public.messages;
CREATE TRIGGER messaging_update_chat_and_unread_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.messaging_update_chat_and_unread();

-- Step 11: Create safe messaging functions
CREATE OR REPLACE FUNCTION public.messaging_mark_as_read(chat_uuid UUID, user_uuid UUID)
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

CREATE OR REPLACE FUNCTION public.messaging_get_unread_count(user_uuid UUID)
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

-- Step 12: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.messaging_mark_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_get_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_update_chat_and_unread() TO authenticated;

-- Step 13: Success message
SELECT 'Safe messaging system setup completed successfully!' as status;
SELECT 'All existing functionality preserved!' as note;
