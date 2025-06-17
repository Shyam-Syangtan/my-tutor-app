// Messages Page - Migrated from React version
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { generateMetadata } from '../lib/seo'

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function Messages() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const metadata = generateMetadata({
    title: 'Messages - Connect with Your Tutors',
    description: 'Communicate with your Indian language tutors through our secure messaging system. Ask questions, schedule lessons, and get personalized guidance.',
    keywords: 'tutor messages, student communication, language learning support, tutor chat',
    path: '/messages'
  })

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session.user as User);
    setLoading(false);
  };

  const loadConversations = async () => {
    try {
      // For now, show empty state
      // In a real implementation, this would fetch conversations from the database
      setConversations([]);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // For now, show empty messages
      // In a real implementation, this would fetch messages for the conversation
      setMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      // For now, just add to local state
      // In a real implementation, this would save to database
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender_id: user.id,
        receiver_id: selectedConversation,
        created_at: new Date().toISOString(),
        sender_name: user.user_metadata?.full_name || 'You'
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>{metadata.title as string}</title>
          <meta name="description" content={metadata.description} />
        </Head>
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading messages...</p>
          </div>
        </div>
      </>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  return (
    <>
      <Head>
        <title>{metadata.title as string}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={metadata.title as string} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.shyamsyangtan.com/messages" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.shyamsyangtan.com/messages" />
      </Head>

      <div className="messages-page">
        {/* Header */}
        <header className="messages-header">
          <div className="header-container">
            <div className="header-left">
              <button
                onClick={() => router.back()}
                className="back-btn"
              >
                ← Back
              </button>
              <h1 className="page-title">Messages</h1>
            </div>
            <div className="header-right">
              <button
                onClick={() => router.push('/marketplace')}
                className="btn btn-primary"
              >
                Find Tutors
              </button>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="messages-main">
          <div className="messages-container">
            {/* Conversations Sidebar */}
            <div className="conversations-sidebar">
              <div className="sidebar-header">
                <h2 className="sidebar-title">Conversations</h2>
                <button
                  onClick={() => router.push('/marketplace')}
                  className="new-conversation-btn"
                >
                  + New
                </button>
              </div>
              
              <div className="conversations-list">
                {conversations.length === 0 ? (
                  <div className="empty-conversations">
                    <div className="empty-icon">💬</div>
                    <h3 className="empty-title">No conversations yet</h3>
                    <p className="empty-description">
                      Start a conversation with a tutor to begin learning.
                    </p>
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="btn btn-primary"
                    >
                      Find Tutors
                    </button>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`conversation-item ${selectedConversation === conversation.id ? 'active' : ''}`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <img
                        src={conversation.participant_avatar}
                        alt={conversation.participant_name}
                        className="conversation-avatar"
                      />
                      <div className="conversation-info">
                        <div className="conversation-name">{conversation.participant_name}</div>
                        <div className="conversation-preview">{conversation.last_message}</div>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="unread-badge">{conversation.unread_count}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              {selectedConversation ? (
                <>
                  {/* Messages List */}
                  <div className="messages-list">
                    {messages.length === 0 ? (
                      <div className="empty-messages">
                        <div className="empty-icon">💭</div>
                        <h3 className="empty-title">Start the conversation</h3>
                        <p className="empty-description">
                          Send your first message to begin learning together.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`message-item ${message.sender_id === user?.id ? 'sent' : 'received'}`}
                        >
                          <div className="message-content">
                            <p className="message-text">{message.content}</p>
                            <span className="message-time">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="message-input-area">
                    <div className="input-container">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="message-input"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="send-btn"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-conversation-selected">
                  <div className="no-conversation-content">
                    <div className="no-conversation-icon">💬</div>
                    <h3 className="no-conversation-title">Select a conversation</h3>
                    <p className="no-conversation-description">
                      Choose a conversation from the sidebar to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// No server-side props needed for messages page
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};
