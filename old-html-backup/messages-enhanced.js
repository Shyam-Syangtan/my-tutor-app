/**
 * Enhanced Messages Page JavaScript
 * Handles the enhanced messaging interface with advanced features
 */

// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase;
let enhancedMessaging;
let simpleMessaging;
let currentChatId = null;
let currentOtherUser = null;
let chats = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 [ENHANCED-MESSAGES] Initializing enhanced messages page...');
        
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        // Update user info in nav
        updateUserInfo(session.user);

        // Initialize messaging services
        enhancedMessaging = new EnhancedMessaging(supabase);
        await enhancedMessaging.initialize();

        simpleMessaging = new SimpleMessaging(supabase);
        await simpleMessaging.initialize();

        // Load chats
        await loadUserChats();

        // Setup search functionality
        setupChatSearch();

        // Setup real-time subscriptions
        await setupRealTimeSubscriptions();

        console.log('✅ [ENHANCED-MESSAGES] Enhanced messages page initialized successfully');
        
    } catch (error) {
        console.error('❌ [ENHANCED-MESSAGES] Error initializing:', error);
        showErrorMessage('Failed to initialize messaging. Please refresh the page.');
    }
});

// Update user info in navigation
function updateUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = user.email;
    }
}

// Load user chats with enhanced features
async function loadUserChats() {
    try {
        console.log('📋 [ENHANCED-MESSAGES] Loading user chats...');
        
        const { data: userChats, error } = await supabase
            .from('chats')
            .select(`
                *,
                student:users!chats_student_id_fkey(id, email, raw_user_meta_data),
                tutor:users!chats_tutor_id_fkey(id, email, raw_user_meta_data),
                messages(content, created_at, sender_id, message_type)
            `)
            .or(`student_id.eq.${enhancedMessaging.currentUser.id},tutor_id.eq.${enhancedMessaging.currentUser.id}`)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        chats = userChats || [];
        await renderChatsList();
        
        console.log('✅ [ENHANCED-MESSAGES] Loaded', chats.length, 'chats');
        
    } catch (error) {
        console.error('❌ [ENHANCED-MESSAGES] Error loading chats:', error);
        showErrorMessage('Failed to load conversations');
    }
}

// Render chats list with enhanced features
async function renderChatsList() {
    const chatsList = document.getElementById('chatsList');
    
    if (chats.length === 0) {
        chatsList.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p class="font-medium">No conversations yet</p>
                <p class="text-sm">Start a conversation with a tutor or student</p>
            </div>
        `;
        return;
    }

    let chatsHTML = '';
    
    for (const chat of chats) {
        const otherUser = chat.student_id === enhancedMessaging.currentUser.id ? chat.tutor : chat.student;
        const lastMessage = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;
        const unreadCount = await enhancedMessaging.getUnreadCount(chat.id);
        
        const userName = otherUser?.raw_user_meta_data?.full_name || otherUser?.email || 'Unknown User';
        const userAvatar = otherUser?.raw_user_meta_data?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff`;
        
        let lastMessageText = 'No messages yet';
        let lastMessageTime = '';
        
        if (lastMessage) {
            if (lastMessage.message_type === 'file') {
                lastMessageText = '📎 File attachment';
            } else {
                lastMessageText = lastMessage.content.length > 50 
                    ? lastMessage.content.substring(0, 50) + '...' 
                    : lastMessage.content;
            }
            lastMessageTime = formatTime(lastMessage.created_at);
        }

        chatsHTML += `
            <div class="chat-item p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-indigo-50 border-indigo-200' : ''}"
                 onclick="selectChat('${chat.id}', '${otherUser?.id}', '${userName}', '${userAvatar}')">
                <div class="flex items-center space-x-3">
                    <div class="relative">
                        <img src="${userAvatar}" alt="${userName}" class="w-12 h-12 rounded-full">
                        <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h3 class="font-semibold text-gray-900 truncate">${userName}</h3>
                            <div class="flex items-center space-x-2">
                                ${lastMessageTime ? `<span class="text-xs text-gray-500">${lastMessageTime}</span>` : ''}
                                ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 truncate">${lastMessageText}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    chatsList.innerHTML = chatsHTML;
}

// Select a chat
async function selectChat(chatId, otherUserId, otherUserName, otherUserAvatar) {
    try {
        console.log('💬 [ENHANCED-MESSAGES] Selecting chat:', chatId);
        
        currentChatId = chatId;
        currentOtherUser = { id: otherUserId, name: otherUserName, avatar: otherUserAvatar };
        
        // Set current chat in enhanced messaging
        enhancedMessaging.setCurrentChat(chatId);
        
        // Update UI
        updateChatHeader(otherUserName, otherUserAvatar);
        showChatArea();
        
        // Load messages
        await loadChatMessages(chatId);
        
        // Mark messages as read
        await enhancedMessaging.markAsRead(chatId);
        
        // Update chat list to remove unread badge
        await renderChatsList();
        
        console.log('✅ [ENHANCED-MESSAGES] Chat selected successfully');
        
    } catch (error) {
        console.error('❌ [ENHANCED-MESSAGES] Error selecting chat:', error);
        showErrorMessage('Failed to load chat');
    }
}

// Update chat header
function updateChatHeader(userName, userAvatar) {
    document.getElementById('otherUserName').textContent = userName;
    document.getElementById('otherUserAvatar').src = userAvatar;
    document.getElementById('chatHeader').classList.remove('hidden');
}

// Show chat area
function showChatArea() {
    document.getElementById('messageInputArea').classList.remove('hidden');
    
    // Clear the default message
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea.querySelector('.text-center')) {
        messagesArea.innerHTML = '';
    }
}

// Load chat messages with enhanced features
async function loadChatMessages(chatId) {
    try {
        console.log('📨 [ENHANCED-MESSAGES] Loading messages for chat:', chatId);
        
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                message_reactions(reaction, user_id),
                message_status(status)
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const messagesArea = document.getElementById('messagesArea');
        messagesArea.innerHTML = '';

        messages.forEach(message => {
            addMessageToUI(message);
        });

        scrollToBottom();
        
        console.log('✅ [ENHANCED-MESSAGES] Loaded', messages.length, 'messages');
        
    } catch (error) {
        console.error('❌ [ENHANCED-MESSAGES] Error loading messages:', error);
        showErrorMessage('Failed to load messages');
    }
}

// Add message to UI with enhanced features
function addMessageToUI(message) {
    const messagesArea = document.getElementById('messagesArea');
    const isSent = message.sender_id === enhancedMessaging.currentUser.id;
    const time = formatTime(message.created_at);
    
    const justifyClass = isSent ? 'justify-end' : 'justify-start';
    const messageClass = isSent ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900';
    
    let messageContent = '';
    
    if (message.message_type === 'file') {
        const fileName = message.file_name || 'File';
        if (message.file_type && message.file_type.startsWith('image/')) {
            messageContent = `
                <img src="${message.file_url}" alt="${fileName}" class="file-preview mb-2">
                <p class="text-sm">${fileName}</p>
            `;
        } else {
            messageContent = `
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <a href="${message.file_url}" target="_blank" class="text-sm underline">${fileName}</a>
                </div>
            `;
        }
    } else {
        messageContent = `<p class="text-sm">${escapeHtml(message.content)}</p>`;
    }
    
    // Add reactions
    let reactionsHTML = '';
    if (message.message_reactions && message.message_reactions.length > 0) {
        const reactionCounts = {};
        message.message_reactions.forEach(reaction => {
            reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
        });
        
        reactionsHTML = '<div class="flex space-x-1 mt-1">';
        Object.entries(reactionCounts).forEach(([reaction, count]) => {
            reactionsHTML += `<span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${reaction} ${count}</span>`;
        });
        reactionsHTML += '</div>';
    }
    
    // Message status for sent messages
    let statusHTML = '';
    if (isSent && message.message_status && message.message_status.length > 0) {
        const status = message.message_status[0].status;
        let statusIcon = '✓';
        let statusClass = 'text-gray-400';
        
        if (status === 'delivered') {
            statusIcon = '✓✓';
            statusClass = 'text-blue-500';
        } else if (status === 'read') {
            statusIcon = '✓✓';
            statusClass = 'text-green-500';
        }
        
        statusHTML = `<span class="message-status ${statusClass}">${statusIcon}</span>`;
    }

    const messageHTML = `
        <div class="flex ${justifyClass}" data-message-id="${message.id}">
            <div class="message-bubble ${messageClass} px-4 py-2 rounded-lg relative group">
                ${messageContent}
                <div class="flex items-center justify-between mt-1">
                    <span class="text-xs opacity-75">${time}</span>
                    ${statusHTML}
                </div>
                ${reactionsHTML}
                
                <!-- Reaction Button (appears on hover) -->
                <button class="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onclick="showReactionPicker('${message.id}', this)">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    messagesArea.insertAdjacentHTML('beforeend', messageHTML);
}

// Show reaction picker
function showReactionPicker(messageId, button) {
    // Remove existing picker
    const existingPicker = document.querySelector('.reaction-picker');
    if (existingPicker) {
        existingPicker.remove();
    }

    const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.innerHTML = reactions.map(reaction => 
        `<button onclick="addReaction('${messageId}', '${reaction}')" class="text-lg hover:bg-gray-100 p-1 rounded">${reaction}</button>`
    ).join('');
    
    button.parentNode.appendChild(picker);
    
    // Close picker when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeReactionPicker(e) {
            if (!picker.contains(e.target) && e.target !== button) {
                picker.remove();
                document.removeEventListener('click', closeReactionPicker);
            }
        });
    }, 100);
}

// Add reaction to message
async function addReaction(messageId, reaction) {
    try {
        await enhancedMessaging.addReaction(messageId, reaction);
        
        // Remove reaction picker
        const picker = document.querySelector('.reaction-picker');
        if (picker) picker.remove();
        
        // Reload messages to show updated reactions
        if (currentChatId) {
            await loadChatMessages(currentChatId);
        }
        
    } catch (error) {
        console.error('❌ [ENHANCED-MESSAGES] Error adding reaction:', error);
    }
}

// Setup chat search
function setupChatSearch() {
    const searchInput = document.getElementById('chatSearch');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterChats(e.target.value);
        }, 300);
    });
}

// Filter chats based on search
function filterChats(query) {
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const userName = item.querySelector('h3').textContent.toLowerCase();
        const lastMessage = item.querySelector('p').textContent.toLowerCase();
        
        if (userName.includes(query.toLowerCase()) || lastMessage.includes(query.toLowerCase())) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Setup real-time subscriptions
async function setupRealTimeSubscriptions() {
    console.log('🔔 [ENHANCED-MESSAGES] Setting up real-time subscriptions...');
    
    // Subscribe to new messages
    supabase
        .channel('messages')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, (payload) => {
            handleNewMessage(payload.new);
        })
        .subscribe();

    // Subscribe to typing indicators
    supabase
        .channel('typing_indicators')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'typing_indicators'
        }, (payload) => {
            handleTypingIndicator(payload.new);
        })
        .subscribe();

    // Subscribe to message reactions
    supabase
        .channel('message_reactions')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'message_reactions'
        }, (payload) => {
            if (currentChatId) {
                loadChatMessages(currentChatId);
            }
        })
        .subscribe();
}

// Handle new message
function handleNewMessage(message) {
    if (message.chat_id === currentChatId) {
        addMessageToUI(message);
        scrollToBottom();
    }
    
    // Update chat list
    loadUserChats();
}

// Handle typing indicator
function handleTypingIndicator(indicator) {
    if (indicator.chat_id === currentChatId && indicator.user_id !== enhancedMessaging.currentUser.id) {
        const typingDiv = document.getElementById('typingIndicator');
        
        if (indicator.is_typing) {
            typingDiv.classList.remove('hidden');
        } else {
            typingDiv.classList.add('hidden');
        }
    }
}

// Send message (enhanced version)
async function sendMessage() {
    try {
        await enhancedMessaging.sendMessage();
    } catch (error) {
        console.error('❌ [ENHANCED-MESSAGES] Error sending message:', error);
        showErrorMessage('Failed to send message');
    }
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showErrorMessage(message) {
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Logout function
async function logout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}
