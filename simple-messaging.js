/**
 * Simple Messaging System
 * Works with the clean database schema
 */

class SimpleMessaging {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.currentChatId = null;
        this.subscription = null;
        this.globalSubscription = null; // For all user's messages
        this.messageHandlers = new Map(); // Store message handlers for different chats
    }

    // Initialize the messaging system
    async initialize() {
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;
        return user;
    }

    // Get or create a chat between two users
    async getOrCreateChat(otherUserId) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        console.log('🔍 Getting or creating chat between:', this.currentUser.id, 'and', otherUserId);

        // Check if chat already exists (either direction)
        const { data: existingChat, error: searchError } = await this.supabase
            .from('chats')
            .select('*')
            .or(`and(user1_id.eq.${this.currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${this.currentUser.id})`)
            .single();

        if (existingChat) {
            console.log('✅ Found existing chat:', existingChat.id);
            return existingChat.id;
        }

        console.log('📝 Creating new chat...');

        // Create new chat
        const { data: newChat, error: createError } = await this.supabase
            .from('chats')
            .insert({
                user1_id: this.currentUser.id,
                user2_id: otherUserId
            })
            .select()
            .single();

        if (createError) {
            console.error('❌ Error creating chat:', createError);
            throw createError;
        }

        console.log('✅ Created new chat:', newChat.id);
        return newChat.id;
    }

    // Get user's chats
    async getUserChats() {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        console.log('🔍 Fetching chats for user:', this.currentUser.id);

        const { data: chats, error } = await this.supabase
            .from('chats')
            .select(`
                *,
                messages(content, created_at, sender_id)
            `)
            .or(`user1_id.eq.${this.currentUser.id},user2_id.eq.${this.currentUser.id}`)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching chats:', error);
            throw error;
        }

        console.log('📋 Raw chats data:', chats);

        // Process chats to get other user info and latest message
        const processedChats = await Promise.all(chats.map(async (chat) => {
            const otherUserId = chat.user1_id === this.currentUser.id ? chat.user2_id : chat.user1_id;

            // Try to get other user info from students table first, then tutors table
            let otherUser = {
                id: otherUserId,
                name: `User ${otherUserId.slice(0, 8)}`,
                email: `user@example.com`
            };

            try {
                // Check students table first
                const { data: studentData } = await this.supabase
                    .from('students')
                    .select('name, email')
                    .eq('id', otherUserId)
                    .single();

                if (studentData) {
                    otherUser = {
                        id: otherUserId,
                        name: studentData.name || `Student ${otherUserId.slice(0, 8)}`,
                        email: studentData.email || `user@example.com`
                    };
                } else {
                    // Check tutors table
                    const { data: tutorData } = await this.supabase
                        .from('tutors')
                        .select('name, email')
                        .eq('user_id', otherUserId)
                        .single();

                    if (tutorData) {
                        otherUser = {
                            id: otherUserId,
                            name: tutorData.name || `Tutor ${otherUserId.slice(0, 8)}`,
                            email: tutorData.email || `tutor@example.com`
                        };
                    }
                }
            } catch (error) {
                console.log('Could not fetch user details for:', otherUserId);
            }

            // Get latest message
            const latestMessage = chat.messages && chat.messages.length > 0
                ? chat.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                : null;

            console.log(`💬 Chat ${chat.id} with ${otherUser.name}:`, {
                messagesCount: chat.messages?.length || 0,
                latestMessage: latestMessage?.content || 'No messages yet'
            });

            return {
                id: chat.id,
                otherUser,
                latestMessage,
                created_at: chat.created_at,
                updated_at: chat.updated_at
            };
        }));

        return processedChats;
    }

    // Get messages for a specific chat
    async getChatMessages(chatId) {
        const { data: messages, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        return messages;
    }

    // Send a message
    async sendMessage(chatId, content) {
        if (!this.currentUser) {
            console.error('❌ User not authenticated for message sending');
            throw new Error('User not authenticated');
        }

        console.log('📤 SimpleMessaging.sendMessage called:', {
            chatId,
            content,
            senderId: this.currentUser.id,
            userEmail: this.currentUser.email
        });

        const messageData = {
            chat_id: chatId,
            sender_id: this.currentUser.id,
            content: content
        };

        console.log('📝 Inserting message data:', messageData);

        const { data: message, error } = await this.supabase
            .from('messages')
            .insert(messageData)
            .select()
            .single();

        if (error) {
            console.error('❌ Database error inserting message:', error);
            throw error;
        }

        console.log('✅ Message inserted successfully:', message);

        // Update chat's updated_at timestamp
        console.log('🔄 Updating chat timestamp for chat:', chatId);
        const { error: updateError } = await this.supabase
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', chatId);

        if (updateError) {
            console.error('⚠️ Warning: Failed to update chat timestamp:', updateError);
        } else {
            console.log('✅ Chat timestamp updated successfully');
        }

        return message;
    }

    // Subscribe to ALL messages and filter client-side (simple and reliable)
    async subscribeToAllUserMessages(onMessage) {
        if (!this.currentUser) {
            console.error('❌ Cannot subscribe: User not authenticated');
            return;
        }

        console.log('🔔 Subscribing to ALL messages (client-side filtering) for user:', this.currentUser.id);

        // Store callback for reconnection
        this.lastOnMessageCallback = onMessage;

        // Unsubscribe from previous global subscription
        this.unsubscribeFromAllMessages();

        // Subscribe to ALL messages in the messages table
        this.globalSubscription = this.supabase
            .channel('all-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
                // No filter - we'll filter client-side
            }, async (payload) => {
                console.log('📨 Raw real-time message received:', payload.new);

                // Check if this message is for a chat the current user is part of
                const messageForUser = await this.isMessageForUser(payload.new);

                if (messageForUser) {
                    console.log('✅ Message is for current user, processing...');
                    onMessage(payload.new);
                } else {
                    console.log('❌ Message not for current user, ignoring');
                }
            })
            .subscribe((status) => {
                console.log('🔔 Global subscription status changed:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to real-time messages');
                } else if (status === 'CLOSED') {
                    console.error('❌ Subscription closed - will not auto-reconnect to prevent loops');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Subscription error - will not auto-retry to prevent loops');
                }
            });

        // Add subscription health monitoring
        this.startSubscriptionHealthCheck();

        return this.globalSubscription;
    }

    // Check if a message is for the current user
    async isMessageForUser(message) {
        try {
            console.log('🔍 Checking if message is for user:', {
                messageId: message.id,
                chatId: message.chat_id,
                senderId: message.sender_id,
                currentUserId: this.currentUser.id,
                content: message.content.substring(0, 50) + '...'
            });

            // Check if the message's chat involves the current user
            const { data: chat, error } = await this.supabase
                .from('chats')
                .select('user1_id, user2_id')
                .eq('id', message.chat_id)
                .single();

            if (error) {
                console.error('❌ Database error fetching chat:', error);
                return false;
            }

            if (!chat) {
                console.log('❌ Could not find chat for message:', message.chat_id);
                return false;
            }

            const isUserInChat = chat.user1_id === this.currentUser.id || chat.user2_id === this.currentUser.id;
            const isSentByUser = message.sender_id === this.currentUser.id;

            console.log('🔍 Message chat analysis:', {
                chatId: message.chat_id,
                user1: chat.user1_id,
                user2: chat.user2_id,
                currentUser: this.currentUser.id,
                senderId: message.sender_id,
                isUserInChat,
                isSentByUser,
                shouldProcess: isUserInChat
            });

            return isUserInChat;
        } catch (error) {
            console.error('❌ Error checking if message is for user:', error);
            return false;
        }
    }

    // Subscribe to real-time messages for a specific chat (legacy method)
    subscribeToChat(chatId, onMessage) {
        this.currentChatId = chatId;
        this.messageHandlers.set(chatId, onMessage);

        console.log('🔔 Subscribing to real-time messages for chat:', chatId);

        this.subscription = this.supabase
            .channel(`chat-${chatId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`
            }, (payload) => {
                console.log('📨 Real-time message received for chat:', payload.new);
                onMessage(payload.new);
            })
            .subscribe((status) => {
                console.log('🔔 Chat subscription status:', status);
            });

        return this.subscription;
    }

    // Unsubscribe from global messages
    unsubscribeFromAllMessages() {
        if (this.globalSubscription) {
            console.log('🔕 Unsubscribing from global messages');
            this.supabase.removeChannel(this.globalSubscription);
            this.globalSubscription = null;
        }
    }

    // Unsubscribe from specific chat
    unsubscribeFromChat() {
        if (this.subscription) {
            console.log('🔕 Unsubscribing from current chat');
            this.supabase.removeChannel(this.subscription);
            this.subscription = null;
        }
    }

    // Unsubscribe from all subscriptions
    unsubscribeFromAll() {
        this.unsubscribeFromAllMessages();
        this.unsubscribeFromChat();
        this.messageHandlers.clear();
        this.stopSubscriptionHealthCheck();
    }

    // Start subscription health monitoring
    startSubscriptionHealthCheck() {
        // Clear any existing health check
        this.stopSubscriptionHealthCheck();

        console.log('🏥 Starting subscription health monitoring...');
        this.healthCheckInterval = setInterval(() => {
            if (this.globalSubscription) {
                const state = this.globalSubscription.state;
                console.log('🏥 Subscription health check - State:', state);

                if (state === 'closed' || state === 'errored') {
                    console.error('❌ Subscription unhealthy, attempting reconnection...');
                    this.reconnectSubscription();
                }
            }
        }, 30000); // Check every 30 seconds
    }

    // Stop subscription health monitoring
    stopSubscriptionHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('🏥 Stopped subscription health monitoring');
        }
    }

    // Reconnect subscription if it fails
    async reconnectSubscription() {
        console.log('🔄 Attempting to reconnect subscription...');
        try {
            this.unsubscribeFromAllMessages();
            // Wait a moment before reconnecting
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Note: We need to store the onMessage callback to reconnect properly
            if (this.lastOnMessageCallback) {
                await this.subscribeToAllUserMessages(this.lastOnMessageCallback);
            }
        } catch (error) {
            console.error('❌ Failed to reconnect subscription:', error);
        }
    }

    // Contact a teacher (create chat and redirect)
    async contactTeacher(teacherUserId) {
        try {
            const chatId = await this.getOrCreateChat(teacherUserId);
            return chatId;
        } catch (error) {
            console.error('Error contacting teacher:', error);
            throw error;
        }
    }
}

// Export for use in other files
window.SimpleMessaging = SimpleMessaging;
