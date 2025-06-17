import { supabase } from './supabase'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
  sender_name?: string
  receiver_name?: string
}

export interface Conversation {
  id: string
  participant_id: string
  participant_name: string
  last_message: string
  last_message_time: string
  unread_count: number
}

export const messagingService = {
  // Send a message
  async sendMessage(senderId: string, receiverId: string, message: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: senderId,
            receiver_id: receiverId,
            message: message
          }
        ])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Send message error:', error)
      return { data: null, error }
    }
  },

  // Get messages between two users
  async getMessages(userId1: string, userId2: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(name),
          receiver:users!receiver_id(name)
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Get messages error:', error)
      return { data: null, error }
    }
  },

  // Get conversations for a user
  async getConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(name),
          receiver:users!receiver_id(name)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process data to create conversation list
      const conversations: { [key: string]: Conversation } = {}
      
      data?.forEach((message: any) => {
        const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id
        const otherUserName = message.sender_id === userId ? message.receiver?.name : message.sender?.name
        
        if (!conversations[otherUserId]) {
          conversations[otherUserId] = {
            id: otherUserId,
            participant_id: otherUserId,
            participant_name: otherUserName || 'Unknown User',
            last_message: message.message,
            last_message_time: message.created_at,
            unread_count: 0
          }
        }
      })

      return { data: Object.values(conversations), error: null }
    } catch (error) {
      console.error('Get conversations error:', error)
      return { data: null, error }
    }
  },

  // Subscribe to real-time messages
  subscribeToMessages(userId1: string, userId2: string, callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1}))`
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  }
}
