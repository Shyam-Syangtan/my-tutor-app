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
            throw new Error('User not authenticated');
        }

        const { data: message, error } = await this.supabase
            .from('messages')
            .insert({
                chat_id: chatId,
                sender_id: this.currentUser.id,
                content: content
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Update chat's updated_at timestamp
        await this.supabase
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', chatId);

        return message;
    }

    // Subscribe to real-time messages for a chat
    subscribeToChat(chatId, onMessage) {
        this.currentChatId = chatId;
        
        this.subscription = this.supabase
            .channel(`chat-${chatId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`
            }, (payload) => {
                onMessage(payload.new);
            })
            .subscribe();

        return this.subscription;
    }

    // Unsubscribe from real-time updates
    unsubscribeFromChat() {
        if (this.subscription) {
            this.supabase.removeChannel(this.subscription);
            this.subscription = null;
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
