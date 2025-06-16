/**
 * Main Messages Page JavaScript
 * Handles the messaging interface for both students and tutors
 */

// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase;
let messaging;
let currentChatId = null;
let currentOtherUser = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Initialize messaging service
        messaging = new SimpleMessaging(supabase);
        await messaging.initialize();

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        // Update user info in nav
        updateUserInfo(session.user);

        // Load chats
        await loadUserChats();

        // Set up global real-time subscription for all user messages
        console.log('🔔 Setting up global real-time subscription...');
        updateSubscriptionIndicator('connecting');
        await messaging.subscribeToAllUserMessages(handleNewMessage);
        console.log('✅ Global subscription setup complete');

        // Monitor subscription status
        monitorSubscriptionStatus();

        // Check for chat ID in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const chatId = urlParams.get('chat');
        if (chatId) {
            console.log('🔗 Chat ID found in URL:', chatId);
            // Wait a bit for the chat to be fully created, then try to open it
            setTimeout(async () => {
                await loadUserChats(); // Refresh chat list
                await refreshGlobalSubscription(); // Refresh subscription to include new chat
                await openChatById(chatId);
            }, 1000);
        }

        // Hide loading state
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('messagesContainer').classList.remove('hidden');

    } catch (error) {
        console.error('Error initializing messages:', error);
        showErrorState();
    }
});

// Update user info in navigation
function updateUserInfo(user) {
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = user.email;
    }
}

// Load user's chats
async function loadUserChats() {
    try {
        console.log('📋 Loading user chats...');
        const chats = await messaging.getUserChats();
        console.log('📋 Loaded chats:', chats);
        displayChats(chats);
    } catch (error) {
        console.error('❌ Error loading chats:', error);
        showErrorState();
    }
}

// Refresh global subscription (call when new chats are created)
async function refreshGlobalSubscription() {
    console.log('🔄 Refreshing global subscription...');
    updateSubscriptionIndicator('connecting');
    await messaging.subscribeToAllUserMessages(handleNewMessage);
}

// Test message delivery (for debugging)
window.testMessageDelivery = function() {
    console.log('🧪 Testing message delivery...');
    console.log('Current subscription state:', messaging?.globalSubscription?.state);
    console.log('Current user:', messaging?.currentUser?.id);
    console.log('Current chat:', currentChatId);

    if (currentChatId && messaging) {
        const testMessage = `Test message at ${new Date().toLocaleTimeString()}`;
        sendMessage();
        document.getElementById('messageText').value = testMessage;
    } else {
        console.log('❌ No active chat or messaging service');
    }
};

// Display chats in sidebar
function displayChats(chats) {
    const chatsList = document.getElementById('chatsList');

    console.log('🎨 Displaying chats:', chats);

    if (chats.length === 0) {
        console.log('📭 No chats to display');
        chatsList.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
                </svg>
                <p class="text-sm">No conversations yet</p>
                <p class="text-xs mt-1">Start a conversation by contacting a tutor</p>
            </div>
        `;
        return;
    }

    const chatsHTML = chats.map(chat => {
        const otherUser = chat.otherUser;
        const userName = otherUser?.name || otherUser?.email?.split('@')[0] || 'Unknown User';
        const userInitial = userName.charAt(0).toUpperCase();
        const lastMessage = chat.latestMessage?.content || 'No messages yet';
        const timeAgo = chat.latestMessage ? formatTimeAgo(new Date(chat.latestMessage.created_at)) : '';

        return `
            <div class="chat-item p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors" 
                 onclick="openChat('${chat.id}', '${otherUser?.id}', '${userName}')">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span class="text-indigo-600 font-semibold">${userInitial}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h3 class="font-semibold text-gray-900 truncate">${userName}</h3>
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                        </div>
                        <p class="text-sm text-gray-500 truncate">${lastMessage}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    chatsList.innerHTML = chatsHTML;
}

// Open a chat
async function openChat(chatId, otherUserId, userName) {
    try {
        currentChatId = chatId;
        currentOtherUser = { id: otherUserId, name: userName };

        // Update active chat styling
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('bg-indigo-50', 'border-indigo-200');
        });
        event.currentTarget.classList.add('bg-indigo-50', 'border-indigo-200');

        // Show chat interface
        document.getElementById('noChatSelected').classList.add('hidden');
        document.getElementById('chatHeader').classList.remove('hidden');
        document.getElementById('messagesArea').classList.remove('hidden');
        document.getElementById('messageInput').classList.remove('hidden');

        // Update chat header
        document.getElementById('chatUserName').textContent = userName;
        document.getElementById('chatUserInitial').textContent = userName.charAt(0).toUpperCase();

        // Load messages
        await loadChatMessages(chatId);

        // Note: We're using global subscription now, so no need to subscribe to individual chats
        console.log('💬 Chat opened, using global subscription for real-time messages');

    } catch (error) {
        console.error('Error opening chat:', error);
    }
}

// Open chat by ID (from URL parameter)
async function openChatById(chatId) {
    try {
        console.log('🔍 Opening chat by ID:', chatId);
        const chats = await messaging.getUserChats();
        console.log('📋 Available chats:', chats);
        const chat = chats.find(c => c.id === chatId);

        if (chat) {
            console.log('✅ Found chat:', chat);
            const otherUser = chat.otherUser;
            const userName = otherUser?.name || otherUser?.email?.split('@')[0] || 'Unknown User';
            await openChat(chatId, otherUser.id, userName);
        } else {
            console.log('❌ Chat not found with ID:', chatId);
            console.log('🔄 Retrying in 2 seconds...');
            // Retry after a delay in case the chat was just created
            setTimeout(async () => {
                const retryChats = await messaging.getUserChats();
                const retryChat = retryChats.find(c => c.id === chatId);
                if (retryChat) {
                    console.log('✅ Found chat on retry:', retryChat);
                    const otherUser = retryChat.otherUser;
                    const userName = otherUser?.name || otherUser?.email?.split('@')[0] || 'Unknown User';
                    await openChat(chatId, otherUser.id, userName);
                } else {
                    console.log('❌ Chat still not found after retry');
                }
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Error opening chat by ID:', error);
    }
}

// Load messages for a chat
async function loadChatMessages(chatId) {
    try {
        const messages = await messaging.getChatMessages(chatId);
        displayMessages(messages);
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    
    const messagesHTML = messages.map(message => {
        const isSent = message.sender_id === messaging.currentUser.id;
        const messageClass = isSent ? 'message-sent text-white ml-auto' : 'message-received mr-auto';
        const justifyClass = isSent ? 'justify-end' : 'justify-start';
        const time = formatTime(new Date(message.created_at));
        
        return `
            <div class="flex ${justifyClass}" data-message-id="${message.id}">
                <div class="message-bubble ${messageClass} px-4 py-2 rounded-lg">
                    <p class="text-sm">${escapeHtml(message.content)}</p>
                    <p class="text-xs opacity-75 mt-1">${time}</p>
                </div>
            </div>
        `;
    }).join('');

    messagesList.innerHTML = messagesHTML;
}

// Handle new message from real-time subscription
function handleNewMessage(message) {
    const timestamp = new Date().toISOString();
    console.log(`📨 [${timestamp}] handleNewMessage called:`, {
        messageId: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        content: message.content.substring(0, 50) + '...',
        currentChatId,
        messageForCurrentChat: message.chat_id === currentChatId,
        currentUserId: messaging?.currentUser?.id
    });

    // Always update chat list first (for messages in other chats)
    loadUserChats();

    // Only display in UI if it's for the currently open chat
    if (message.chat_id === currentChatId) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) {
            console.error('❌ Messages list element not found');
            return;
        }

        // Check if message already exists to prevent duplicates
        const existingMessage = messagesList.querySelector(`[data-message-id="${message.id}"]`);
        if (existingMessage) {
            console.log(`📨 [${timestamp}] Message ${message.id} already exists in UI, skipping`);
            return;
        }

        const isSent = message.sender_id === messaging.currentUser.id;
        const messageClass = isSent ? 'message-sent text-white ml-auto' : 'message-received mr-auto';
        const justifyClass = isSent ? 'justify-end' : 'justify-start';
        const time = formatTime(new Date(message.created_at));

        console.log(`💬 [${timestamp}] Adding message to UI:`, {
            messageId: message.id,
            isSent,
            content: message.content,
            time,
            chatId: message.chat_id
        });

        const messageHTML = `
            <div class="flex ${justifyClass}" data-message-id="${message.id}">
                <div class="message-bubble ${messageClass} px-4 py-2 rounded-lg">
                    <p class="text-sm">${escapeHtml(message.content)}</p>
                    <p class="text-xs opacity-75 mt-1">${time}</p>
                </div>
            </div>
        `;

        messagesList.insertAdjacentHTML('beforeend', messageHTML);
        scrollToBottom();
        console.log(`✅ [${timestamp}] Message ${message.id} added to UI successfully`);

        // Show a brief visual confirmation for received messages
        if (!isSent) {
            showMessageDeliveryConfirmation();
        }
    } else {
        console.log(`📨 [${timestamp}] Message for different chat (${message.chat_id}), updating chat list only`);
    }
}

// Show brief visual confirmation for message delivery
function showMessageDeliveryConfirmation() {
    // Create a small notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded text-sm z-50';
    notification.textContent = '📨 New message';
    document.body.appendChild(notification);

    // Remove after 2 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
}

// Send a message with enhanced features
async function sendMessage() {
    const messageInput = document.getElementById('messageText');
    const content = messageInput.value.trim();

    console.log('📤 Attempting to send message:', {
        content,
        currentChatId,
        currentOtherUser,
        hasMessaging: !!messaging,
        hasCurrentUser: !!messaging?.currentUser
    });

    if (!content) {
        console.log('❌ No content to send');
        return;
    }

    if (!currentChatId) {
        console.log('❌ No current chat ID');
        alert('Please select a chat first');
        return;
    }

    if (!currentOtherUser) {
        console.log('❌ No other user selected');
        alert('Please select a conversation first');
        return;
    }

    // Show typing indicator
    showTypingIndicator(true);

    try {
        console.log('📤 Sending message to chat:', currentChatId);
        const result = await messaging.sendMessage(currentChatId, content);
        console.log('✅ Message sent successfully:', result);

        // Immediately display the sent message in the sender's interface
        if (result && result.id) {
            const sentMessage = {
                id: result.id,
                chat_id: currentChatId,
                sender_id: messaging.currentUser.id,
                content: content,
                created_at: new Date().toISOString()
            };

            console.log('📨 Immediately displaying sent message:', sentMessage);
            handleNewMessage(sentMessage);
        }

        messageInput.value = '';
        showTypingIndicator(false);
    } catch (error) {
        console.error('❌ Error sending message:', error);
        alert(`Failed to send message: ${error.message}`);
        showTypingIndicator(false);
    }
}

// Handle Enter key press in message input
function handleMessageKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

// Utility functions
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesArea');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator(show) {
    // Optional typing indicator - can be enhanced later
    if (show) {
        console.log('📝 User is typing...');
    } else {
        console.log('📝 User stopped typing');
    }
}

function showErrorState() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('messagesContainer').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
}

// Navigation functions
function goBack() {
    window.location.href = 'student-dashboard.html';
}

function goBackToTutorDashboard() {
    window.location.href = 'tutor-dashboard.html';
}

function goBackToStudentDashboard() {
    window.location.href = 'student-dashboard.html';
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        messaging.unsubscribeFromAll();
        supabase.auth.signOut();
        window.location.href = 'index.html';
    }
}

// Update subscription status indicator
function updateSubscriptionIndicator(status) {
    const indicator = document.getElementById('subscriptionIndicator');
    if (!indicator) return;

    const dot = indicator.querySelector('.w-2');
    const text = indicator.querySelector('span');

    switch (status) {
        case 'connecting':
            dot.className = 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse';
            text.textContent = 'Connecting...';
            text.className = 'text-xs text-yellow-600';
            break;
        case 'connected':
            dot.className = 'w-2 h-2 bg-green-500 rounded-full';
            text.textContent = 'Real-time ON';
            text.className = 'text-xs text-green-600';
            break;
        case 'disconnected':
            dot.className = 'w-2 h-2 bg-red-500 rounded-full';
            text.textContent = 'Disconnected';
            text.className = 'text-xs text-red-600';
            break;
        case 'error':
            dot.className = 'w-2 h-2 bg-red-500 rounded-full animate-pulse';
            text.textContent = 'Connection Error';
            text.className = 'text-xs text-red-600';
            break;
    }
}

// Monitor subscription status
function monitorSubscriptionStatus() {
    setInterval(() => {
        if (messaging && messaging.globalSubscription) {
            const state = messaging.globalSubscription.state;
            console.log('🔍 Subscription state check:', state);

            switch (state) {
                case 'joined':
                    updateSubscriptionIndicator('connected');
                    break;
                case 'closed':
                case 'errored':
                    updateSubscriptionIndicator('error');
                    break;
                case 'joining':
                    updateSubscriptionIndicator('connecting');
                    break;
                default:
                    updateSubscriptionIndicator('disconnected');
            }
        } else {
            updateSubscriptionIndicator('disconnected');
        }
    }, 5000); // Check every 5 seconds
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (messaging) {
        messaging.unsubscribeFromAll();
    }
});
