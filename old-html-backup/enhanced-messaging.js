/**
 * Enhanced Messaging System
 * Advanced chat features for tutor-student communication
 */

class EnhancedMessaging {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.currentChatId = null;
        this.typingTimeout = null;
        this.messageCache = new Map();
        this.unreadCounts = new Map();
        this.isTyping = false;
        this.lastSeenMessages = new Map();
    }

    // Initialize enhanced messaging
    async initialize() {
        console.log('🚀 [ENHANCED-MSG] Initializing enhanced messaging system...');
        
        // Get current user
        const { data: { session } } = await this.supabase.auth.getSession();
        if (!session) {
            throw new Error('User not authenticated');
        }
        
        this.currentUser = session.user;
        console.log('✅ [ENHANCED-MSG] Enhanced messaging initialized for user:', this.currentUser.id);
        
        // Setup enhanced features
        this.setupTypingIndicators();
        this.setupMessageStatusTracking();
        this.setupEmojiSupport();
        this.setupFileSharing();
        
        return true;
    }

    // Setup typing indicators
    setupTypingIndicators() {
        console.log('⌨️ [ENHANCED-MSG] Setting up typing indicators...');
        
        const messageInput = document.getElementById('messageText');
        if (!messageInput) return;

        let typingTimer = null;
        
        messageInput.addEventListener('input', () => {
            if (!this.isTyping && this.currentChatId) {
                this.isTyping = true;
                this.sendTypingIndicator(true);
            }
            
            // Clear existing timer
            clearTimeout(typingTimer);
            
            // Set new timer to stop typing indicator
            typingTimer = setTimeout(() => {
                if (this.isTyping) {
                    this.isTyping = false;
                    this.sendTypingIndicator(false);
                }
            }, 2000);
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (this.isTyping) {
                    this.isTyping = false;
                    this.sendTypingIndicator(false);
                }
                this.sendMessage();
            }
        });
    }

    // Send typing indicator
    async sendTypingIndicator(isTyping) {
        if (!this.currentChatId) return;
        
        try {
            await this.supabase
                .from('typing_indicators')
                .upsert({
                    chat_id: this.currentChatId,
                    user_id: this.currentUser.id,
                    is_typing: isTyping,
                    updated_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error sending typing indicator:', error);
        }
    }

    // Setup message status tracking
    setupMessageStatusTracking() {
        console.log('📊 [ENHANCED-MSG] Setting up message status tracking...');
        
        // Subscribe to message status updates
        this.supabase
            .channel('message_status')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'message_status'
            }, (payload) => {
                this.handleMessageStatusUpdate(payload);
            })
            .subscribe();
    }

    // Handle message status updates
    handleMessageStatusUpdate(payload) {
        const { new: statusUpdate } = payload;
        if (!statusUpdate) return;

        const messageElement = document.querySelector(`[data-message-id="${statusUpdate.message_id}"]`);
        if (messageElement) {
            this.updateMessageStatusUI(messageElement, statusUpdate.status);
        }
    }

    // Update message status in UI
    updateMessageStatusUI(messageElement, status) {
        const statusIcon = messageElement.querySelector('.message-status');
        if (!statusIcon) return;

        // Remove existing status classes
        statusIcon.classList.remove('text-gray-400', 'text-blue-500', 'text-green-500');
        
        switch (status) {
            case 'sent':
                statusIcon.innerHTML = '✓';
                statusIcon.classList.add('text-gray-400');
                break;
            case 'delivered':
                statusIcon.innerHTML = '✓✓';
                statusIcon.classList.add('text-blue-500');
                break;
            case 'read':
                statusIcon.innerHTML = '✓✓';
                statusIcon.classList.add('text-green-500');
                break;
        }
    }

    // Setup emoji support
    setupEmojiSupport() {
        console.log('😊 [ENHANCED-MSG] Setting up emoji support...');
        
        // Add emoji picker button
        const messageInputContainer = document.querySelector('.message-input-container');
        if (!messageInputContainer) return;

        const emojiButton = document.createElement('button');
        emojiButton.type = 'button';
        emojiButton.className = 'emoji-btn px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors';
        emojiButton.innerHTML = '😊';
        emojiButton.onclick = () => this.toggleEmojiPicker();
        
        const sendButton = messageInputContainer.querySelector('button[onclick="sendMessage()"]');
        if (sendButton) {
            messageInputContainer.insertBefore(emojiButton, sendButton);
        }
    }

    // Toggle emoji picker
    toggleEmojiPicker() {
        let emojiPicker = document.getElementById('emojiPicker');
        
        if (!emojiPicker) {
            emojiPicker = this.createEmojiPicker();
            document.body.appendChild(emojiPicker);
        }
        
        emojiPicker.classList.toggle('hidden');
    }

    // Create emoji picker
    createEmojiPicker() {
        const emojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥', '💯', '👏', '🙏', '💪', '🤔', '😴'];
        
        const picker = document.createElement('div');
        picker.id = 'emojiPicker';
        picker.className = 'fixed bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 hidden';
        picker.style.width = '200px';
        
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-4 gap-2';
        
        emojis.forEach(emoji => {
            const button = document.createElement('button');
            button.textContent = emoji;
            button.className = 'text-2xl hover:bg-gray-100 rounded p-1 transition-colors';
            button.onclick = () => this.insertEmoji(emoji);
            grid.appendChild(button);
        });
        
        picker.appendChild(grid);
        return picker;
    }

    // Insert emoji into message input
    insertEmoji(emoji) {
        const messageInput = document.getElementById('messageText');
        if (messageInput) {
            const cursorPos = messageInput.selectionStart;
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(cursorPos);
            
            messageInput.value = textBefore + emoji + textAfter;
            messageInput.focus();
            messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        }
        
        // Hide emoji picker
        document.getElementById('emojiPicker').classList.add('hidden');
    }

    // Setup file sharing
    setupFileSharing() {
        console.log('📎 [ENHANCED-MSG] Setting up file sharing...');
        
        // Add file upload button
        const messageInputContainer = document.querySelector('.message-input-container');
        if (!messageInputContainer) return;

        const fileButton = document.createElement('button');
        fileButton.type = 'button';
        fileButton.className = 'file-btn px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors';
        fileButton.innerHTML = '📎';
        fileButton.onclick = () => this.openFileDialog();
        
        const emojiButton = messageInputContainer.querySelector('.emoji-btn');
        if (emojiButton) {
            messageInputContainer.insertBefore(fileButton, emojiButton);
        }

        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'fileInput';
        fileInput.className = 'hidden';
        fileInput.accept = 'image/*,application/pdf,.doc,.docx,.txt';
        fileInput.onchange = (e) => this.handleFileSelect(e);
        document.body.appendChild(fileInput);
    }

    // Open file dialog
    openFileDialog() {
        document.getElementById('fileInput').click();
    }

    // Handle file selection
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        try {
            // Show upload progress
            this.showFileUploadProgress(file.name);
            
            // Upload file to Supabase storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `chat-files/${this.currentUser.id}/${fileName}`;

            const { data, error } = await this.supabase.storage
                .from('chat-files')
                .upload(filePath, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('chat-files')
                .getPublicUrl(filePath);

            // Send file message
            await this.sendFileMessage(file.name, publicUrl, file.type);
            
            this.hideFileUploadProgress();
            
        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
            this.hideFileUploadProgress();
        }
    }

    // Show file upload progress
    showFileUploadProgress(fileName) {
        const progressDiv = document.createElement('div');
        progressDiv.id = 'fileUploadProgress';
        progressDiv.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        progressDiv.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span class="text-sm">Uploading ${fileName}...</span>
            </div>
        `;
        document.body.appendChild(progressDiv);
    }

    // Hide file upload progress
    hideFileUploadProgress() {
        const progressDiv = document.getElementById('fileUploadProgress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    // Send file message
    async sendFileMessage(fileName, fileUrl, fileType) {
        if (!this.currentChatId) return;

        const messageData = {
            chat_id: this.currentChatId,
            sender_id: this.currentUser.id,
            content: `📎 ${fileName}`,
            message_type: 'file',
            file_url: fileUrl,
            file_name: fileName,
            file_type: fileType,
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await this.supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ [ENHANCED-MSG] File message sent:', data);
            
        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error sending file message:', error);
            throw error;
        }
    }

    // Enhanced message sending
    async sendMessage() {
        const messageInput = document.getElementById('messageText');
        const content = messageInput.value.trim();

        if (!content || !this.currentChatId) return;

        try {
            // Clear typing indicator
            if (this.isTyping) {
                this.isTyping = false;
                this.sendTypingIndicator(false);
            }

            const messageData = {
                chat_id: this.currentChatId,
                sender_id: this.currentUser.id,
                content: content,
                message_type: 'text',
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();

            if (error) throw error;

            // Clear input
            messageInput.value = '';

            // Mark message as sent
            this.updateMessageStatus(data.id, 'sent');

            console.log('✅ [ENHANCED-MSG] Message sent:', data);

        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error sending message:', error);
            throw error;
        }
    }

    // Add message reactions
    async addReaction(messageId, reaction) {
        try {
            const { data, error } = await this.supabase
                .from('message_reactions')
                .upsert({
                    message_id: messageId,
                    user_id: this.currentUser.id,
                    reaction: reaction
                });

            if (error) throw error;
            console.log('✅ [ENHANCED-MSG] Reaction added:', reaction);

        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error adding reaction:', error);
        }
    }

    // Remove message reaction
    async removeReaction(messageId, reaction) {
        try {
            const { error } = await this.supabase
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('user_id', this.currentUser.id)
                .eq('reaction', reaction);

            if (error) throw error;
            console.log('✅ [ENHANCED-MSG] Reaction removed:', reaction);

        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error removing reaction:', error);
        }
    }

    // Search messages
    async searchMessages(query, chatId = null) {
        try {
            let queryBuilder = this.supabase
                .from('messages')
                .select('*, chats!inner(*)')
                .ilike('content', `%${query}%`)
                .order('created_at', { ascending: false });

            if (chatId) {
                queryBuilder = queryBuilder.eq('chat_id', chatId);
            } else {
                // Search in all user's chats
                queryBuilder = queryBuilder.or(
                    `chats.student_id.eq.${this.currentUser.id},chats.tutor_id.eq.${this.currentUser.id}`
                );
            }

            const { data, error } = await queryBuilder;
            if (error) throw error;

            return data;

        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error searching messages:', error);
            return [];
        }
    }

    // Get unread count for a chat
    async getUnreadCount(chatId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_unread_count', {
                    user_uuid: this.currentUser.id,
                    chat_uuid: chatId
                });

            if (error) throw error;
            return data || 0;

        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error getting unread count:', error);
            return 0;
        }
    }

    // Mark messages as read
    async markAsRead(chatId) {
        try {
            const { error } = await this.supabase
                .rpc('mark_messages_as_read', {
                    user_uuid: this.currentUser.id,
                    chat_uuid: chatId
                });

            if (error) throw error;
            console.log('✅ [ENHANCED-MSG] Messages marked as read');

        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error marking messages as read:', error);
        }
    }

    // Update message status
    async updateMessageStatus(messageId, status) {
        try {
            await this.supabase
                .from('message_status')
                .upsert({
                    message_id: messageId,
                    status: status,
                    updated_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('❌ [ENHANCED-MSG] Error updating message status:', error);
        }
    }

    // Set current chat
    setCurrentChat(chatId) {
        this.currentChatId = chatId;
        console.log('💬 [ENHANCED-MSG] Current chat set to:', chatId);
    }
}

// Export for use in other files
window.EnhancedMessaging = EnhancedMessaging;

console.log('✅ [ENHANCED-MSG] Enhanced messaging system loaded');
