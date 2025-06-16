// Student Dashboard JavaScript
class StudentDashboard {
    constructor() {
        this.tutors = [];
        this.availability = [];
        this.lessons = [];
        this.selectedAvailability = null;
        this.userNameResolver = null; // Will be initialized in init()
        this.init();
    }

    async init() {
        // Wait for auth handler to be ready
        if (!window.authHandler) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Require student role
        if (!window.authHandler.requireRole('student')) {
            return;
        }

        await this.loadUserInfo();

        // Initialize user name resolver
        this.userNameResolver = new window.UserNameResolver(
            window.authHandler.supabase,
            window.authHandler
        );

        await this.loadData();
        this.setupEventListeners();
        this.renderTutors();
        await this.renderLessonsWithNames(); // Use new method with name resolution
        this.updateStats();

        // Periodic refresh disabled to prevent flickering
        // this.setupPeriodicRefresh();

        // Load unread message count
        this.loadUnreadMessageCount();

        // Setup real-time unread count updates
        this.setupUnreadCountSubscription();
    }

    async loadUserInfo() {
        const profile = window.authHandler.getUserProfile();
        if (profile) {
            document.getElementById('userName').textContent = profile.name || profile.email;
            document.getElementById('userAvatar').src = profile.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email)}&background=3b82f6&color=fff`;
        }
    }

    async loadData() {
        await Promise.all([
            this.loadTutors(),
            this.loadAvailability(),
            this.loadLessons()
        ]);
    }

    async loadTutors() {
        try {
            const { data, error } = await window.authHandler.supabase
                .from('students')
                .select('*')
                .eq('role', 'tutor');

            if (error) throw error;
            this.tutors = data || [];
        } catch (error) {
            console.error('Error loading tutors:', error);
            this.showNotification('Error loading tutors', 'error');
        }
    }

    async loadAvailability() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await window.authHandler.supabase
                .from('availability')
                .select(`
                    *,
                    tutor:tutor_id (
                        name,
                        email,
                        profile_picture
                    )
                `)
                .eq('is_booked', false)
                .gte('lesson_date', today)
                .order('lesson_date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;
            this.availability = data || [];
        } catch (error) {
            console.error('Error loading availability:', error);
            this.showNotification('Error loading availability', 'error');
        }
    }

    async loadLessons() {
        try {
            const currentUser = window.authHandler.getCurrentUser();
            if (!currentUser) {
                this.lessons = [];
                return;
            }

            console.log('📚 [STUDENT] Loading lessons for student:', currentUser.id);

            // EMERGENCY SIMPLIFIED APPROACH - prevent flickering
            let lessonsData = [];

            // Single simple query to prevent flickering
            try {
                const { data: basicLessons, error: basicError } = await window.authHandler.supabase
                    .from('lessons')
                    .select('*')
                    .eq('student_id', currentUser.id)
                    .order('lesson_date', { ascending: true })
                    .order('start_time', { ascending: true });

                if (!basicError && basicLessons) {
                    // Simple approach - just use basic lesson data with minimal processing
                    lessonsData = basicLessons.map(lesson => ({
                        ...lesson,
                        tutor_name: 'Tutor', // Simplified to prevent complex queries
                        tutor_email: 'tutor@example.com'
                    }));
                    console.log('✅ [STUDENT] Simplified query successful, found', lessonsData.length, 'lessons');
                } else {
                    console.warn('⚠️ [STUDENT] Simplified query failed:', basicError?.message);
                    lessonsData = [];
                }
            } catch (error) {
                console.warn('⚠️ [STUDENT] Exception in simplified query:', error.message);
                lessonsData = [];
            }



            // Set the lessons data
            this.lessons = lessonsData || [];
            console.log(`✅ [STUDENT] Successfully loaded ${this.lessons.length} lessons`);

        } catch (error) {
            console.error('❌ [STUDENT] Error loading lessons:', error);
            this.lessons = [];
        }
    }

    // Add method to refresh lessons
    async refreshLessons() {
        await this.loadLessons();
        this.renderLessons();
        this.updateStats();
        console.log('Lessons refreshed');
    }

    // Set up periodic refresh for lessons
    setupPeriodicRefresh() {
        // Refresh lessons every 15 seconds to catch newly approved lessons
        setInterval(async () => {
            const previousCount = this.lessons.length;
            const previousLessonIds = this.lessons.map(l => l.id);

            await this.loadLessons();

            // Check for new lessons
            const newLessons = this.lessons.filter(lesson =>
                !previousLessonIds.includes(lesson.id)
            );

            if (newLessons.length > 0) {
                console.log('🎉 New lessons detected:', newLessons.length);
                this.renderLessons();
                this.updateStats();

                // Show notification for each new lesson
                newLessons.forEach(lesson => {
                    const tutorName = lesson.tutor_name || 'Your tutor';
                    const lessonDate = this.formatDate(lesson.lesson_date);
                    const lessonTime = this.formatTime(lesson.start_time);
                    this.showNotification(
                        `✅ Lesson approved! ${tutorName} on ${lessonDate} at ${lessonTime}`,
                        'success'
                    );
                });
            } else if (this.lessons.length !== previousCount) {
                // Lesson count changed but no new IDs (might be updates)
                console.log('Lesson data updated, refreshing display');
                this.renderLessons();
                this.updateStats();
            }
        }, 15000); // 15 seconds for faster detection
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('signOutBtn').addEventListener('click', () => {
            window.authHandler.signOut();
        });

        // Modal handlers
        document.getElementById('cancelBooking').addEventListener('click', () => {
            this.hideBookingModal();
        });

        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.bookLesson();
        });

        // Close modal on outside click
        document.getElementById('bookingModal').addEventListener('click', (e) => {
            if (e.target.id === 'bookingModal') {
                this.hideBookingModal();
            }
        });
    }

    renderTutors() {
        const tutorsList = document.getElementById('tutorsList');
        
        if (this.tutors.length === 0) {
            tutorsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-user-graduate text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">No tutors available at the moment</p>
                </div>
            `;
            return;
        }

        tutorsList.innerHTML = this.tutors.map(tutor => {
            const tutorAvailability = this.availability.filter(a => a.tutor_id === tutor.id);
            
            return `
                <div class="tutor-card bg-gray-50 rounded-lg p-6 mb-4 border">
                    <div class="flex items-start space-x-4">
                        <img src="${tutor.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name || tutor.email)}&background=3b82f6&color=fff`}"
                             alt="${tutor.name}"
                             class="w-16 h-16 rounded-full object-cover">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">${tutor.name || tutor.email}</h3>
                            <p class="text-sm text-gray-600 mb-3">${tutor.email}</p>
                            
                            <div class="mb-4">
                                <h4 class="text-sm font-medium text-gray-700 mb-2">Available Times:</h4>
                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    ${tutorAvailability.slice(0, 6).map(slot => `
                                        <button onclick="studentDashboard.showBookingModal('${slot.id}')" 
                                                class="available-slot px-3 py-2 rounded-lg text-xs font-medium">
                                            ${this.formatDate(slot.lesson_date)} ${this.formatTime(slot.start_time)}
                                        </button>
                                    `).join('')}
                                    ${tutorAvailability.length > 6 ? `
                                        <div class="text-xs text-gray-500 flex items-center justify-center">
                                            +${tutorAvailability.length - 6} more
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // New method that resolves user names properly
    async renderLessonsWithNames() {
        const myLessons = document.getElementById('myLessons');

        // Filter for upcoming lessons with better date handling
        const now = new Date();
        const upcomingLessons = this.lessons.filter(lesson => {
            if (!lesson.lesson_date || !lesson.start_time) return false;

            try {
                const lessonDateTime = new Date(lesson.lesson_date + 'T' + lesson.start_time);
                return lessonDateTime > now && lesson.status === 'confirmed';
            } catch (error) {
                console.warn('Invalid lesson date/time:', lesson);
                return false;
            }
        });

        console.log(`Rendering ${upcomingLessons.length} upcoming lessons out of ${this.lessons.length} total`);

        if (upcomingLessons.length === 0) {
            myLessons.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-calendar-alt text-3xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500 text-sm">No upcoming lessons</p>
                    <p class="text-xs text-gray-400 mt-2">Approved lessons will appear here automatically</p>
                    <p class="text-xs text-gray-400 mt-1">Total lessons found: ${this.lessons.length}</p>
                </div>
            `;
            return;
        }

        // Show loading state first
        myLessons.innerHTML = `
            <div class="text-center py-4">
                <p class="text-gray-500">Loading lesson details...</p>
            </div>
        `;

        try {
            // Resolve tutor names for all lessons
            const tutorIds = upcomingLessons.map(lesson => lesson.tutor_id);
            const tutorNames = await this.userNameResolver.batchGetUserNames(tutorIds, 'tutor');

            // Render lessons with resolved names
            myLessons.innerHTML = upcomingLessons.map(lesson => {
                const tutorName = tutorNames.get(lesson.tutor_id) || 'Tutor';
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorName)}&background=ffffff&color=3b82f6`;

                return `
                    <div class="booked-lesson rounded-lg p-4 mb-3 border-l-4 border-green-500">
                        <div class="flex items-center space-x-3">
                            <img src="${avatarUrl}"
                                 alt="${tutorName}"
                                 class="w-10 h-10 rounded-full object-cover">
                            <div class="flex-1">
                                <h4 class="font-medium text-sm text-gray-900">${tutorName}</h4>
                                <p class="text-xs text-gray-600">${this.formatDate(lesson.lesson_date)} at ${this.formatTime(lesson.start_time)}</p>
                                <p class="text-xs text-gray-500 capitalize">
                                    ${lesson.lesson_type || 'conversation_practice'} lesson - ₹${lesson.price || 500}
                                    <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                        ${lesson.status || 'confirmed'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            console.log('✅ [STUDENT] Lessons rendered with resolved tutor names');
        } catch (error) {
            console.error('❌ [STUDENT] Error resolving tutor names:', error);
            // Fallback to basic rendering
            this.renderLessons();
        }
    }

    // Keep original method as fallback
    renderLessons() {
        const myLessons = document.getElementById('myLessons');

        // Filter for upcoming lessons with better date handling
        const now = new Date();
        const upcomingLessons = this.lessons.filter(lesson => {
            if (!lesson.lesson_date || !lesson.start_time) return false;

            try {
                const lessonDateTime = new Date(lesson.lesson_date + 'T' + lesson.start_time);
                return lessonDateTime > now && lesson.status === 'confirmed';
            } catch (error) {
                console.warn('Invalid lesson date/time:', lesson);
                return false;
            }
        });

        if (upcomingLessons.length === 0) {
            myLessons.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-calendar-alt text-3xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500 text-sm">No upcoming lessons</p>
                    <p class="text-xs text-gray-400 mt-2">Approved lessons will appear here automatically</p>
                    <p class="text-xs text-gray-400 mt-1">Total lessons found: ${this.lessons.length}</p>
                </div>
            `;
            return;
        }

        myLessons.innerHTML = upcomingLessons.map(lesson => {
            // Handle different data formats for tutor info
            const tutorName = lesson.tutor_name || lesson.tutor?.name || lesson.tutor?.email || 'Tutor';
            const tutorPicture = lesson.tutor_profile_picture || lesson.tutor?.profile_picture || lesson.tutor?.photo_url;
            const avatarUrl = tutorPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorName)}&background=ffffff&color=3b82f6`;

            return `
                <div class="booked-lesson rounded-lg p-4 mb-3 border-l-4 border-green-500">
                    <div class="flex items-center space-x-3">
                        <img src="${avatarUrl}"
                             alt="${tutorName}"
                             class="w-10 h-10 rounded-full object-cover"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(tutorName)}&background=ffffff&color=3b82f6'">
                        <div class="flex-1">
                            <h4 class="font-medium text-sm text-gray-900">${tutorName}</h4>
                            <p class="text-xs text-gray-600">${this.formatDate(lesson.lesson_date)} at ${this.formatTime(lesson.start_time)}</p>
                            <p class="text-xs text-gray-500 capitalize">
                                ${lesson.lesson_type || 'conversation_practice'} lesson - ₹${lesson.price || 500}
                                <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    ${lesson.status || 'confirmed'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showBookingModal(availabilityId) {
        console.log('🎯 [BOOKING] showBookingModal called with availabilityId:', availabilityId);

        const availability = this.availability.find(a => a.id === availabilityId);
        if (!availability) {
            console.error('❌ [BOOKING] Availability not found for ID:', availabilityId);
            return;
        }

        console.log('✅ [BOOKING] Found availability:', availability);
        this.selectedAvailability = availability;

        const bookingDetails = document.getElementById('bookingDetails');
        if (!bookingDetails) {
            console.error('❌ [BOOKING] bookingDetails element not found');
            return;
        }

        bookingDetails.innerHTML = `
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-3 mb-3">
                    <img src="${availability.tutor?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(availability.tutor?.name || 'Tutor')}&background=3b82f6&color=fff`}"
                         alt="${availability.tutor?.name}"
                         class="w-12 h-12 rounded-full object-cover">
                    <div>
                        <h4 class="font-semibold text-gray-900">${availability.tutor?.name || 'Tutor'}</h4>
                        <p class="text-sm text-gray-600">${availability.tutor?.email}</p>
                    </div>
                </div>
                <div class="text-sm text-gray-700">
                    <p><strong>Date:</strong> ${this.formatDate(availability.lesson_date)}</p>
                    <p><strong>Time:</strong> ${this.formatTime(availability.start_time)} - ${this.formatTime(availability.end_time)}</p>
                </div>
            </div>
        `;

        const modal = document.getElementById('bookingModal');
        if (!modal) {
            console.error('❌ [BOOKING] bookingModal element not found');
            return;
        }

        console.log('📱 [BOOKING] Opening booking modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        console.log('✅ [BOOKING] Booking modal opened successfully');
    }

    hideBookingModal() {
        console.log('📱 [BOOKING] Hiding booking modal');

        const modal = document.getElementById('bookingModal');
        const form = document.getElementById('bookingForm');

        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        if (form) {
            form.reset();
        }

        this.selectedAvailability = null;
        console.log('✅ [BOOKING] Booking modal hidden and data cleared');
    }

    async bookLesson() {
        console.log('📝 [BOOKING] bookLesson called');
        console.log('📝 [BOOKING] selectedAvailability:', this.selectedAvailability);

        if (!this.selectedAvailability) {
            console.error('❌ [BOOKING] No availability selected - booking cancelled');
            this.showNotification('Please select a lesson slot first', 'error');
            return;
        }

        // Check if modal is actually visible (safety check)
        const modal = document.getElementById('bookingModal');
        if (!modal || modal.classList.contains('hidden')) {
            console.error('❌ [BOOKING] Modal not visible - preventing auto-booking');
            this.showNotification('Please use the booking modal to book lessons', 'error');
            return;
        }

        try {
            console.log('📝 [BOOKING] Processing lesson booking...');

            const lessonType = document.getElementById('lessonType').value;
            const notes = document.getElementById('lessonNotes').value;
            const price = lessonType === 'trial' ? 10 : 25;

            console.log('📝 [BOOKING] Booking details:', {
                tutorId: this.selectedAvailability.tutor_id,
                studentId: window.authHandler.getCurrentUser().id,
                lessonDate: this.selectedAvailability.lesson_date,
                startTime: this.selectedAvailability.start_time,
                lessonType,
                price,
                notes
            });

            const { data, error } = await window.authHandler.supabase
                .from('lessons')
                .insert([{
                    tutor_id: this.selectedAvailability.tutor_id,
                    student_id: window.authHandler.getCurrentUser().id,
                    availability_id: this.selectedAvailability.id,
                    lesson_date: this.selectedAvailability.lesson_date,
                    start_time: this.selectedAvailability.start_time,
                    duration: 60, // 1 hour
                    lesson_type: lessonType,
                    price: price,
                    notes: notes || null
                }])
                .select();

            if (error) throw error;

            console.log('✅ [BOOKING] Lesson booked successfully:', data);
            this.showNotification('Lesson booked successfully!', 'success');
            this.hideBookingModal();
            await this.loadData();
            this.renderTutors();
            this.renderLessons();
            this.updateStats();
        } catch (error) {
            console.error('❌ [BOOKING] Error booking lesson:', error);
            this.showNotification('Error booking lesson: ' + error.message, 'error');
        }
    }

    updateStats() {
        // Update upcoming lessons count
        const upcomingLessons = this.lessons.filter(l =>
            new Date(l.lesson_date + 'T' + l.start_time) > new Date()
        );
        document.getElementById('upcomingCount').textContent = upcomingLessons.length;

        // Update available slots count
        document.getElementById('availableCount').textContent = this.availability.length;

        // Update tutors count
        document.getElementById('tutorsCount').textContent = this.tutors.length;

        // Update completed lessons count
        const completedLessons = this.lessons.filter(l => l.status === 'completed');
        document.getElementById('completedCount').textContent = completedLessons.length;
    }

    // Utility methods
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    async loadUnreadMessageCount() {
        try {
            const currentUser = window.authHandler.getCurrentUser();
            if (!currentUser) return;

            const { data, error } = await window.authHandler.supabase
                .rpc('messaging_get_unread_count', { user_uuid: currentUser.id });

            if (error) {
                console.warn('Could not load unread message count:', error.message);
                return;
            }

            const unreadCount = data || 0;
            this.updateUnreadBadge(unreadCount);
        } catch (error) {
            console.warn('Error loading unread message count:', error);
        }
    }

    updateUnreadBadge(unreadCount) {
        const badge = document.getElementById('studentUnreadBadge');

        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    setupUnreadCountSubscription() {
        try {
            const currentUser = window.authHandler.getCurrentUser();
            if (!currentUser || !window.authHandler.supabase) return;

            // Subscribe to unread_messages changes for this user
            const subscription = window.authHandler.supabase
                .channel(`unread_messages_${currentUser.id}`)
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'unread_messages',
                        filter: `user_id=eq.${currentUser.id}`
                    },
                    (payload) => {
                        console.log('📨 [STUDENT] Unread count changed:', payload);
                        // Reload unread count when changes occur
                        this.loadUnreadMessageCount();
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ [STUDENT] Unread count subscription active');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.log('⚠️ [STUDENT] Unread count subscription failed');
                    }
                });

            console.log('✅ [STUDENT] Real-time unread count subscription setup');
        } catch (error) {
            console.warn('Error setting up unread count subscription:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentDashboard = new StudentDashboard();
});
