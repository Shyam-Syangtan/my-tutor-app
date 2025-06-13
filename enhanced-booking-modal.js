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
                        <button onclick="enhancedBookingModal.closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Modal Content -->
                    <div class="flex h-[70vh]">
                        <!-- Time Slots Sidebar -->
                        <div class="w-32 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                            <div class="p-3 border-b border-gray-200">
                                <div class="text-xs font-medium text-gray-600 text-center">UTC+08:00</div>
                            </div>
                            <div id="timeSlotsList" class="space-y-1 p-2">
                                <!-- Time slots will be generated here -->
                            </div>
                        </div>

                        <!-- Calendar Grid -->
                        <div class="flex-1 overflow-hidden">
                            <!-- Week Navigation -->
                            <div class="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                                <button onclick="enhancedBookingModal.previousWeek()" class="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <div class="text-center">
                                    <h4 id="weekRange" class="font-semibold text-gray-900">Loading...</h4>
                                    <p class="text-xs text-gray-500">Click available slots to book</p>
                                </div>
                                <button onclick="enhancedBookingModal.nextWeek()" class="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            </div>

                            <!-- Days Header -->
                            <div id="daysHeader" class="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                                <!-- Day headers will be generated here -->
                            </div>

                            <!-- Calendar Grid -->
                            <div class="overflow-y-auto" style="height: calc(100% - 120px);">
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
                            <button onclick="enhancedBookingModal.closeModal()" 
                                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button id="bookLessonBtn" onclick="enhancedBookingModal.bookSelectedSlot()" 
                                    class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled>
                                Book lesson
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body if it doesn't exist
        if (!document.getElementById('enhancedBookingModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    // Open modal for specific date
    openModal(date) {
        this.selectedDate = new Date(date);
        this.selectedTimeSlot = null;
        this.currentWeekStart = this.getStartOfWeek(this.selectedDate);
        
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

    // Generate 30-minute time slots from 6 AM to 11 PM
    generateTimeSlots() {
        const timeSlotsList = document.getElementById('timeSlotsList');
        const timeSlots = [];
        
        // Generate 30-minute intervals from 06:00 to 23:00
        for (let hour = 6; hour <= 23; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                timeSlots.push(timeString);
            }
        }
        
        timeSlotsList.innerHTML = timeSlots.map(time => `
            <div class="text-xs text-gray-600 py-2 text-center border-b border-gray-100">
                ${this.formatTime(time + ':00')}
            </div>
        `).join('');
    }

    // Generate calendar grid
    generateCalendar() {
        this.generateDaysHeader();
        this.generateCalendarGrid();
        this.updateWeekRange();
    }

    // Generate days header
    generateDaysHeader() {
        const daysHeader = document.getElementById('daysHeader');
        const days = ['FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'];
        
        daysHeader.innerHTML = days.map((day, index) => {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + index);
            
            return `
                <div class="p-3 text-center border-r border-gray-200 last:border-r-0">
                    <div class="font-semibold text-sm text-gray-900">${day}</div>
                    <div class="text-xs text-gray-500">${date.getDate()}</div>
                </div>
            `;
        }).join('');
    }

    // Generate calendar grid with time slots
    generateCalendarGrid() {
        const calendarGrid = document.getElementById('calendarGrid');
        const timeSlots = [];
        
        // Generate 30-minute intervals
        for (let hour = 6; hour <= 23; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
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
                const isClickable = slotStatus === 'available';
                
                gridHTML += `
                    <div class="${slotClass} border-r border-b border-gray-200 last:border-r-0 h-8 ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}"
                         ${isClickable ? `onclick="enhancedBookingModal.selectTimeSlot('${dateString}', '${time}')"` : ''}
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

    // Book selected slot
    async bookSelectedSlot() {
        if (!this.selectedTimeSlot || !this.currentUser) {
            return;
        }

        const { date, time } = this.selectedTimeSlot;
        const endTime = this.getEndTime(time);

        try {
            console.log('📝 Creating lesson request:', { date, time, endTime });

            const { data, error } = await this.supabase
                .from('lesson_requests')
                .insert([{
                    tutor_id: this.tutorId,
                    student_id: this.currentUser.id,
                    requested_date: date,
                    requested_start_time: time,
                    requested_end_time: endTime,
                    status: 'pending',
                    student_message: 'Lesson booking request via enhanced booking system'
                }])
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('✅ Lesson request created:', data);
            
            // Show success message
            this.showSuccessMessage('Lesson request sent! The tutor will review and respond soon.');
            
            // Close modal
            this.closeModal();
            
            // Trigger refresh of parent booking system
            if (window.bookingSystem && typeof window.bookingSystem.loadBookingData === 'function') {
                await window.bookingSystem.loadBookingData();
                window.bookingSystem.renderAvailabilityGrid('availabilityContainer');
            }

        } catch (error) {
            console.error('💥 Error creating lesson request:', error);
            this.showErrorMessage('Failed to send lesson request. Please try again.');
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

    // Utility functions
    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        return new Date(d.setDate(diff));
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
