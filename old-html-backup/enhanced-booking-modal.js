/**
 * Enhanced Booking Modal System
 * Creates iTalki-style detailed time slot selection popup
 */

// Debug: Log that script is loading
console.log('📥 [ENHANCED-MODAL] Script loading started...');

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
        console.log('🚀 [MODAL] Initializing enhanced booking modal...');
        console.log('🚀 [MODAL] Initialization parameters:', {
            tutorId,
            currentUserId: currentUser?.id,
            currentUserEmail: currentUser?.email,
            availabilityDataKeys: Object.keys(availabilityData || {}),
            lessonRequestsDataKeys: Object.keys(lessonRequests || {}),
            supabaseAvailable: !!this.supabase
        });

        this.tutorId = tutorId;
        this.currentUser = currentUser;
        this.availabilityData = availabilityData;
        this.lessonRequests = lessonRequests;

        console.log('✅ [MODAL] Enhanced booking modal initialized with:', {
            tutorId: this.tutorId,
            currentUser: this.currentUser?.id,
            availabilitySlots: Object.keys(this.availabilityData).length,
            lessonRequests: Object.keys(this.lessonRequests).length
        });

        this.createModalHTML();

        // Verify initialization
        const modal = document.getElementById('enhancedBookingModal');
        const bookBtn = document.getElementById('bookLessonBtn');

        console.log('🔍 [MODAL] Post-initialization check:', {
            modalExists: !!modal,
            bookButtonExists: !!bookBtn,
            tutorIdSet: !!this.tutorId,
            currentUserSet: !!this.currentUser,
            supabaseSet: !!this.supabase
        });
    }

    // Create the modal HTML structure
    createModalHTML() {
        const modalHTML = `
            <div id="enhancedBookingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                    <!-- Modal Header -->
                    <div class="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
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
                    <div class="flex flex-1 min-h-0">
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
                    <div class="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
                    <div class="flex justify-between items-center p-6 border-t-4 border-red-300 bg-red-50 min-h-[100px] flex-shrink-0">
                        <div id="selectedSlotInfo" class="text-sm text-gray-800 font-semibold">
                            Select a time slot to continue
                        </div>
                        <div class="flex space-x-4">
                            <button id="modalCancelBtn"
                                    class="px-6 py-3 border-2 border-gray-500 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm">
                                Cancel
                            </button>
                            <button id="bookLessonBtn"
                                    class="px-10 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-xl border-2 border-red-700 text-sm"
                                    disabled>
                                📚 Book lesson
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

            // Debug: Check if modal elements were created
            const modal = document.getElementById('enhancedBookingModal');
            const bookBtn = document.getElementById('bookLessonBtn');
            const cancelBtn = document.getElementById('modalCancelBtn');
            const footer = modal?.querySelector('.border-t-4.border-red-300');

            console.log('🔘 [MODAL] Modal created:', modal ? 'YES' : 'NO');
            console.log('🔘 [MODAL] Footer created:', footer ? 'YES' : 'NO');
            console.log('🔘 [MODAL] Book lesson button created:', bookBtn ? 'YES' : 'NO');
            console.log('🔘 [MODAL] Cancel button created:', cancelBtn ? 'YES' : 'NO');

            if (bookBtn) {
                console.log('🔘 [MODAL] Button text:', bookBtn.textContent);
                console.log('🔘 [MODAL] Button classes:', bookBtn.className);
                console.log('🔘 [MODAL] Button visible:', bookBtn.offsetHeight > 0 ? 'YES' : 'NO');
            }

            if (footer) {
                console.log('🔘 [MODAL] Footer classes:', footer.className);
                console.log('🔘 [MODAL] Footer visible:', footer.offsetHeight > 0 ? 'YES' : 'NO');
            }
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

        // Book lesson button with enhanced debugging
        const bookBtn = document.getElementById('bookLessonBtn');
        if (bookBtn) {
            console.log('🔘 [MODAL] Book lesson button found, attaching click listener');

            // Remove any existing listeners
            bookBtn.replaceWith(bookBtn.cloneNode(true));
            const newBookBtn = document.getElementById('bookLessonBtn');

            newBookBtn.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('🔘 [MODAL] Book lesson button clicked!');
                console.log('🔘 [MODAL] Current context:', {
                    selectedTimeSlot: this.selectedTimeSlot,
                    currentUser: this.currentUser,
                    tutorId: this.tutorId
                });

                try {
                    await this.bookSelectedSlot();
                } catch (error) {
                    console.error('💥 [MODAL] Error in button click handler:', error);
                    this.showErrorMessage('An error occurred while booking. Please try again.');
                }
            });

            console.log('✅ [MODAL] Book lesson button click listener attached');
        } else {
            console.error('❌ [MODAL] Book lesson button not found during event listener setup!');
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
        console.log('🎯 [MODAL] Opening enhanced modal for date:', date);
        console.log('🎯 [MODAL] Current modal state:', {
            currentUser: this.currentUser?.id,
            tutorId: this.tutorId,
            supabase: !!this.supabase,
            availabilityData: Object.keys(this.availabilityData || {}).length,
            lessonRequests: Object.keys(this.lessonRequests || {}).length
        });

        this.selectedDate = new Date(date);
        this.selectedTimeSlot = null;
        // Start from current day for student booking (7-day view starting today)
        this.currentWeekStart = new Date();

        // Update modal title
        const modalTitle = document.getElementById('modalTitle');
        const modalSubtitle = document.getElementById('modalSubtitle');

        if (modalTitle) {
            modalTitle.textContent = 'Select Time Slot';
        }
        if (modalSubtitle) {
            modalSubtitle.textContent = this.formatDate(this.selectedDate);
        }

        console.log('🎯 [MODAL] Generating time slots and calendar...');

        // Generate time slots and calendar
        this.generateTimeSlots();
        this.generateCalendar();

        // Show modal
        const modal = document.getElementById('enhancedBookingModal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('✅ [MODAL] Modal displayed successfully');

            // Re-attach book button listener to ensure it's working
            setTimeout(() => {
                this.reattachBookButtonListener();
                this.debugModalState();
            }, 100);
        } else {
            console.error('❌ [MODAL] Modal element not found!');
        }

        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }

    // Debug modal state for troubleshooting
    debugModalState() {
        const modal = document.getElementById('enhancedBookingModal');
        const bookBtn = document.getElementById('bookLessonBtn');
        const footer = modal?.querySelector('.border-t-4.border-red-300');

        console.log('🔍 [MODAL] Debug modal state:');
        console.log('  - Modal element:', modal ? 'FOUND' : 'NOT FOUND');
        console.log('  - Book button element:', bookBtn ? 'FOUND' : 'NOT FOUND');
        console.log('  - Footer element:', footer ? 'FOUND' : 'NOT FOUND');

        if (bookBtn) {
            console.log('  - Button visible:', bookBtn.offsetHeight > 0 ? 'YES' : 'NO');
            console.log('  - Button disabled:', bookBtn.disabled);
            console.log('  - Button text:', bookBtn.textContent);
            console.log('  - Button classes:', bookBtn.className);

            // Test if button is clickable
            const rect = bookBtn.getBoundingClientRect();
            console.log('  - Button position:', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0
            });
        }

        if (footer) {
            const rect = footer.getBoundingClientRect();
            console.log('  - Footer position:', { top: rect.top, bottom: rect.bottom, height: rect.height });
        }

        // Test button click programmatically
        if (bookBtn) {
            console.log('🧪 [MODAL] Testing button click programmatically...');
            setTimeout(() => {
                try {
                    bookBtn.click();
                    console.log('✅ [MODAL] Programmatic click succeeded');
                } catch (error) {
                    console.error('❌ [MODAL] Programmatic click failed:', error);
                }
            }, 1000);
        }
    }

    // Re-attach book button listener to ensure it's working
    reattachBookButtonListener() {
        console.log('🔄 [MODAL] Starting book button re-attachment process...');

        const bookBtn = document.getElementById('bookLessonBtn');
        if (bookBtn) {
            console.log('🔄 [MODAL] Book button found, proceeding with re-attachment');
            console.log('🔄 [MODAL] Button current state:', {
                disabled: bookBtn.disabled,
                textContent: bookBtn.textContent,
                className: bookBtn.className,
                parentNode: bookBtn.parentNode?.tagName
            });

            // Remove any existing listeners by cloning the button
            const newBookBtn = bookBtn.cloneNode(true);
            bookBtn.parentNode.replaceChild(newBookBtn, bookBtn);

            console.log('🔄 [MODAL] Button cloned and replaced');

            // Add the click listener with comprehensive debugging
            newBookBtn.addEventListener('click', async (event) => {
                console.log('🔘 [MODAL] *** BUTTON CLICKED *** (re-attached listener)');
                console.log('🔘 [MODAL] Event details:', {
                    type: event.type,
                    target: event.target.tagName,
                    currentTarget: event.currentTarget.tagName,
                    bubbles: event.bubbles,
                    cancelable: event.cancelable
                });

                event.preventDefault();
                event.stopPropagation();

                console.log('🔘 [MODAL] About to call bookSelectedSlot()');
                console.log('🔘 [MODAL] Current context:', {
                    selectedTimeSlot: this.selectedTimeSlot,
                    currentUser: this.currentUser?.id,
                    tutorId: this.tutorId,
                    supabaseAvailable: !!this.supabase
                });

                try {
                    await this.bookSelectedSlot();
                    console.log('✅ [MODAL] bookSelectedSlot() completed successfully');
                } catch (error) {
                    console.error('💥 [MODAL] Error in re-attached button click handler:', error);
                    this.showErrorMessage('An error occurred while booking. Please try again.');
                }
            });

            // Also add a test listener to verify the button is working
            newBookBtn.addEventListener('mousedown', () => {
                console.log('🖱️ [MODAL] Button mousedown detected');
            });

            newBookBtn.addEventListener('mouseup', () => {
                console.log('🖱️ [MODAL] Button mouseup detected');
            });

            console.log('✅ [MODAL] Book button listener re-attached successfully with debugging');
        } else {
            console.error('❌ [MODAL] Book button not found for re-attachment');
            console.log('❌ [MODAL] Available elements with "book" in ID:');
            document.querySelectorAll('[id*="book"]').forEach(el => {
                console.log('  -', el.id, el.tagName, el.textContent?.substring(0, 20));
            });
        }
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
        console.log('🕐 [MODAL] Generating time slots...');

        const timeSlotsList = document.getElementById('timeSlotsList');
        if (!timeSlotsList) {
            console.error('❌ [MODAL] timeSlotsList element not found!');
            return;
        }

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

        console.log('🕐 [MODAL] Generated', timeSlots.length, 'time slots');

        timeSlotsList.innerHTML = timeSlots.map(time => `
            <div class="text-xs text-gray-600 text-center border-b border-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center" style="height: 32px; min-height: 32px; border-width: 0.5px;">
                ${this.formatTime(time + ':00')}
            </div>
        `).join('');

        console.log('✅ [MODAL] Time slots rendered successfully');
    }

    // Generate calendar grid
    generateCalendar() {
        console.log('📅 [MODAL] Generating calendar...');

        this.generateDaysHeader();
        this.generateCalendarGrid();
        this.updateWeekRange();

        // Setup synchronized scrolling and re-attach navigation listeners after calendar is generated
        setTimeout(() => {
            this.setupSynchronizedScrolling();
            this.attachNavigationListeners();
        }, 100);

        console.log('✅ [MODAL] Calendar generated successfully');
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
        console.log('📊 [MODAL] Generating calendar grid...');

        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) {
            console.error('❌ [MODAL] calendarGrid element not found!');
            return;
        }

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

        console.log('📊 [MODAL] Generated', timeSlots.length, 'time slots for grid');
        console.log('📊 [MODAL] Availability data:', Object.keys(this.availabilityData).length, 'slots');
        console.log('📊 [MODAL] Lesson requests data:', Object.keys(this.lessonRequests || {}).length, 'requests');

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
                    <div class="${slotClass} border-r border-b border-gray-100 last:border-r-0 ${isClickable ? 'cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-150' : 'cursor-not-allowed'}"
                         style="height: 32px; min-height: 32px; border-width: 0.5px;"
                         data-date="${dateString}" data-time="${time}"
                         data-clickable="${isClickable}">
                    </div>
                `;
            }
        });

        calendarGrid.innerHTML = gridHTML;
        console.log('✅ [MODAL] Calendar grid rendered with', timeSlots.length * 7, 'slots');

        // Add click event listeners to all slots
        this.attachSlotClickListeners();
    }

    // Attach click listeners to calendar slots
    attachSlotClickListeners() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        // Remove existing listeners
        calendarGrid.removeEventListener('click', this.handleSlotClick);

        // Add new listener
        this.handleSlotClick = (event) => {
            const slot = event.target.closest('[data-date][data-time]');
            if (!slot) return;

            const date = slot.getAttribute('data-date');
            const time = slot.getAttribute('data-time');
            const isClickable = slot.getAttribute('data-clickable') === 'true';

            if (isClickable && date && time) {
                console.log('🎯 [MODAL] Slot clicked:', { date, time });
                this.selectTimeSlot(date, time);
            } else {
                console.log('⚠️ [MODAL] Slot not clickable or missing data:', { date, time, isClickable });
            }
        };

        calendarGrid.addEventListener('click', this.handleSlotClick);
        console.log('✅ [MODAL] Slot click listeners attached');
    }

    // Get slot status based on availability and requests
    getSlotStatus(dayOfWeek, time, dateString) {
        const availKey = `${dayOfWeek}-${time}`;
        const requestKey = `${dateString}-${time}`;

        console.log('🔍 [STATUS] Checking slot:', { dayOfWeek, time, dateString, availKey, requestKey });

        // Check if there's a pending request
        if (this.lessonRequests && this.lessonRequests[requestKey]) {
            const request = this.lessonRequests[requestKey];
            console.log('📋 [STATUS] Found lesson request:', request);
            if (request.status === 'pending') return 'pending';
            if (request.status === 'approved') return 'confirmed';
        }

        // Check if slot is available
        if (this.availabilityData && this.availabilityData[availKey] && this.availabilityData[availKey].is_available) {
            console.log('✅ [STATUS] Slot is available:', this.availabilityData[availKey]);
            return 'available';
        }

        console.log('❌ [STATUS] Slot unavailable');
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
        console.log('🎯 [MODAL] Time slot selected:', { date, time });

        // Remove previous selection
        document.querySelectorAll('[data-selected="true"]').forEach(el => {
            el.removeAttribute('data-selected');
            el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-1', 'ring-4', 'ring-blue-500');
        });

        // Add selection to clicked slot
        const slot = document.querySelector(`[data-date="${date}"][data-time="${time}"]`);
        if (slot) {
            slot.setAttribute('data-selected', 'true');
            slot.classList.add('ring-4', 'ring-blue-500', 'ring-offset-1');
            console.log('✅ [MODAL] Slot visual selection applied');

            // Add visual feedback with animation
            slot.style.transform = 'scale(1.05)';
            setTimeout(() => {
                slot.style.transform = 'scale(1)';
            }, 200);
        } else {
            console.error('❌ [MODAL] Could not find slot element to select');
        }

        this.selectedTimeSlot = { date, time };
        this.updateSelectedSlotInfo();
        this.updateBookButton();

        console.log('✅ [MODAL] Time slot selection complete');
    }

    // Update selected slot info
    updateSelectedSlotInfo() {
        const info = document.getElementById('selectedSlotInfo');
        if (!info) {
            console.error('❌ [MODAL] selectedSlotInfo element not found');
            return;
        }

        if (this.selectedTimeSlot) {
            const { date, time } = this.selectedTimeSlot;
            const endTime = this.getEndTime(time);
            const formattedDate = this.formatDate(new Date(date));
            const formattedStartTime = this.formatTime(time);
            const formattedEndTime = this.formatTime(endTime);

            info.innerHTML = `
                <div class="text-sm font-semibold text-green-700">
                    ✅ Selected: ${formattedDate}
                </div>
                <div class="text-xs text-green-600">
                    ${formattedStartTime} - ${formattedEndTime} (30 minutes)
                </div>
            `;
            console.log('✅ [MODAL] Selected slot info updated:', { date, time });
        } else {
            info.innerHTML = `
                <div class="text-sm text-gray-700 font-medium">
                    Select a time slot to continue
                </div>
            `;
        }
    }

    // Update book button state
    updateBookButton() {
        const bookBtn = document.getElementById('bookLessonBtn');
        if (bookBtn) {
            bookBtn.disabled = !this.selectedTimeSlot;
            console.log('🔘 [MODAL] Book button updated - disabled:', bookBtn.disabled, 'selectedSlot:', this.selectedTimeSlot);
        } else {
            console.error('❌ [MODAL] Book button not found when trying to update!');
        }
    }

    // Book selected slot - Enhanced with better error handling and user feedback
    async bookSelectedSlot() {
        console.log('🚀🚀🚀 [BOOKING] *** bookSelectedSlot() method called ***');
        console.log('🚀 [BOOKING] Method execution started at:', new Date().toISOString());
        console.log('🚀 [BOOKING] Call stack:', new Error().stack);

        // Comprehensive validation
        if (!this.selectedTimeSlot) {
            console.error('❌ [BOOKING] No time slot selected');
            this.showErrorMessage('Please select a time slot first.');
            return;
        }

        if (!this.currentUser) {
            console.error('❌ [BOOKING] No current user');
            this.showErrorMessage('Please log in to book a lesson.');
            return;
        }

        if (!this.tutorId) {
            console.error('❌ [BOOKING] No tutor ID');
            this.showErrorMessage('Tutor information not available.');
            return;
        }

        if (!this.supabase) {
            console.error('❌ [BOOKING] Supabase client not available');
            this.showErrorMessage('Database connection not available.');
            return;
        }

        const { date, time } = this.selectedTimeSlot;
        const endTime = this.getEndTime(time);

        // Show loading state
        const bookBtn = document.getElementById('bookLessonBtn');
        if (!bookBtn) {
            console.error('❌ [BOOKING] Book button not found');
            return;
        }

        const originalText = bookBtn.textContent;
        bookBtn.disabled = true;
        bookBtn.textContent = '⏳ Booking...';
        bookBtn.classList.add('opacity-75');

        try {
            console.log('📝 [BOOKING] Creating lesson request with data:', {
                date,
                time,
                endTime,
                tutorId: this.tutorId,
                studentId: this.currentUser.id,
                supabaseAvailable: !!this.supabase
            });

            // Check authentication status
            const { data: { session }, error: authError } = await this.supabase.auth.getSession();
            if (authError) {
                console.error('❌ [BOOKING] Auth error:', authError);
                throw new Error('Authentication error. Please log in again.');
            }

            if (!session) {
                console.error('❌ [BOOKING] No active session');
                throw new Error('Please log in to book a lesson.');
            }

            console.log('✅ [BOOKING] Authentication verified, proceeding with database insert');

            const insertData = {
                tutor_id: this.tutorId,
                student_id: this.currentUser.id,
                requested_date: date,
                requested_start_time: time,
                requested_end_time: endTime,
                status: 'pending',
                student_message: 'Lesson booking request via enhanced booking system'
            };

            console.log('📝 [BOOKING] Insert data:', insertData);

            const { data, error } = await this.supabase
                .from('lesson_requests')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('❌ [BOOKING] Database error details:', {
                    error,
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });

                // Provide specific error messages
                let errorMessage = 'Failed to send lesson request. ';
                if (error.code === '23505') {
                    errorMessage += 'You already have a request for this time slot.';
                } else if (error.code === '42501') {
                    errorMessage += 'Permission denied. Please log in again.';
                } else if (error.message.includes('JWT')) {
                    errorMessage += 'Session expired. Please log in again.';
                } else {
                    errorMessage += error.message || 'Please try again.';
                }

                throw new Error(errorMessage);
            }

            console.log('✅ [BOOKING] Lesson request created successfully:', data);

            // Show success message with details
            const formattedDate = this.formatDate(new Date(date));
            const formattedTime = this.formatTime(time);
            this.showSuccessMessage(`✅ Lesson request sent for ${formattedDate} at ${formattedTime}! The tutor will review and respond soon.`);

            // Update local data to show pending status
            const requestKey = `${date}-${time}`;
            if (!this.lessonRequests) this.lessonRequests = {};
            this.lessonRequests[requestKey] = {
                id: data.id,
                tutor_id: this.tutorId,
                student_id: this.currentUser.id,
                requested_date: date,
                requested_start_time: time,
                requested_end_time: endTime,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            // Regenerate calendar to show updated status
            this.generateCalendarGrid();

            // Close modal after a short delay to show the updated status
            setTimeout(() => {
                this.closeModal();
            }, 2000);

            // Trigger refresh of parent booking system
            if (window.bookingSystem && typeof window.bookingSystem.loadBookingData === 'function') {
                console.log('🔄 [BOOKING] Refreshing booking data...');
                setTimeout(async () => {
                    try {
                        await window.bookingSystem.loadBookingData();
                        if (window.bookingSystem.renderAvailabilityGrid) {
                            window.bookingSystem.renderAvailabilityGrid('availabilityContainer');
                        }
                    } catch (refreshError) {
                        console.error('❌ [BOOKING] Error refreshing booking data:', refreshError);
                    }
                }, 2500);
            }

        } catch (error) {
            console.error('💥 [BOOKING] Error creating lesson request:', error);

            // Show specific error message
            let errorMessage = error.message || 'Failed to send lesson request. Please try again.';

            // Additional error handling for common issues
            if (error.message.includes('duplicate') || error.message.includes('23505')) {
                errorMessage = 'You already have a request for this time slot.';
            } else if (error.message.includes('permission') || error.message.includes('42501')) {
                errorMessage = 'Permission denied. Please log in again.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('JWT') || error.message.includes('session')) {
                errorMessage = 'Session expired. Please refresh the page and log in again.';
            }

            this.showErrorMessage(errorMessage);

            // Log additional debugging info
            console.error('💥 [BOOKING] Full error context:', {
                error: error,
                stack: error.stack,
                selectedTimeSlot: this.selectedTimeSlot,
                currentUser: this.currentUser?.id,
                tutorId: this.tutorId,
                supabaseClient: !!this.supabase
            });

        } finally {
            // Reset button state
            if (bookBtn) {
                bookBtn.disabled = false;
                bookBtn.textContent = originalText;
                bookBtn.classList.remove('opacity-75');
                console.log('🔘 [BOOKING] Button state reset');
            }
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
        console.log('✅ [NOTIFICATION] Showing success message:', message);

        // Remove any existing notifications
        document.querySelectorAll('.booking-notification').forEach(el => el.remove());

        const notification = document.createElement('div');
        notification.className = 'booking-notification fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl z-[9999] max-w-md';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <div class="text-sm font-medium">${message}</div>
            </div>
        `;

        // Add animation
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease-in-out';

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    showErrorMessage(message) {
        console.log('❌ [NOTIFICATION] Showing error message:', message);

        // Remove any existing notifications
        document.querySelectorAll('.booking-notification').forEach(el => el.remove());

        const notification = document.createElement('div');
        notification.className = 'booking-notification fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl z-[9999] max-w-md';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <div class="text-sm font-medium">${message}</div>
            </div>
        `;

        // Add animation
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease-in-out';

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 6000);
    }
}

// Global instance
let enhancedBookingModal;

// Initialize global enhanced booking modal when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Supabase to be available
    if (typeof window.supabase !== 'undefined') {
        initializeGlobalEnhancedModal();
    } else {
        // Wait for Supabase to load
        const checkSupabase = setInterval(() => {
            if (typeof window.supabase !== 'undefined') {
                clearInterval(checkSupabase);
                initializeGlobalEnhancedModal();
            }
        }, 100);
    }
});

function initializeGlobalEnhancedModal() {
    try {
        // Get Supabase client from global scope or create one
        let supabaseClient;
        if (window.supabase && window.supabase.createClient) {
            const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else if (window.supabase) {
            supabaseClient = window.supabase;
        } else {
            console.warn('⚠️ [MODAL] Supabase not available for enhanced modal');
            return;
        }

        enhancedBookingModal = new EnhancedBookingModal(supabaseClient);
        console.log('✅ [MODAL] Global enhanced booking modal initialized');
    } catch (error) {
        console.error('❌ [MODAL] Error initializing global enhanced modal:', error);
    }
}

// Debug: Log that script loaded completely
console.log('✅ [ENHANCED-MODAL] Script loaded completely - EnhancedBookingModal class available:', typeof EnhancedBookingModal);
