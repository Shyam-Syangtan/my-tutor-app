import { supabase } from './supabase';

export interface Chat {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  last_message_id?: string;
  // Computed fields
  participant_id: string;
  participant_name: string;
  participant_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  is_sent: boolean;
}

export interface TutorInfo {
  id: string;
  user_id: string;
  name: string;
  photo_url?: string;
}

export class MessagingService {
  private currentUserId: string | null = null;

  constructor(userId?: string) {
    this.currentUserId = userId || null;
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  // Get or create a chat between current user and another user
  async getOrCreateChat(otherUserId: string): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // First, try to find existing chat
      const { data: existingChat, error: findError } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${this.currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${this.currentUserId})`)
        .single();

      if (existingChat && !findError) {
        return existingChat.id;
      }

      // If no existing chat, create new one
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          user1_id: this.currentUserId,
          user2_id: otherUserId
        })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      return newChat.id;
    } catch (error) {
      console.error('Error getting or creating chat:', error);
      throw error;
    }
  }

  // Get all chats for current user
  async getUserChats(): Promise<Chat[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // Get chats where user is participant
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          updated_at,
          last_message_id
        `)
        .or(`user1_id.eq.${this.currentUserId},user2_id.eq.${this.currentUserId}`)
        .order('updated_at', { ascending: false });

      if (chatsError) {
        throw chatsError;
      }

      if (!chats || chats.length === 0) {
        return [];
      }

      // Get participant info and last messages for each chat
      const enrichedChats: Chat[] = [];

      for (const chat of chats) {
        const participantId = chat.user1_id === this.currentUserId ? chat.user2_id : chat.user1_id;
        
        // Get participant info from users table and tutors table
        const [userResult, tutorResult, lastMessageResult] = await Promise.all([
          supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', participantId)
            .single(),
          supabase
            .from('tutors')
            .select('name, photo_url')
            .eq('user_id', participantId)
            .single(),
          supabase
            .from('messages')
            .select('content, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        ]);

        // Use tutor info if available, otherwise use user info
        const participantName = tutorResult.data?.name || userResult.data?.full_name || 'Unknown User';
        const participantAvatar = tutorResult.data?.photo_url || userResult.data?.avatar_url || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=6366f1&color=fff&size=40`;

        // Format last message
        const lastMessage = lastMessageResult.data?.content || 'No messages yet';
        const lastMessageTime = lastMessageResult.data?.created_at ? 
          this.formatMessageTime(lastMessageResult.data.created_at) : '';

        // Get unread count (messages not sent by current user)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', this.currentUserId);

        enrichedChats.push({
          id: chat.id,
          user1_id: chat.user1_id,
          user2_id: chat.user2_id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          last_message_id: chat.last_message_id,
          participant_id: participantId,
          participant_name: participantName,
          participant_avatar: participantAvatar,
          last_message: lastMessage,
          last_message_time: lastMessageTime,
          unread_count: unreadCount || 0,
          is_online: false // TODO: Implement real-time online status
        });
      }

      return enrichedChats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Get messages for a specific chat
  async getChatMessages(chatId: string): Promise<Message[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return messages.map(message => ({
        ...message,
        is_sent: message.sender_id === this.currentUserId
      }));
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(chatId: string, content: string): Promise<Message> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: this.currentUserId,
          content: content.trim()
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      return {
        ...message,
        is_sent: true
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get tutor info by user_id
  async getTutorInfo(userId: string): Promise<TutorInfo | null> {
    try {
      const { data: tutor, error } = await supabase
        .from('tutors')
        .select('id, user_id, name, photo_url')
        .eq('user_id', userId)
        .eq('approved', true)
        .single();

      if (error || !tutor) {
        return null;
      }

      return tutor;
    } catch (error) {
      console.error('Error getting tutor info:', error);
      return null;
    }
  }

  // Subscribe to new messages in a chat
  subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    return supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const message = payload.new as any;
          callback({
            ...message,
            is_sent: message.sender_id === this.currentUserId
          });
        }
      )
      .subscribe();
  }

  // Subscribe to chat updates
  subscribeToChats(callback: () => void) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    return supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `or(user1_id.eq.${this.currentUserId},user2_id.eq.${this.currentUserId})`
        },
        () => {
          callback();
        }
      )
      .subscribe();
  }

  // Helper function to format message time
  private formatMessageTime(timestamp: string): string {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  }
}

export const messagingService = new MessagingService();
