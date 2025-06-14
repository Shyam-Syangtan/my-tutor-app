/**
 * Student Booking System
 * Handles viewing tutor availability and booking lessons
 */

class StudentBookingSystem {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.selectedTutor = null;
        this.currentWeekStart = this.getStartOfWeek(new Date());
        this.availabilityData = {};
        this.lessonsData = {};
    }

    // Initialize the booking system
    async initialize(tutorId, currentUser) {
        console.log('🚀 [INIT] Initializing booking system...');
        console.log('🚀 [INIT] Tutor ID:', tutorId);
        console.log('🚀 [INIT] Current user:', currentUser?.id);

        if (!tutorId) {
            console.error('❌ [INIT] No tutor ID provided to initialize()');
            return false;
        }

        this.selectedTutor = tutorId;
        this.currentUser = currentUser;

        const success = await this.loadBookingData();

        // Initialize enhanced booking modal with retry mechanism
        await this.initializeEnhancedModal(success);

        console.log('🚀 [INIT] Initialization result:', success);
        return success;
    }

    // Initialize enhanced modal with retry mechanism
    async initializeEnhancedModal(success) {
        // Always try to initialize enhanced modal, even if some data loading failed
        console.log('🔄 [BOOKING] Initializing enhanced modal (success:', success, ')');

        if (!success) {
            console.log('⚠️ [BOOKING] Some booking data load failed, but proceeding with enhanced modal initialization');
        }

        // Wait for EnhancedBookingModal to be available (up to 3 seconds)
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts * 100ms = 3 seconds

        console.log('🔄 [BOOKING] Checking for EnhancedBookingModal availability...');

        while (attempts < maxAttempts && typeof EnhancedBookingModal === 'undefined') {
            console.log(`🔄 [BOOKING] Waiting for EnhancedBookingModal... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof EnhancedBookingModal !== 'undefined') {
            try {
                console.log('🚀 [BOOKING] EnhancedBookingModal found, initializing...');
                this.enhancedModal = new EnhancedBookingModal(this.supabase);

                console.log('🚀 [BOOKING] Calling enhanced modal initialize with:', {
                    tutorId: this.selectedTutor,
                    currentUserId: this.currentUser?.id,
                    availabilityKeys: Object.keys(this.availabilityData || {}),
                    lessonRequestsKeys: Object.keys(this.lessonRequestsData || {})
                });

                await this.enhancedModal.initialize(
                    this.selectedTutor,
                    this.currentUser,
                    this.availabilityData,
                    this.lessonRequestsData || {}
                );

                console.log('✅ [BOOKING] Enhanced modal initialized successfully');

                // Verify the modal was created
                const modalElement = document.getElementById('enhancedBookingModal');
                const bookButton = document.getElementById('bookLessonBtn');
                console.log('🔍 [BOOKING] Post-initialization verification:', {
                    modalExists: !!modalElement,
                    bookButtonExists: !!bookButton,
                    modalHidden: modalElement?.classList.contains('hidden')
                });

            } catch (error) {
                console.error('❌ [BOOKING] Enhanced modal initialization failed:', error);
                console.error('❌ [BOOKING] Error stack:', error.stack);
                this.enhancedModal = null;
            }
        } else {
            console.log('⚠️ [BOOKING] Enhanced modal not available after waiting, will use fallback');
            this.enhancedModal = null;
        }
    }

    // Get start of current week (Sunday)
    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    // Load tutor availability and existing lessons
    async loadBookingData() {
        try {
            console.log('🔍 [DEBUG] Loading booking data for tutor:', this.selectedTutor);
            console.log('🔍 [DEBUG] Current user:', this.currentUser?.id);
            console.log('🔍 [DEBUG] Current week start:', this.currentWeekStart);

            // Validate tutor ID
            if (!this.selectedTutor) {
                console.error('❌ [ERROR] No tutor ID provided');
                return false;
            }

            // Load tutor availability with detailed logging
            console.log('📊 [DEBUG] Querying tutor_availability table...');
            const { data: availability, error: availError } = await this.supabase
                .from('tutor_availability')
                .select('*')
                .eq('tutor_id', this.selectedTutor);

            console.log('📊 [DEBUG] Availability query result:', {
                data: availability,
                error: availError,
                count: availability?.length || 0
            });

            if (availError) {
                console.error('❌ [ERROR] Error loading availability:', availError);
                console.error('❌ [ERROR] Error details:', {
                    message: availError.message,
                    details: availError.details,
                    hint: availError.hint,
                    code: availError.code
                });
                return false;
            }

            if (!availability || availability.length === 0) {
                console.warn('⚠️ [WARNING] No availability data found for tutor:', this.selectedTutor);
                console.log('💡 [INFO] This could mean:');
                console.log('  - Tutor has not set any availability');
                console.log('  - Tutor ID is incorrect');
                console.log('  - RLS policies are blocking access');
            }

            // Convert to lookup object
            this.availabilityData = {};
            if (availability) {
                availability.forEach(slot => {
                    const key = `${slot.day_of_week}-${slot.start_time}`;
                    this.availabilityData[key] = slot;
                });
            }

            // Load existing lessons for current week to show booked slots
            const weekEnd = new Date(this.currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            console.log('📅 [DEBUG] Loading lessons for date range:', {
                start: this.currentWeekStart.toISOString().split('T')[0],
                end: weekEnd.toISOString().split('T')[0]
            });

            const { data: lessons, error: lessonsError } = await this.supabase
                .from('lessons')
                .select('*')
                .eq('tutor_id', this.selectedTutor)
                .gte('lesson_date', this.currentWeekStart.toISOString().split('T')[0])
                .lte('lesson_date', weekEnd.toISOString().split('T')[0])
                .in('status', ['pending', 'confirmed']);

            console.log('📅 [DEBUG] Lessons query result:', {
                data: lessons,
                error: lessonsError,
                count: lessons?.length || 0
            });

            if (lessonsError) {
                console.error('❌ [ERROR] Error loading lessons:', lessonsError);
                // Don't return false for lessons error - availability is more important
            }

            // Convert to lookup object
            this.lessonsData = {};
            if (lessons) {
                lessons.forEach(lesson => {
                    const key = `${lesson.lesson_date}-${lesson.start_time}`;
                    this.lessonsData[key] = lesson;
                });
            }

            // Load lesson requests for enhanced modal (handle missing table gracefully)
            console.log('📋 [DEBUG] Loading lesson requests...');
            this.lessonRequestsData = {};

            try {
                const { data: lessonRequests, error: requestsError } = await this.supabase
                    .from('lesson_requests')
                    .select('*')
                    .eq('tutor_id', this.selectedTutor)
                    .gte('requested_date', this.currentWeekStart.toISOString().split('T')[0])
                    .lte('requested_date', weekEnd.toISOString().split('T')[0])
                    .eq('status', 'pending');

                console.log('📋 [DEBUG] Lesson requests result:', {
                    data: lessonRequests,
                    error: requestsError,
                    count: lessonRequests?.length || 0
                });

                if (requestsError) {
                    if (requestsError.message.includes('relation "lesson_requests" does not exist')) {
                        console.warn('⚠️ [DEBUG] lesson_requests table does not exist - this is expected for new setups');
                        console.warn('⚠️ [DEBUG] Enhanced modal will still work, but lesson requests will use fallback creation');
                    } else {
                        console.error('❌ [ERROR] Error loading lesson requests:', requestsError);
                    }
                } else if (lessonRequests) {
                    // Convert to lookup object
                    lessonRequests.forEach(request => {
                        const key = `${request.requested_date}-${request.requested_start_time}`;
                        this.lessonRequestsData[key] = request;
                    });
                }
            } catch (error) {
                console.warn('⚠️ [DEBUG] Failed to load lesson requests (table may not exist):', error.message);
                // Continue with empty lesson requests data
            }

            console.log('✅ [SUCCESS] Final data loaded:');
            console.log('  - Availability slots:', Object.keys(this.availabilityData).length);
            console.log('  - Booked lessons:', Object.keys(this.lessonsData).length);
            console.log('  - Lesson requests:', Object.keys(this.lessonRequestsData).length);
            console.log('  - Availability data:', this.availabilityData);
            console.log('  - Lessons data:', this.lessonsData);
            console.log('  - Requests data:', this.lessonRequestsData);

            return true;

        } catch (error) {
            console.error('💥 [FATAL] Error loading booking data:', error);
            console.error('💥 [FATAL] Error stack:', error.stack);
            return false;
        }
    }

    // Render availability grid for students
    renderAvailabilityGrid(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        // Time slots (9 AM to 6 PM)
        const timeSlots = [
            '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
        ];

        // Days of the week
        const days = [
            { name: 'Sun', full: 'Sunday', index: 0 },
            { name: 'Mon', full: 'Monday', index: 1 },
            { name: 'Tue', full: 'Tuesday', index: 2 },
            { name: 'Wed', full: 'Wednesday', index: 3 },
            { name: 'Thu', full: 'Thursday', index: 4 },
            { name: 'Fri', full: 'Friday', index: 5 },
            { name: 'Sat', full: 'Saturday', index: 6 }
        ];

        // Update week range
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        container.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <!-- Week Navigation -->
                <div class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <button onclick="bookingSystem.previousWeek()" class="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        <span class="text-sm">Previous</span>
                    </button>
                    <div class="text-center">
                        <h3 class="font-semibold text-gray-900">${this.formatDateRange(this.currentWeekStart, weekEnd)}</h3>
                        <p class="text-xs text-gray-500">Click available slots to book</p>
                    </div>
                    <button onclick="bookingSystem.nextWeek()" class="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                        <span class="text-sm">Next</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>

                <!-- Availability Grid -->
                <div class="booking-grid" style="display: grid; grid-template-columns: 80px repeat(7, 1fr); gap: 1px; background-color: #e5e7eb;">
                    <!-- Header Row -->
                    <div class="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600 border">Time</div>
                    ${days.map((day, index) => {
                        const dayDate = new Date(this.currentWeekStart);
                        dayDate.setDate(dayDate.getDate() + index);
                        return `
                            <div class="bg-gray-50 p-2 text-center border">
                                <div class="font-semibold text-sm">${day.name}</div>
                                <div class="text-xs text-gray-500">${dayDate.getDate()}</div>
                            </div>
                        `;
                    }).join('')}

                    <!-- Time Slots -->
                    ${timeSlots.map(time => `
                        <!-- Time Label -->
                        <div class="bg-gray-50 p-2 text-center text-xs text-gray-600 border flex items-center justify-center">
                            ${this.formatTime(time)}
                        </div>
                        
                        <!-- Day Slots -->
                        ${days.map((day, dayIndex) => {
                            const availKey = `${day.index}-${time}:00`;
                            const dayDate = new Date(this.currentWeekStart);
                            dayDate.setDate(dayDate.getDate() + dayIndex);
                            const lessonKey = `${dayDate.toISOString().split('T')[0]}-${time}:00`;

                            let slotClass = 'bg-white border p-2 text-center text-xs cursor-pointer text-gray-400 hover:bg-gray-100 transition-colors';
                            let slotContent = 'Unavailable';

                            // Check for existing lesson requests
                            const requestKey = `${dayDate.toISOString().split('T')[0]}-${time}:00`;
                            if (this.lessonRequests && this.lessonRequests[requestKey]) {
                                const request = this.lessonRequests[requestKey];
                                if (request.status === 'pending') {
                                    slotClass = 'bg-yellow-100 border border-yellow-300 p-2 text-center text-xs cursor-pointer text-yellow-700 hover:bg-yellow-200 transition-colors';
                                    slotContent = 'Pending';
                                } else if (request.status === 'approved') {
                                    slotClass = 'bg-blue-100 border border-blue-300 p-2 text-center text-xs cursor-pointer text-blue-700 hover:bg-blue-200 transition-colors';
                                    slotContent = 'Confirmed';
                                }
                            } else if (this.lessonsData[lessonKey]) {
                                slotClass = 'bg-blue-100 border border-blue-300 p-2 text-center text-xs cursor-pointer text-blue-700 hover:bg-blue-200 transition-colors';
                                slotContent = 'Booked';
                            } else if (this.availabilityData[availKey]) {
                                slotClass = 'bg-green-100 border border-green-300 p-2 text-center text-xs cursor-pointer text-green-700 hover:bg-green-200 transition-colors';
                                slotContent = 'Available';
                            }

                            // ALL slots are now clickable to open the enhanced modal
                            const clickHandler = `onclick="bookingSystem.selectTimeSlot('${dayDate.toISOString().split('T')[0]}', '${time}:00', '${time === '17:00' ? '18:00:00' : (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0') + ':00:00'}')"`;

                            return `<div class="${slotClass}" ${clickHandler}>${slotContent}</div>`;
                        }).join('')}
                    `).join('')}
                </div>

                <!-- Legend -->
                <div class="bg-gray-50 px-4 py-3 border-t">
                    <div class="flex justify-center space-x-4 text-xs">
                        <div class="flex items-center space-x-1">
                            <div class="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                            <span class="text-gray-600">Available</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <div class="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span class="text-gray-600">Pending</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <div class="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                            <span class="text-gray-600">Confirmed</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <div class="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                            <span class="text-gray-600">Unavailable</span>
                        </div>
                    </div>
                    <p class="text-center text-xs text-gray-500 mt-2">Click any slot to view detailed weekly calendar</p>
                </div>
            </div>
        `;
    }

    // Select a time slot for booking - now opens enhanced modal
    async selectTimeSlot(date, startTime, endTime) {
        console.log('🎯 [BOOKING] selectTimeSlot called with:', { date, startTime, endTime });
        console.log('🎯 [BOOKING] Current user:', this.currentUser?.id);
        console.log('🎯 [BOOKING] Enhanced modal available:', !!this.enhancedModal);
        console.log('🎯 [BOOKING] Enhanced modal type:', typeof this.enhancedModal);

        if (!this.currentUser) {
            alert('Please log in to book a lesson.');
            return;
        }

        // Use enhanced modal if available, otherwise fall back to simple confirm
        if (this.enhancedModal && typeof this.enhancedModal.openModal === 'function') {
            console.log('✅ [BOOKING] Opening enhanced modal for date:', date);
            try {
                this.enhancedModal.openModal(date);
                return; // Successfully opened enhanced modal
            } catch (error) {
                console.error('❌ [BOOKING] Error opening enhanced modal:', error);
                console.log('🔄 [BOOKING] Falling back to simple booking');
                this.fallbackToSimpleBooking(date, startTime, endTime);
                return;
            }
        }

        // Try to reinitialize enhanced modal if it's not available
        console.log('⚠️ [BOOKING] Enhanced modal not available, checking if we can reinitialize...');
        console.log('⚠️ [BOOKING] Enhanced modal state:', {
            exists: !!this.enhancedModal,
            hasOpenModal: this.enhancedModal && typeof this.enhancedModal.openModal === 'function',
            EnhancedBookingModalDefined: typeof EnhancedBookingModal !== 'undefined'
        });

        if (typeof EnhancedBookingModal !== 'undefined' && !this.enhancedModal) {
            console.log('🔄 [BOOKING] Attempting to reinitialize enhanced modal...');
            try {
                this.enhancedModal = new EnhancedBookingModal(this.supabase);
                await this.enhancedModal.initialize(
                    this.selectedTutor,
                    this.currentUser,
                    this.availabilityData,
                    this.lessonRequestsData || {}
                );
                console.log('✅ [BOOKING] Enhanced modal reinitialized, trying to open...');
                this.enhancedModal.openModal(date);
                return; // Successfully reinitialized and opened
            } catch (error) {
                console.error('❌ [BOOKING] Reinitialization failed:', error);
            }
        }

        // Fall back to simple booking
        console.log('🔄 [BOOKING] Using simple booking fallback');
        this.fallbackToSimpleBooking(date, startTime, endTime);
    }

    // Fallback to simple booking method
    async fallbackToSimpleBooking(date, startTime, endTime) {
        const confirmed = confirm(`Book a lesson on ${this.formatDate(new Date(date))} at ${this.formatTime(startTime.substring(0, 5))}?`);

        if (confirmed) {
            await this.createLessonRequest(date, startTime, endTime);
        }
    }

    // Create a lesson request
    async createLessonRequest(date, startTime, endTime) {
        try {
            console.log('📝 [BOOKING] Creating lesson request:', {
                date,
                startTime,
                endTime,
                tutorId: this.selectedTutor,
                studentId: this.currentUser?.id
            });

            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('lesson_requests')
                .insert([{
                    tutor_id: this.selectedTutor,
                    student_id: this.currentUser.id,
                    requested_date: date,
                    requested_start_time: startTime,
                    requested_end_time: endTime,
                    status: 'pending',
                    student_message: 'Lesson booking request'
                }])
                .select()
                .single();

            console.log('📝 [BOOKING] Lesson request result:', { data, error });

            if (error) {
                throw error;
            }

            console.log('✅ [BOOKING] Lesson request created successfully:', data);

            // Show success message
            this.showSuccessMessage('Lesson request sent! The tutor will review and respond soon.');

            // Reload data to update availability
            await this.loadBookingData();
            this.renderAvailabilityGrid('availabilityContainer');

        } catch (error) {
            console.error('💥 [BOOKING] Error creating lesson request:', error);

            if (error.message.includes('relation "lesson_requests" does not exist')) {
                console.error('💥 [BOOKING] lesson_requests table does not exist!');
                this.showErrorMessage('Database setup incomplete. The lesson_requests table needs to be created. Please contact support or check the setup instructions.');
            } else {
                this.showErrorMessage('Failed to send lesson request. Please try again.');
            }
        }
    }

    // Navigation functions
    async previousWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        await this.loadBookingData();
        this.renderAvailabilityGrid('availabilityContainer');
    }

    async nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        await this.loadBookingData();
        this.renderAvailabilityGrid('availabilityContainer');
    }

    // Utility functions
    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatDateRange(start, end) {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

// Global booking system instance
let bookingSystem;
