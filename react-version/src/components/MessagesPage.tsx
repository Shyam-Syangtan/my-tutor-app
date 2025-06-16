import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';
import { MessagingService, Chat, Message } from '../lib/messagingService';

const MessagesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [messagingService, setMessagingService] = useState<MessagingService | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const service = new MessagingService(user.id);
      setMessagingService(service);
      loadChats(service);

      // Check if we need to create a new chat from URL params
      const tutorUserId = searchParams.get('tutor');
      if (tutorUserId) {
        createChatWithTutor(service, tutorUserId);
      }

      // Subscribe to chat updates
      const chatSubscription = service.subscribeToChats(() => {
        loadChats(service);
      });

      return () => {
        chatSubscription.unsubscribe();
      };
    }
  }, [user, searchParams]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const loadChats = async (service: MessagingService) => {
    try {
      const userChats = await service.getUserChats();
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    }
  };

  const createChatWithTutor = async (service: MessagingService, tutorUserId: string) => {
    try {
      const chatId = await service.getOrCreateChat(tutorUserId);
      // Reload chats to include the new one
      await loadChats(service);
      // Find and select the new chat
      const userChats = await service.getUserChats();
      const newChat = userChats.find(chat => chat.id === chatId);
      if (newChat) {
        selectChat(newChat, service);
      }
    } catch (error) {
      console.error('Error creating chat with tutor:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const loadMessages = async (chat: Chat, service: MessagingService) => {
    try {
      const chatMessages = await service.getChatMessages(chat.id);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const selectChat = async (chat: Chat, service?: MessagingService) => {
    setSelectedChat(chat);
    const serviceToUse = service || messagingService;
    if (serviceToUse) {
      await loadMessages(chat, serviceToUse);

      // Subscribe to new messages in this chat
      const messageSubscription = serviceToUse.subscribeToMessages(chat.id, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);

        // Update last message in chat list if it's not from current user
        if (!newMessage.is_sent) {
          setChats(prevChats =>
            prevChats.map(c =>
              c.id === chat.id
                ? { ...c, last_message: newMessage.content, last_message_time: 'now', unread_count: c.unread_count + 1 }
                : c
            )
          );
        }
      });

      // Store subscription for cleanup
      return () => {
        messageSubscription.unsubscribe();
      };
    }

    // Mark as read (update local state)
    setChats(prevChats =>
      prevChats.map(c =>
        c.id === chat.id ? { ...c, unread_count: 0 } : c
      )
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !messagingService || sendingMessage) return;

    setSendingMessage(true);
    const messageContent = newMessage;
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const sentMessage = await messagingService.sendMessage(selectedChat.id, messageContent);
      setMessages(prev => [...prev, sentMessage]);

      // Update last message in chat list
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === selectedChat.id
            ? { ...c, last_message: messageContent, last_message_time: 'now' }
            : c
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate(ROUTES.LANDING);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    action();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading messages...</p>
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=40`;
  const totalUnread = chats.reduce((sum, chat) => sum + chat.unread_count, 0);

  // Format message timestamp
  const formatMessageTime = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="messages-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <h2 className="nav-logo">IndianTutors</h2>
            </div>
            <div className="nav-center">
              <h1 className="messages-title">Messages {totalUnread > 0 && <span className="unread-badge">{totalUnread}</span>}</h1>
            </div>
            <div className="nav-right nav-links">
              {/* Profile Dropdown */}
              <div className={`profile-dropdown ${isDropdownOpen ? 'active' : ''}`}>
                <button className="profile-btn" onClick={toggleDropdown}>
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="profile-avatar"
                  />
                  <span className="profile-name">{userName}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="profile-dropdown-content">
                    <div className="profile-info">
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="dropdown-avatar"
                      />
                      <div className="dropdown-user-info">
                        <div className="dropdown-name">{userName}</div>
                        <div className="dropdown-email">{user?.email}</div>
                      </div>
                    </div>
                    <hr className="dropdown-divider" />
                    <a href="#" onClick={(e) => handleDropdownClick(e, () => navigate(ROUTES.HOME))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      </svg>
                      Dashboard
                    </a>
                    <a href="#" onClick={(e) => handleDropdownClick(e, () => navigate(ROUTES.PROFILE))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profile
                    </a>
                    <hr className="dropdown-divider" />
                    <a href="#" onClick={(e) => handleDropdownClick(e, handleSignOut)} className="logout-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Messages Interface */}
      <main className="messages-main">
        <div className="messages-container">
          <div className="messages-layout">
            {/* Left Sidebar - Chat List */}
            <div className="chat-sidebar">
              <div className="chat-sidebar-header">
                <h3>Conversations</h3>
                <button className="new-chat-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                </button>
              </div>

              <div className="chat-list">
                {chats.length === 0 ? (
                  <div className="no-chats">
                    <svg className="no-chats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <p>No conversations yet</p>
                    <small>Start chatting with tutors from the marketplace</small>
                  </div>
                ) : (
                  chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                      onClick={() => selectChat(chat)}
                    >
                      <div className="chat-avatar-container">
                        <img src={chat.participant_avatar} alt={chat.participant_name} className="chat-avatar" />
                        {chat.is_online && <div className="online-indicator"></div>}
                      </div>
                      <div className="chat-info">
                        <div className="chat-header">
                          <h4 className="chat-name">{chat.participant_name}</h4>
                          <span className="chat-time">{chat.last_message_time}</span>
                        </div>
                        <div className="chat-preview">
                          <p className="last-message">{chat.last_message}</p>
                          {chat.unread_count > 0 && (
                            <span className="unread-count">{chat.unread_count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="chat-area">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="chat-header-bar">
                    <div className="chat-participant">
                      <img src={selectedChat.participant_avatar} alt={selectedChat.participant_name} className="participant-avatar" />
                      <div className="participant-info">
                        <h3 className="participant-name">{selectedChat.participant_name}</h3>
                        <span className={`participant-status ${selectedChat.is_online ? 'online' : 'offline'}`}>
                          {selectedChat.is_online ? 'Online' : 'Last seen recently'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="messages-area">
                    <div className="messages-list">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`message ${message.is_sent ? 'sent' : 'received'}`}
                        >
                          <div className="message-bubble">
                            <p className="message-content">{message.content}</p>
                            <span className="message-time">{formatMessageTime(message.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="message-input-area">
                    <div className="message-input-container">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="message-input"
                        rows={1}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="send-btn"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-chat-selected">
                  <svg className="no-chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  <h3>Select a conversation</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
