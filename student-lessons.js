/**
 * Student Lessons Management System
 * Handles viewing and managing student's lessons and requests
 */

// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase;
let currentUser;
let currentFilter = 'upcoming';
let lessons = [];
let lessonRequests = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        currentUser = session.user;
        
        // Update user info in nav
        document.getElementById('userEmail').textContent = currentUser.email;

        // Load lessons and requests
        await loadStudentLessons();
        
        // Setup event listeners
        setupEventListeners();

        // Hide loading state
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');

    } catch (error) {
        console.error('Error initializing student lessons:', error);
        showErrorMessage('Failed to load lessons. Please refresh the page.');
    }
});

// Load student's lessons and requests
async function loadStudentLessons() {
    try {
        console.log('Loading lessons for student:', currentUser.id);
        
        // Load confirmed lessons (with separate tutor data loading)
        console.log('📚 [STUDENT] Loading confirmed lessons...');
        const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('student_id', currentUser.id)
            .order('lesson_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (lessonsError) {
            console.error('❌ [STUDENT] Error loading lessons:', lessonsError);
            lessons = [];
        } else {
            console.log('✅ [STUDENT] Loaded lessons:', lessonsData?.length || 0);

            // Load tutor information separately for each lesson
            lessons = [];
            for (const lesson of (lessonsData || [])) {
                try {
                    const { data: tutorData, error: tutorError } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', lesson.tutor_id)
                        .single();

                    lessons.push({
                        ...lesson,
                        tutor: tutorData || { email: 'Unknown Tutor' }
                    });
                } catch (tutorError) {
                    console.warn('Could not load tutor data for lesson:', lesson.id);
                    lessons.push({
                        ...lesson,
                        tutor: { email: 'Unknown Tutor' }
                    });
                }
            }
        }

        // Load lesson requests (pending approval) - with separate tutor data loading
        console.log('📋 [STUDENT] Loading lesson requests...');
        const { data: requestsData, error: requestsError } = await supabase
            .from('lesson_requests')
            .select('*')
            .eq('student_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (requestsError) {
            console.error('❌ [STUDENT] Error loading lesson requests:', requestsError);
            lessonRequests = [];
        } else {
            console.log('✅ [STUDENT] Loaded lesson requests:', requestsData?.length || 0);

            // Load tutor information separately for each request
            lessonRequests = [];
            for (const request of (requestsData || [])) {
                try {
                    const { data: tutorData, error: tutorError } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', request.tutor_id)
                        .single();

                    lessonRequests.push({
                        ...request,
                        tutor: tutorData || { email: 'Unknown Tutor' }
                    });
                } catch (tutorError) {
                    console.warn('Could not load tutor data for request:', request.id);
                    lessonRequests.push({
                        ...request,
                        tutor: { email: 'Unknown Tutor' }
                    });
                }
            }
        }
        
        // Update stats and render
        updateStats();
        renderLessons();

    } catch (error) {
        console.error('Error loading student lessons:', error);
        showErrorMessage('Failed to load lessons.');
    }
}

// Update statistics cards
function updateStats() {
    const now = new Date();

    // Count lessons by status
    const pending = lessonRequests.filter(req => req.status === 'pending').length;
    const confirmed = lessons.filter(lesson =>
        lesson.status === 'confirmed' && new Date(lesson.lesson_date + 'T' + lesson.start_time) > now
    ).length;
    const completed = lessons.filter(lesson => lesson.status === 'completed').length;
    const total = lessons.length + lessonRequests.length;

    // Update UI
    const pendingElement = document.getElementById('pendingCount');
    const confirmedElement = document.getElementById('confirmedCount');
    const completedElement = document.getElementById('completedCount');
    const totalElement = document.getElementById('totalCount');
    const upcomingElement = document.getElementById('upcomingCount');

    if (pendingElement) pendingElement.textContent = pending;
    if (confirmedElement) confirmedElement.textContent = confirmed;
    if (completedElement) completedElement.textContent = completed;
    if (totalElement) totalElement.textContent = total;
    if (upcomingElement) upcomingElement.textContent = confirmed + pending;

    // Add notification styling for pending requests
    if (pending > 0) {
        const pendingCard = pendingElement?.closest('.bg-white');
        if (pendingCard) {
            pendingCard.classList.add('border-yellow-300', 'bg-yellow-50');
        }
    }
}

// Render lessons based on current filter
function renderLessons() {
    const container = document.getElementById('lessonsContainer');
    const emptyState = document.getElementById('emptyState');
    
    // Combine lessons and requests based on filter
    let filteredItems = [];
    const now = new Date();
    
    switch (currentFilter) {
        case 'upcoming':
            // Confirmed lessons in the future + pending requests
            filteredItems = [
                ...lessons.filter(lesson => 
                    lesson.status === 'confirmed' && 
                    new Date(lesson.lesson_date + 'T' + lesson.start_time) > now
                ),
                ...lessonRequests.filter(req => req.status === 'pending')
            ];
            break;
        case 'pending':
            filteredItems = lessonRequests.filter(req => req.status === 'pending');
            break;
        case 'completed':
            filteredItems = lessons.filter(lesson => lesson.status === 'completed');
            break;
        case 'all':
            filteredItems = [...lessons, ...lessonRequests];
            break;
    }

    if (filteredItems.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    // Sort by date/time
    filteredItems.sort((a, b) => {
        const dateA = new Date((a.lesson_date || a.requested_date) + 'T' + (a.start_time || a.requested_start_time));
        const dateB = new Date((b.lesson_date || b.requested_date) + 'T' + (b.start_time || b.requested_start_time));
        return dateA - dateB;
    });

    container.innerHTML = filteredItems.map(item => {
        const isRequest = !!item.requested_date;
        const date = item.lesson_date || item.requested_date;
        const startTime = item.start_time || item.requested_start_time;
        const endTime = item.end_time || item.requested_end_time;
        const status = item.status;
        const tutorEmail = item.tutor?.email || 'Unknown Tutor';
        
        return `
            <div class="lesson-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span class="text-indigo-600 font-semibold">
                                ${tutorEmail.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${tutorEmail}</h3>
                            <p class="text-sm text-gray-500">
                                ${isRequest ? 'Lesson Request' : 'Confirmed Lesson'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${getStatusBadge(status)}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="text-sm text-gray-600 mb-1">Date</div>
                        <div class="font-semibold text-gray-900">
                            ${formatLessonDate(date)}
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="text-sm text-gray-600 mb-1">Time</div>
                        <div class="font-semibold text-gray-900">
                            ${formatTime(startTime)} - ${formatTime(endTime)}
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="text-sm text-gray-600 mb-1">Type</div>
                        <div class="font-semibold text-gray-900">
                            ${item.lesson_type || 'Conversation Practice'}
                        </div>
                    </div>
                </div>

                ${item.notes || item.student_message ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div class="text-sm text-blue-800 font-medium mb-1">Notes:</div>
                        <div class="text-blue-700">${item.notes || item.student_message}</div>
                    </div>
                ` : ''}

                ${item.tutor_response && isRequest ? `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                        <div class="text-sm text-gray-600 font-medium mb-1">Tutor Response:</div>
                        <div class="text-gray-700">${item.tutor_response}</div>
                    </div>
                ` : ''}

                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                        ${isRequest ? 
                            `Requested ${formatDate(item.created_at)}` : 
                            `Created ${formatDate(item.created_at)}`
                        }
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="viewLessonDetails('${item.id}', ${isRequest})" 
                                class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            View Details
                        </button>
                        ${status === 'confirmed' && !isPastLesson(date, startTime) ? `
                            <button onclick="cancelLesson('${item.id}')" 
                                    class="text-red-600 hover:text-red-700 text-sm font-medium">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="status-pending text-xs px-2 py-1 rounded-full">Pending Approval</span>',
        confirmed: '<span class="status-confirmed text-xs px-2 py-1 rounded-full">Confirmed</span>',
        completed: '<span class="status-completed text-xs px-2 py-1 rounded-full">Completed</span>',
        cancelled: '<span class="status-cancelled text-xs px-2 py-1 rounded-full">Cancelled</span>',
        approved: '<span class="status-confirmed text-xs px-2 py-1 rounded-full">Approved</span>',
        declined: '<span class="status-cancelled text-xs px-2 py-1 rounded-full">Declined</span>'
    };
    return badges[status] || badges.pending;
}

// Check if lesson is in the past
function isPastLesson(date, time) {
    const lessonDateTime = new Date(date + 'T' + time);
    return lessonDateTime < new Date();
}

// View lesson details in modal
function viewLessonDetails(itemId, isRequest) {
    const item = isRequest ? 
        lessonRequests.find(req => req.id === itemId) : 
        lessons.find(lesson => lesson.id === itemId);
    
    if (!item) return;

    const modalContent = document.getElementById('lessonModalContent');
    const date = item.lesson_date || item.requested_date;
    const startTime = item.start_time || item.requested_start_time;
    const endTime = item.end_time || item.requested_end_time;
    
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-sm font-medium text-gray-600">Tutor</label>
                    <p class="text-gray-900">${item.tutor?.email || 'Unknown'}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Status</label>
                    <div class="mt-1">${getStatusBadge(item.status)}</div>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Date</label>
                    <p class="text-gray-900">${formatLessonDate(date)}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Time</label>
                    <p class="text-gray-900">${formatTime(startTime)} - ${formatTime(endTime)}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Type</label>
                    <p class="text-gray-900">${item.lesson_type || 'Conversation Practice'}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Duration</label>
                    <p class="text-gray-900">1 hour</p>
                </div>
            </div>
            
            ${item.notes || item.student_message ? `
                <div>
                    <label class="text-sm font-medium text-gray-600">Notes</label>
                    <p class="text-gray-900 mt-1">${item.notes || item.student_message}</p>
                </div>
            ` : ''}
            
            ${item.tutor_response ? `
                <div>
                    <label class="text-sm font-medium text-gray-600">Tutor Response</label>
                    <p class="text-gray-900 mt-1">${item.tutor_response}</p>
                </div>
            ` : ''}
            
            ${item.google_meet_link ? `
                <div>
                    <label class="text-sm font-medium text-gray-600">Meeting Link</label>
                    <a href="${item.google_meet_link}" target="_blank" 
                       class="text-indigo-600 hover:text-indigo-700 mt-1 block">
                        Join Google Meet
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('lessonModal').classList.remove('hidden');
}

// Close lesson modal
function closeLessonModal() {
    document.getElementById('lessonModal').classList.add('hidden');
}

// Setup event listeners
function setupEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.filter;
            setActiveFilter(filter);
        });
    });
}

// Set active filter
function setActiveFilter(filter) {
    currentFilter = filter;
    
    // Update tab appearance
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active', 'border-b-2', 'border-indigo-500', 'text-indigo-600');
        tab.classList.add('text-gray-500');
    });
    
    const activeTab = document.querySelector(`[data-filter="${filter}"]`);
    activeTab.classList.add('active', 'border-b-2', 'border-indigo-500', 'text-indigo-600');
    activeTab.classList.remove('text-gray-500');
    
    // Re-render lessons
    renderLessons();
}

// Refresh lessons
async function refreshLessons() {
    await loadStudentLessons();
    showSuccessMessage('Lessons refreshed!');
}

// Navigation functions
function goBackToStudentDashboard() {
    window.location.href = 'student-dashboard.html';
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        supabase.auth.signOut();
        window.location.href = 'index.html';
    }
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatLessonDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Cancel lesson function
async function cancelLesson(lessonId) {
    if (!confirm('Are you sure you want to cancel this lesson?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('lessons')
            .update({ status: 'cancelled' })
            .eq('id', lessonId);

        if (error) {
            throw error;
        }

        showSuccessMessage('Lesson cancelled successfully.');
        await loadStudentLessons();
    } catch (error) {
        console.error('Error cancelling lesson:', error);
        showErrorMessage('Failed to cancel lesson. Please try again.');
    }
}
