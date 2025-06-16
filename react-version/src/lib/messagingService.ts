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

  // OPTIMIZED: Get all chats for current user with single query
  async getUserChats(): Promise<Chat[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🚀 Loading chats with optimized query...');
      const startTime = performance.now();

      // Get chats with basic info
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          updated_at
        `)
        .or(`user1_id.eq.${this.currentUserId},user2_id.eq.${this.currentUserId}`)
        .order('updated_at', { ascending: false })
        .limit(20); // Limit for performance

      if (chatsError) {
        throw chatsError;
      }

      if (!chats || chats.length === 0) {
        console.log('✅ No chats found');
        return [];
      }

      // Get all unique participant IDs
      const participantIds = chats.map(chat => 
        chat.user1_id === this.currentUserId ? chat.user2_id : chat.user1_id
      );

      // Batch fetch all data in parallel
      const [tutorsResult, usersResult, messagesResult] = await Promise.all([
        // Get tutor info for all participants
        supabase
          .from('tutors')
          .select('user_id, name, photo_url')
          .in('user_id', participantIds)
          .eq('approved', true),
        
        // Get user info for all participants
        supabase
          .from('users')
          .select('id, full_name, avatar_url, email')
          .in('id', participantIds),
        
        // Get last message for each chat
        supabase
          .from('messages')
          .select('chat_id, content, created_at, sender_id')
          .in('chat_id', chats.map(c => c.id))
          .order('created_at', { ascending: false })
      ]);

      // Create lookup maps
      const tutorsMap = new Map();
      const usersMap = new Map();
      const messagesMap = new Map();

      if (tutorsResult.data) {
        tutorsResult.data.forEach(tutor => {
          tutorsMap.set(tutor.user_id, tutor);
        });
      }

      if (usersResult.data) {
        usersResult.data.forEach(user => {
          usersMap.set(user.id, user);
        });
      }

      if (messagesResult.data) {
        messagesResult.data.forEach(message => {
          if (!messagesMap.has(message.chat_id)) {
            messagesMap.set(message.chat_id, message);
          }
        });
      }

      // Process chats efficiently
      const enrichedChats: Chat[] = chats.map(chat => {
        const participantId = chat.user1_id === this.currentUserId ? chat.user2_id : chat.user1_id;

        // Get participant info
        let participantName = 'Unknown User';
        let participantAvatar = '';

        const tutorInfo = tutorsMap.get(participantId);
        const userInfo = usersMap.get(participantId);

        if (tutorInfo) {
          participantName = tutorInfo.name;
          participantAvatar = tutorInfo.photo_url || '';
        } else if (userInfo) {
          participantName = userInfo.full_name || userInfo.email?.split('@')[0] || 'User';
          participantAvatar = userInfo.avatar_url || '';
        }

        // Generate default avatar if none found
        if (!participantAvatar) {
          participantAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=6366f1&color=fff&size=40`;
        }

        // Get last message
        let lastMessage = 'No messages yet';
        let lastMessageTime = '';
        const messageInfo = messagesMap.get(chat.id);
        
        if (messageInfo) {
          lastMessage = messageInfo.content;
          lastMessageTime = this.formatMessageTime(messageInfo.created_at);
        }

        return {
          id: chat.id,
          user1_id: chat.user1_id,
          user2_id: chat.user2_id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          participant_id: participantId,
          participant_name: participantName,
          participant_avatar: participantAvatar,
          last_message: lastMessage,
          last_message_time: lastMessageTime,
          unread_count: 0, // Simplified for performance
          is_online: false
        };
      });

      const endTime = performance.now();
      console.log(`✅ Loaded ${enrichedChats.length} chats in ${(endTime - startTime).toFixed(2)}ms`);

      return enrichedChats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Get messages for a specific chat (with pagination)
  async getChatMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return messages.reverse().map(message => ({
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
          
          // Only process messages from OTHER users to avoid duplicates
          if (message.sender_id !== this.currentUserId) {
            callback({
              ...message,
              is_sent: false
            });
          }
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
