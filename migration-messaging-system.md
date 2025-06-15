# Real-time Messaging Migration

## Current Implementation → Next.js Implementation

### Current: simple-messaging.js → React Hook
```typescript
// Current: Global messaging functions
function initializeMessaging() {
  // Setup real-time subscriptions
}

// Next.js: Custom hook for messaging
// hooks/useMessaging.ts
import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export function useMessaging() {
  const [messages, setMessages] = useState([])
  const [chats, setChats] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = useSupabaseClient()
  const user = useUser()

  useEffect(() => {
    if (!user) return

    // Load existing chats
    loadChats()
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, handleNewMessage)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select(`
        *,
        messages (
          id,
          content,
          created_at,
          sender_id,
          read_at
        )
      `)
      .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    setChats(data || [])
    calculateUnreadCount(data || [])
  }

  const sendMessage = async (chatId: string, content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: content
      })
      .select()
      .single()

    if (!error) {
      setMessages(prev => [...prev, data])
    }

    return { data, error }
  }

  const handleNewMessage = (payload) => {
    const newMessage = payload.new
    setMessages(prev => [...prev, newMessage])
    setUnreadCount(prev => prev + 1)
    
    // Update chat list
    loadChats()
  }

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
  }

  return {
    messages,
    chats,
    unreadCount,
    sendMessage,
    markAsRead,
    loadChats
  }
}
```

### Message Component Migration
```typescript
// Current: HTML template strings
function renderMessage(message) {
  return `
    <div class="message">
      <p>${message.content}</p>
      <span>${message.created_at}</span>
    </div>
  `
}

// Next.js: React component
// components/Message.tsx
interface MessageProps {
  message: {
    id: string
    content: string
    created_at: string
    sender_id: string
  }
  isOwn: boolean
}

export function Message({ message, isOwn }: MessageProps) {
  return (
    <div className={`message ${isOwn ? 'message-own' : 'message-other'}`}>
      <p className="message-content">{message.content}</p>
      <span className="message-time">
        {new Date(message.created_at).toLocaleTimeString()}
      </span>
    </div>
  )
}
```

### Chat Interface Component
```typescript
// components/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react'
import { useMessaging } from '../hooks/useMessaging'
import { Message } from './Message'

interface ChatInterfaceProps {
  chatId: string
  recipientName: string
}

export function ChatInterface({ chatId, recipientName }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('')
  const { messages, sendMessage } = useMessaging()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await sendMessage(chatId, newMessage)
    setNewMessage('')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>{recipientName}</h3>
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <Message 
            key={message.id} 
            message={message} 
            isOwn={message.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  )
}
```
