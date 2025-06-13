/**
 * Enhanced Booking Modal System
 * Creates iTalki-style detailed time slot selection popup
 */

class EnhancedBookingModal {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.tutorId = null;
        this.currentUser = null;
        this.availabilityData = {};
        this.lessonRequests = {};
    }

    // Initialize the modal system
    async initialize(tutorId, currentUser, availabilityData, lessonRequests) {
        this.tutorId = tutorId;
        this.currentUser = currentUser;
        this.availabilityData = availabilityData;
        this.lessonRequests = lessonRequests;
        this.createModalHTML();
    }

    // Create the modal HTML structure
    createModalHTML() {
        const modalHTML = `
            <div id="enhancedBookingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                    <!-- Modal Header -->
                    <div class="flex justify-between items-center p-6 border-b border-gray-200">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V7a4 4 0 118 0v6"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 id="modalTitle" class="text-lg font-semibold text-gray-900">Select Time Slot</h3>
                                <p id="modalSubtitle" class="text-sm text-gray-500">Choose your preferred time</p>
                            </div>
                        </div>
                        <button id="modalCloseBtn" class="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Modal Content -->
                    <div class="flex h-[70vh]">
                        <!-- Time Slots Sidebar -->
                        <div class="w-32 bg-gray-50 border-r border-gray-100 flex flex-col" style="border-width: 0.5px;">
                            <!-- Header to match calendar navigation height -->
                            <div class="p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0" style="height: 72px; border-width: 0.5px;">
                                <div class="text-xs font-medium text-gray-600 text-center">UTC+08:00</div>
                            </div>

                            <!-- Days header spacer to match calendar days header -->
                            <div class="border-b border-gray-100 bg-gray-50 flex-shrink-0" style="height: 48px; border-width: 0.5px;">
                                <div class="text-xs font-medium text-gray-500 text-center py-3">TIME</div>
                            </div>

                            <!-- Time slots aligned with calendar grid -->
                            <div id="timeSlotsList" class="overflow-y-auto flex-1" style="scrollbar-width: none; -ms-overflow-style: none;">
                                <!-- Time slots will be generated here -->
                            </div>
                        </div>

                        <!-- Calendar Grid -->
                        <div class="flex-1 flex flex-col overflow-hidden">
                            <!-- Week Navigation -->
                            <div class="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0" style="height: 72px; border-width: 0.5px;">
                                <button id="prevWeekBtn" class="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <div class="text-center">
                                    <h4 id="weekRange" class="font-semibold text-gray-900">Loading...</h4>
                                    <p class="text-xs text-gray-500">Click available slots to book</p>
                                </div>
                                <button id="nextWeekBtn" class="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            </div>

                            <!-- Days Header -->
                            <div id="daysHeader" class="grid grid-cols-7 border-b border-gray-100 bg-gray-50 flex-shrink-0" style="height: 48px; border-width: 0.5px;">
                                <!-- Day headers will be generated here -->
                            </div>

                            <!-- Calendar Grid Container -->
                            <div id="calendarGridContainer" class="overflow-y-auto flex-1" style="scrollbar-width: thin;">
                                <div id="calendarGrid" class="grid grid-cols-7 gap-0">
                                    <!-- Calendar slots will be generated here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Legend -->
                    <div class="p-4 border-t border-gray-200 bg-gray-50">
                        <div class="flex justify-center space-x-6 text-xs">
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 bg-green-400 rounded"></div>
                                <span class="text-gray-600">Available</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 bg-yellow-400 rounded"></div>
                                <span class="text-gray-600">Pending</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 bg-blue-400 rounded"></div>
                                <span class="text-gray-600">Confirmed</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 bg-gray-300 rounded"></div>
                                <span class="text-gray-600">Not available</span>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="flex justify-between items-center p-6 border-t border-gray-200">
                        <div id="selectedSlotInfo" class="text-sm text-gray-600">
                            Select a time slot to continue
                        </div>
                        <div class="flex space-x-3">
                            <button id="modalCancelBtn"
                                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button id="bookLessonBtn"
                                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled>
                                Confirm Lesson
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body if it doesn't exist
        if (!document.getElementById('enhancedBookingModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.attachEventListeners();
        }
    }

    // Attach event listeners for modal controls
    attachEventListeners() {
        const modal = document.getElementById('enhancedBookingModal');

        // Overlay click to close modal
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.closeModal();
            }
        });

        // Close button
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.closeModal();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('modalCancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.closeModal();
            });
        }

        // Book lesson button
        const bookBtn = document.getElementById('bookLessonBtn');
        if (bookBtn) {
            bookBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.bookSelectedSlot();
            });
        }

        // Week navigation
        const prevBtn = document.getElementById('prevWeekBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.previousWeek();
            });
        }

        const nextBtn = document.getElementById('nextWeekBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.nextWeek();
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        // Synchronized scrolling between time slots and calendar grid
        this.setupSynchronizedScrolling();
    }

    // Setup synchronized scrolling between time slots sidebar and calendar grid
    setupSynchronizedScrolling() {
        const timeSlotsList = document.getElementById('timeSlotsList');
        const calendarGridContainer = document.getElementById('calendarGridContainer');

        if (!timeSlotsList || !calendarGridContainer) {
            console.log('⚠️ Synchronized scrolling elements not found');
            return;
        }

        let isScrolling = false;

        // Sync calendar grid scroll to time slots
        timeSlotsList.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;

            // Direct 1:1 scroll synchronization
            calendarGridContainer.scrollTop = timeSlotsList.scrollTop;

            setTimeout(() => { isScrolling = false; }, 10);
        });

        // Sync time slots scroll to calendar grid
        calendarGridContainer.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;

            // Direct 1:1 scroll synchronization
            timeSlotsList.scrollTop = calendarGridContainer.scrollTop;

            setTimeout(() => { isScrolling = false; }, 10);
        });

        console.log('✅ Synchronized scrolling setup complete');
    }

    // Open modal for specific date
    openModal(date) {
        this.selectedDate = new Date(date);
        this.selectedTimeSlot = null;
        // Start from current day for student booking (7-day view starting today)
        this.currentWeekStart = new Date();

        // Update modal title
        document.getElementById('modalTitle').textContent = 'Select Time Slot';
        document.getElementById('modalSubtitle').textContent = this.formatDate(this.selectedDate);

        // Generate time slots and calendar
        this.generateTimeSlots();
        this.generateCalendar();

        // Show modal
        document.getElementById('enhancedBookingModal').classList.remove('hidden');

        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    closeModal() {
        document.getElementById('enhancedBookingModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.selectedTimeSlot = null;
        this.updateBookButton();
    }

    // Generate 30-minute time slots for full 24-hour format (1:00 AM - 12:00 AM / 24:00)
    generateTimeSlots() {
        const timeSlotsList = document.getElementById('timeSlotsList');
        const timeSlots = [];

        // Generate 30-minute intervals for full 24-hour format (01:00 to 24:00)
        for (let hour = 1; hour <= 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Handle 24:00 as special case (midnight)
                const displayHour = hour === 24 ? 0 : hour;
                const timeString = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                timeSlots.push(timeString);
            }
        }

        timeSlotsList.innerHTML = timeSlots.map(time => `
            <div class="text-xs text-gray-600 text-center border-b border-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center" style="height: 32px; min-height: 32px; border-width: 0.5px;">
                ${this.formatTime(time + ':00')}
            </div>
        `).join('');
    }

    // Generate calendar grid
    generateCalendar() {
        this.generateDaysHeader();
        this.generateCalendarGrid();
        this.updateWeekRange();

        // Setup synchronized scrolling and re-attach navigation listeners after calendar is generated
        setTimeout(() => {
            this.setupSynchronizedScrolling();
            this.attachNavigationListeners();
        }, 100);
    }

    // Attach navigation listeners specifically
    attachNavigationListeners() {
        // Week navigation
        const prevBtn = document.getElementById('prevWeekBtn');
        if (prevBtn) {
            // Remove existing listeners to prevent duplicates
            prevBtn.replaceWith(prevBtn.cloneNode(true));
            const newPrevBtn = document.getElementById('prevWeekBtn');
            newPrevBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('🔙 Previous week clicked');
                this.previousWeek();
            });
        }

        const nextBtn = document.getElementById('nextWeekBtn');
        if (nextBtn) {
            // Remove existing listeners to prevent duplicates
            nextBtn.replaceWith(nextBtn.cloneNode(true));
            const newNextBtn = document.getElementById('nextWeekBtn');
            newNextBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('🔜 Next week clicked');
                this.nextWeek();
            });
        }
    }

    // Generate days header starting from current day
    generateDaysHeader() {
        const daysHeader = document.getElementById('daysHeader');
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        daysHeader.innerHTML = Array.from({length: 7}, (_, index) => {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + index);

            const dayName = dayNames[date.getDay()];
            const isToday = this.isToday(date);

            return `
                <div class="text-center border-r border-gray-100 last:border-r-0 flex flex-col justify-center h-full ${isToday ? 'bg-blue-50 text-blue-600' : ''}" style="border-width: 0.5px;">
                    <div class="font-semibold text-sm ${isToday ? 'text-blue-600' : 'text-gray-900'}">${dayName}</div>
                    <div class="text-xs ${isToday ? 'text-blue-500' : 'text-gray-500'}">${date.getDate()}</div>
                </div>
            `;
        }).join('');
    }

    // Generate calendar grid with time slots
    generateCalendarGrid() {
        const calendarGrid = document.getElementById('calendarGrid');
        const timeSlots = [];

        // Generate 30-minute intervals for full 24-hour format (01:00 to 24:00)
        for (let hour = 1; hour <= 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Handle 24:00 as special case (midnight)
                const displayHour = hour === 24 ? 0 : hour;
                const timeString = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                timeSlots.push(timeString);
            }
        }

        let gridHTML = '';

        timeSlots.forEach(time => {
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const date = new Date(this.currentWeekStart);
                date.setDate(date.getDate() + dayIndex);
                const dateString = date.toISOString().split('T')[0];

                const slotStatus = this.getSlotStatus(date.getDay(), time, dateString);
                const slotClass = this.getSlotClass(slotStatus);
                const isClickable = true; // All slots are clickable as per requirements

                gridHTML += `
                    <div class="${slotClass} border-r border-b border-gray-100 last:border-r-0 ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}"
                         style="height: 32px; min-height: 32px; border-width: 0.5px;"
                         onclick="enhancedBookingModal.selectTimeSlot('${dateString}', '${time}')"
                         data-date="${dateString}" data-time="${time}">
                    </div>
                `;
            }
        });

        calendarGrid.innerHTML = gridHTML;
    }

    // Get slot status based on availability and requests
    getSlotStatus(dayOfWeek, time, dateString) {
        const availKey = `${dayOfWeek}-${time}`;
        const requestKey = `${dateString}-${time}`;
        
        // Check if there's a pending request
        if (this.lessonRequests[requestKey]) {
            const request = this.lessonRequests[requestKey];
            if (request.status === 'pending') return 'pending';
            if (request.status === 'approved') return 'confirmed';
        }
        
        // Check if slot is available
        if (this.availabilityData[availKey] && this.availabilityData[availKey].is_available) {
            return 'available';
        }
        
        return 'unavailable';
    }

    // Get CSS class for slot status
    getSlotClass(status) {
        const baseClass = 'transition-all duration-200';
        switch (status) {
            case 'available':
                return `${baseClass} bg-green-400`;
            case 'pending':
                return `${baseClass} bg-yellow-400`;
            case 'confirmed':
                return `${baseClass} bg-blue-400`;
            default:
                return `${baseClass} bg-gray-200`;
        }
    }

    // Select a time slot
    selectTimeSlot(date, time) {
        // Remove previous selection
        document.querySelectorAll('[data-selected="true"]').forEach(el => {
            el.removeAttribute('data-selected');
            el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-1');
        });
        
        // Add selection to clicked slot
        const slot = document.querySelector(`[data-date="${date}"][data-time="${time}"]`);
        if (slot) {
            slot.setAttribute('data-selected', 'true');
            slot.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-1');
        }
        
        this.selectedTimeSlot = { date, time };
        this.updateSelectedSlotInfo();
        this.updateBookButton();
    }

    // Update selected slot info
    updateSelectedSlotInfo() {
        const info = document.getElementById('selectedSlotInfo');
        if (this.selectedTimeSlot) {
            const { date, time } = this.selectedTimeSlot;
            const endTime = this.getEndTime(time);
            info.textContent = `Selected: ${this.formatDate(new Date(date))} at ${this.formatTime(time)} - ${this.formatTime(endTime)}`;
        } else {
            info.textContent = 'Select a time slot to continue';
        }
    }

    // Update book button state
    updateBookButton() {
        const bookBtn = document.getElementById('bookLessonBtn');
        bookBtn.disabled = !this.selectedTimeSlot;
    }

    // Book selected slot - Enhanced with better error handling and user feedback
    async bookSelectedSlot() {
        if (!this.selectedTimeSlot || !this.currentUser) {
            console.error('❌ [BOOKING] Missing required data:', {
                selectedTimeSlot: this.selectedTimeSlot,
                currentUser: this.currentUser
            });
            return;
        }

        const { date, time } = this.selectedTimeSlot;
        const endTime = this.getEndTime(time);

        // Show loading state
        const bookBtn = document.getElementById('bookLessonBtn');
        const originalText = bookBtn.textContent;
        bookBtn.disabled = true;
        bookBtn.textContent = 'Booking...';

        try {
            console.log('📝 [BOOKING] Creating lesson request:', {
                date,
                time,
                endTime,
                tutorId: this.tutorId,
                studentId: this.currentUser.id
            });

            // Validate required fields
            if (!this.tutorId || !this.currentUser.id) {
                throw new Error('Missing tutor ID or student ID');
            }

            const { data, error } = await this.supabase
                .from('lesson_requests')
                .insert([{
                    tutor_id: this.tutorId,
                    student_id: this.currentUser.id,
                    requested_date: date,
                    requested_start_time: time,
                    requested_end_time: endTime,
                    status: 'pending',
                    student_message: document.getElementById('studentMessage')?.value || 'Lesson booking request via enhanced booking system'
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ [BOOKING] Database error:', error);
                throw error;
            }

            console.log('✅ [BOOKING] Lesson request created successfully:', data);

            // Show success message with details
            const formattedDate = this.formatDate(new Date(date));
            const formattedTime = this.formatTime(time);
            this.showSuccessMessage(`✅ Lesson request sent for ${formattedDate} at ${formattedTime}! The tutor will review and respond soon.`);

            // Close modal
            this.closeModal();

            // Trigger refresh of parent booking system
            if (window.bookingSystem && typeof window.bookingSystem.loadBookingData === 'function') {
                console.log('🔄 [BOOKING] Refreshing booking data...');
                await window.bookingSystem.loadBookingData();
                window.bookingSystem.renderAvailabilityGrid('availabilityContainer');
            }

        } catch (error) {
            console.error('💥 [BOOKING] Error creating lesson request:', error);

            // Show specific error message
            let errorMessage = 'Failed to send lesson request. Please try again.';
            if (error.message.includes('duplicate')) {
                errorMessage = 'You already have a request for this time slot.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. Please log in again.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            }

            this.showErrorMessage(errorMessage);
        } finally {
            // Reset button state
            bookBtn.disabled = false;
            bookBtn.textContent = originalText;
        }
    }

    // Week navigation
    previousWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.generateCalendar();
    }

    nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.generateCalendar();
    }

    // Update week range display
    updateWeekRange() {
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        document.getElementById('weekRange').textContent = 
            `${this.formatDateRange(this.currentWeekStart)} - ${this.formatDateRange(weekEnd)}`;
    }

    // Utility functions - Start from current day for student booking
    getStartOfWeek(date) {
        // For student booking modal, start from the current day (not Monday)
        return new Date(date);
    }

    // Check if date is today
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getEndTime(startTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endMinutes = minutes + 30;
        if (endMinutes >= 60) {
            return `${(hours + 1).toString().padStart(2, '0')}:${(endMinutes - 60).toString().padStart(2, '0')}:00`;
        }
        return `${hours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
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

    formatDateRange(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
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

// Global instance
let enhancedBookingModal;
