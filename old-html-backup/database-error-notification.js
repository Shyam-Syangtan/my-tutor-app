/**
 * Database Error Notification System
 * Shows prominent notifications when critical database tables are missing
 */

class DatabaseErrorNotification {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.notificationShown = false;
    }

    // Check for missing tables and show notifications
    async checkDatabaseHealth() {
        console.log('🔍 [DB-CHECK] Checking database health...');
        
        const missingTables = [];
        
        // Check lesson_requests table
        try {
            const { data, error } = await this.supabase
                .from('lesson_requests')
                .select('*')
                .limit(1);
                
            if (error && error.message.includes('relation "lesson_requests" does not exist')) {
                missingTables.push('lesson_requests');
            }
        } catch (error) {
            if (error.message.includes('lesson_requests')) {
                missingTables.push('lesson_requests');
            }
        }

        // Check other critical tables
        const criticalTables = ['users', 'tutors', 'lessons', 'tutor_availability'];
        
        for (const table of criticalTables) {
            try {
                const { data, error } = await this.supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (error && error.message.includes(`relation "${table}" does not exist`)) {
                    missingTables.push(table);
                }
            } catch (error) {
                if (error.message.includes(table)) {
                    missingTables.push(table);
                }
            }
        }

        if (missingTables.length > 0) {
            console.error('🚨 [DB-CHECK] Missing tables detected:', missingTables);
            this.showMissingTableNotification(missingTables);
        } else {
            console.log('✅ [DB-CHECK] All critical tables exist');
        }

        return missingTables;
    }

    // Show prominent notification for missing tables
    showMissingTableNotification(missingTables) {
        if (this.notificationShown) return;
        this.notificationShown = true;

        const notification = document.createElement('div');
        notification.id = 'databaseErrorNotification';
        notification.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 shadow-lg';
        
        const isLessonRequestsMissing = missingTables.includes('lesson_requests');
        
        notification.innerHTML = `
            <div class="max-w-6xl mx-auto flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="text-2xl">🚨</div>
                    <div>
                        <div class="font-bold text-lg">CRITICAL DATABASE ERROR</div>
                        <div class="text-sm">
                            Missing tables: <strong>${missingTables.join(', ')}</strong>
                            ${isLessonRequestsMissing ? ' - This breaks the booking system!' : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    ${isLessonRequestsMissing ? `
                        <a href="create-missing-table.html" 
                           class="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition-colors">
                            🔧 FIX NOW
                        </a>
                    ` : ''}
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="text-white hover:text-gray-200 text-xl font-bold">
                        ×
                    </button>
                </div>
            </div>
        `;

        document.body.insertBefore(notification, document.body.firstChild);

        // Auto-hide after 30 seconds unless it's the critical lesson_requests table
        if (!isLessonRequestsMissing) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 30000);
        }

        console.log('🚨 [DB-CHECK] Database error notification displayed');
    }

    // Show success notification when tables are created
    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-xl">✅</div>
                <div>
                    <div class="font-bold">Database Fixed!</div>
                    <div class="text-sm">All required tables are now available</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Check if lesson_requests table specifically exists
    async checkLessonRequestsTable() {
        try {
            const { data, error } = await this.supabase
                .from('lesson_requests')
                .select('count')
                .limit(1);
                
            if (error && error.message.includes('relation "lesson_requests" does not exist')) {
                return false;
            }
            return true;
        } catch (error) {
            if (error.message.includes('lesson_requests')) {
                return false;
            }
            return true;
        }
    }

    // Show specific notification for booking system issues
    showBookingSystemError() {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-orange-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        
        notification.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="text-xl">⚠️</div>
                <div>
                    <div class="font-bold">Booking System Error</div>
                    <div class="text-sm mb-2">Enhanced booking modal unavailable. Using fallback mode.</div>
                    <a href="create-missing-table.html" 
                       class="text-orange-200 underline hover:text-white text-xs">
                        Fix database issues →
                    </a>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="text-orange-200 hover:text-white font-bold">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
}

// Global instance
let dbErrorNotification;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for supabase to be available
    setTimeout(() => {
        if (typeof supabase !== 'undefined') {
            dbErrorNotification = new DatabaseErrorNotification(supabase);
            dbErrorNotification.checkDatabaseHealth();
        }
    }, 1000);
});

// Make available globally
window.DatabaseErrorNotification = DatabaseErrorNotification;
