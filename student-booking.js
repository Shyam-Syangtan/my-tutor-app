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
        console.log('🚀 [INIT] Initialization result:', success);
        return success;
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

            console.log('✅ [SUCCESS] Final data loaded:');
            console.log('  - Availability slots:', Object.keys(this.availabilityData).length);
            console.log('  - Booked lessons:', Object.keys(this.lessonsData).length);
            console.log('  - Availability data:', this.availabilityData);
            console.log('  - Lessons data:', this.lessonsData);

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
                            
                            let slotClass = 'bg-white border p-2 text-center text-xs cursor-not-allowed text-gray-400';
                            let slotContent = 'Unavailable';
                            let clickHandler = '';
                            
                            if (this.lessonsData[lessonKey]) {
                                slotClass = 'bg-yellow-100 border border-yellow-300 p-2 text-center text-xs cursor-not-allowed text-yellow-700';
                                slotContent = 'Booked';
                            } else if (this.availabilityData[availKey]) {
                                slotClass = 'bg-green-100 border border-green-300 p-2 text-center text-xs cursor-pointer text-green-700 hover:bg-green-200 transition-colors';
                                slotContent = 'Available';
                                clickHandler = `onclick="bookingSystem.selectTimeSlot('${dayDate.toISOString().split('T')[0]}', '${time}:00', '${time === '17:00' ? '18:00:00' : (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0') + ':00:00'}')"`;
                            }
                            
                            return `<div class="${slotClass}" ${clickHandler}>${slotContent}</div>`;
                        }).join('')}
                    `).join('')}
                </div>

                <!-- Legend -->
                <div class="bg-gray-50 px-4 py-3 border-t">
                    <div class="flex justify-center space-x-6 text-xs">
                        <div class="flex items-center space-x-1">
                            <div class="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                            <span class="text-gray-600">Available</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <div class="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span class="text-gray-600">Booked</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <div class="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                            <span class="text-gray-600">Unavailable</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Select a time slot for booking
    async selectTimeSlot(date, startTime, endTime) {
        if (!this.currentUser) {
            alert('Please log in to book a lesson.');
            return;
        }

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
            this.showErrorMessage('Failed to send lesson request. Please try again.');
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
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
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
