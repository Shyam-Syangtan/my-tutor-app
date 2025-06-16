/**
 * Lesson Status Notifications System
 * Handles real-time notifications for lesson request status changes
 */

class LessonStatusNotifications {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.subscription = null;
        this.lastChecked = new Date();
    }

    // Initialize the notification system
    async initialize() {
        try {
            // Get current user
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error || !user) {
                console.log('🔔 [NOTIFICATIONS] No user logged in, skipping notifications');
                return false;
            }

            this.currentUser = user;
            console.log('🔔 [NOTIFICATIONS] Initializing for user:', user.id);

            // Set up real-time subscription for lesson requests
            this.setupLessonRequestSubscription();
            
            // Set up real-time subscription for lessons
            this.setupLessonSubscription();

            // Check for recent status changes on initialization
            await this.checkRecentStatusChanges();

            return true;
        } catch (error) {
            console.error('❌ [NOTIFICATIONS] Failed to initialize:', error);
            return false;
        }
    }

    // Set up real-time subscription for lesson requests
    setupLessonRequestSubscription() {
        console.log('🔔 [NOTIFICATIONS] Setting up lesson request subscription...');
        
        this.requestSubscription = this.supabase
            .channel('lesson_requests_changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'lesson_requests',
                filter: `student_id=eq.${this.currentUser.id}`
            }, (payload) => {
                console.log('🔔 [NOTIFICATIONS] Lesson request updated:', payload);
                this.handleLessonRequestUpdate(payload);
            })
            .subscribe();
    }

    // Set up real-time subscription for lessons
    setupLessonSubscription() {
        console.log('🔔 [NOTIFICATIONS] Setting up lesson subscription...');
        
        this.lessonSubscription = this.supabase
            .channel('lessons_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'lessons',
                filter: `student_id=eq.${this.currentUser.id}`
            }, (payload) => {
                console.log('🔔 [NOTIFICATIONS] New lesson created:', payload);
                this.handleNewLesson(payload);
            })
            .subscribe();
    }

    // Handle lesson request status updates
    handleLessonRequestUpdate(payload) {
        const { new: newRecord, old: oldRecord } = payload;
        
        // Check if status changed
        if (newRecord.status !== oldRecord.status) {
            console.log('🔔 [NOTIFICATIONS] Status changed:', {
                from: oldRecord.status,
                to: newRecord.status,
                requestId: newRecord.id
            });

            switch (newRecord.status) {
                case 'approved':
                    this.showApprovalNotification(newRecord);
                    break;
                case 'declined':
                    this.showDeclineNotification(newRecord);
                    break;
            }
        }
    }

    // Handle new lesson creation
    handleNewLesson(payload) {
        const lesson = payload.new;
        
        if (lesson.status === 'confirmed') {
            console.log('🔔 [NOTIFICATIONS] New confirmed lesson created:', lesson);
            this.showNewLessonNotification(lesson);
        }
    }

    // Show approval notification
    showApprovalNotification(request) {
        const date = new Date(request.requested_date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
        
        const time = this.formatTime(request.requested_start_time);
        
        this.showNotification(
            '✅ Lesson Request Approved!',
            `Your lesson for ${date} at ${time} has been approved and added to your upcoming lessons.`,
            'success',
            8000
        );

        // Update page title to show notification
        this.updatePageTitle('✅ Lesson Approved!');
    }

    // Show decline notification
    showDeclineNotification(request) {
        const date = new Date(request.requested_date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
        
        const time = this.formatTime(request.requested_start_time);
        
        this.showNotification(
            '❌ Lesson Request Declined',
            `Your lesson request for ${date} at ${time} was declined. ${request.tutor_response || 'You can try booking a different time.'}`,
            'error',
            10000
        );

        // Update page title to show notification
        this.updatePageTitle('❌ Request Declined');
    }

    // Show new lesson notification
    showNewLessonNotification(lesson) {
        const date = new Date(lesson.lesson_date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
        
        const time = this.formatTime(lesson.start_time);
        
        this.showNotification(
            '📅 New Lesson Confirmed!',
            `Your lesson for ${date} at ${time} is now confirmed and ready!`,
            'success',
            6000
        );
    }

    // Show notification popup
    showNotification(title, message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 max-w-sm bg-white border-l-4 rounded-lg shadow-lg z-50 p-4 ${
            type === 'success' ? 'border-green-500' : 
            type === 'error' ? 'border-red-500' : 
            'border-blue-500'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-1">
                    <div class="font-semibold text-gray-900 mb-1">${title}</div>
                    <div class="text-sm text-gray-600">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="ml-2 text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // Add click sound (if available)
        this.playNotificationSound();
    }

    // Update page title temporarily
    updatePageTitle(message) {
        const originalTitle = document.title;
        document.title = message;
        
        setTimeout(() => {
            document.title = originalTitle;
        }, 5000);
    }

    // Play notification sound
    playNotificationSound() {
        try {
            // Create a simple notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Ignore audio errors
        }
    }

    // Check for recent status changes (for when user loads page)
    async checkRecentStatusChanges() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            
            // Check for recently approved/declined requests
            const { data: recentRequests, error } = await this.supabase
                .from('lesson_requests')
                .select('*')
                .eq('student_id', this.currentUser.id)
                .in('status', ['approved', 'declined'])
                .gte('updated_at', fiveMinutesAgo);

            if (error) {
                console.error('❌ [NOTIFICATIONS] Error checking recent changes:', error);
                return;
            }

            // Show notifications for recent changes
            recentRequests?.forEach(request => {
                if (request.status === 'approved') {
                    setTimeout(() => this.showApprovalNotification(request), 1000);
                } else if (request.status === 'declined') {
                    setTimeout(() => this.showDeclineNotification(request), 1000);
                }
            });

        } catch (error) {
            console.error('❌ [NOTIFICATIONS] Error checking recent status changes:', error);
        }
    }

    // Format time helper
    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }

    // Clean up subscriptions
    cleanup() {
        if (this.requestSubscription) {
            this.supabase.removeChannel(this.requestSubscription);
        }
        if (this.lessonSubscription) {
            this.supabase.removeChannel(this.lessonSubscription);
        }
        console.log('🔔 [NOTIFICATIONS] Cleaned up subscriptions');
    }
}

// Global instance
let lessonNotifications;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for supabase to be available
    setTimeout(() => {
        if (typeof supabase !== 'undefined') {
            lessonNotifications = new LessonStatusNotifications(supabase);
            lessonNotifications.initialize();
        }
    }, 1000);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (lessonNotifications) {
        lessonNotifications.cleanup();
    }
});

// Make available globally
window.LessonStatusNotifications = LessonStatusNotifications;
