/**
 * Tutor Lessons Management System
 * Handles viewing and managing tutor's lessons and teaching schedule
 */

// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase;
let currentUser;
let currentFilter = 'today';
let lessons = [];
let userNameResolver;

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

        // Initialize user name resolver
        userNameResolver = new window.UserNameResolver(supabase, {
            getCurrentUser: () => currentUser,
            getUserProfile: () => currentUser.user_metadata || {}
        });

        // Update user info in nav
        document.getElementById('userEmail').textContent = currentUser.email;

        // Load lessons
        await loadTutorLessons();
        
        // Setup event listeners
        setupEventListeners();

        // Hide loading state
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');

    } catch (error) {
        console.error('Error initializing tutor lessons:', error);
        showErrorMessage('Failed to load lessons. Please refresh the page.');
    }
});

// Load tutor's lessons
async function loadTutorLessons() {
    try {
        console.log('Loading lessons for tutor:', currentUser.id);

        // STABLE APPROACH - Simple query then resolve names
        const { data: basicLessons, error: basicError } = await supabase
            .from('lessons')
            .select('*')
            .eq('tutor_id', currentUser.id)
            .order('lesson_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (basicError) {
            throw basicError;
        }

        console.log('✅ [TUTOR] Basic lessons query successful, found', basicLessons?.length || 0, 'lessons');

        // Resolve student names using the stable resolver
        if (basicLessons && basicLessons.length > 0) {
            const studentIds = [...new Set(basicLessons.map(lesson => lesson.student_id))];
            const studentNames = await userNameResolver.batchGetUserNames(studentIds, 'student');

            // Transform lessons with resolved names
            lessons = basicLessons.map(lesson => ({
                ...lesson,
                student: {
                    id: lesson.student_id,
                    email: 'student@example.com', // Placeholder
                    raw_user_meta_data: {
                        name: studentNames.get(lesson.student_id) || 'Student'
                    }
                },
                student_email: 'student@example.com', // Placeholder
                student_name: studentNames.get(lesson.student_id) || 'Student'
            }));

            console.log('✅ [TUTOR] Student names resolved for', lessons.length, 'lessons');
        } else {
            lessons = [];
        }

        console.log('📊 [TUTOR] Total lessons loaded:', lessons.length);

        // Update stats and render
        updateStats();
        renderLessons();

    } catch (error) {
        console.error('Error loading tutor lessons:', error);
        showErrorMessage('Failed to load lessons.');
    }
}

// Update statistics cards
function updateStats() {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Count lessons by categories
    const todayLessons = lessons.filter(lesson => lesson.lesson_date === today).length;
    const upcomingLessons = lessons.filter(lesson => 
        lesson.status === 'confirmed' && 
        new Date(lesson.lesson_date + 'T' + lesson.start_time) > now
    ).length;
    const weekLessons = lessons.filter(lesson => {
        const lessonDate = new Date(lesson.lesson_date);
        return lessonDate >= weekStart && lessonDate <= weekEnd && lesson.status === 'confirmed';
    }).length;
    const completedLessons = lessons.filter(lesson => lesson.status === 'completed').length;
    
    // Count unique students
    const uniqueStudents = new Set(lessons.map(lesson => lesson.student_id)).size;
    
    // Update UI
    document.getElementById('todayCount').textContent = todayLessons;
    document.getElementById('upcomingCount').textContent = upcomingLessons;
    document.getElementById('weekCount').textContent = weekLessons;
    document.getElementById('completedCount').textContent = completedLessons;
    document.getElementById('studentsCount').textContent = uniqueStudents;
}

// Render lessons based on current filter
function renderLessons() {
    const container = document.getElementById('lessonsContainer');
    const emptyState = document.getElementById('emptyState');
    
    // Filter lessons based on current filter
    let filteredLessons = [];
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    
    switch (currentFilter) {
        case 'today':
            filteredLessons = lessons.filter(lesson => lesson.lesson_date === today);
            break;
        case 'upcoming':
            filteredLessons = lessons.filter(lesson => 
                lesson.status === 'confirmed' && 
                new Date(lesson.lesson_date + 'T' + lesson.start_time) > now
            );
            break;
        case 'completed':
            filteredLessons = lessons.filter(lesson => lesson.status === 'completed');
            break;
        case 'all':
            filteredLessons = lessons;
            break;
    }

    if (filteredLessons.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    // Sort by date/time
    filteredLessons.sort((a, b) => {
        const dateA = new Date(a.lesson_date + 'T' + a.start_time);
        const dateB = new Date(b.lesson_date + 'T' + b.start_time);
        return dateA - dateB;
    });

    container.innerHTML = filteredLessons.map(lesson => {
        const studentData = lesson.student;

        console.log('🔍 [TUTOR] Raw student data for lesson', lesson.id, ':', studentData);
        console.log('🔍 [TUTOR] Student raw_user_meta_data:', studentData?.raw_user_meta_data);

        const studentName = studentData?.raw_user_meta_data?.name ||
                           studentData?.raw_user_meta_data?.full_name ||
                           studentData?.email?.split('@')[0] ||
                           'Unknown Student';
        const studentEmail = lesson.student_email || lesson.student?.email || 'Unknown Student';
        const isPast = isPastLesson(lesson.lesson_date, lesson.start_time);

        console.log('👤 [TUTOR] Processing lesson with student:', {
            lessonId: lesson.id,
            studentId: lesson.student_id,
            studentEmail: studentData?.email,
            studentName: studentName,
            rawMetaData: studentData?.raw_user_meta_data
        });
        
        return `
            <div class="lesson-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span class="text-green-600 font-semibold">
                                ${studentName.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${studentName}</h3>
                            <p class="text-sm text-gray-500">
                                ${studentEmail} • ${lesson.lesson_type || 'Conversation Practice'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${getStatusBadge(lesson.status)}
                        ${isPast && lesson.status === 'confirmed' ? 
                            '<span class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Needs Review</span>' : ''
                        }
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="text-sm text-gray-600 mb-1">Date</div>
                        <div class="font-semibold text-gray-900">
                            ${formatLessonDate(lesson.lesson_date)}
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="text-sm text-gray-600 mb-1">Time</div>
                        <div class="font-semibold text-gray-900">
                            ${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="text-sm text-gray-600 mb-1">Duration</div>
                        <div class="font-semibold text-gray-900">1 hour</div>
                    </div>
                </div>

                ${lesson.notes ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div class="text-sm text-blue-800 font-medium mb-1">Lesson Notes:</div>
                        <div class="text-blue-700">${lesson.notes}</div>
                    </div>
                ` : ''}

                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                        Created ${formatDate(lesson.created_at)}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="viewLessonDetails('${lesson.id}')" 
                                class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            View Details
                        </button>
                        ${lesson.status === 'confirmed' && isPast ? `
                            <button onclick="markLessonComplete('${lesson.id}')" 
                                    class="text-green-600 hover:text-green-700 text-sm font-medium">
                                Mark Complete
                            </button>
                        ` : ''}
                        ${lesson.status === 'confirmed' && !isPast ? `
                            <button onclick="cancelLesson('${lesson.id}')" 
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
        pending: '<span class="status-pending text-xs px-2 py-1 rounded-full">Pending</span>',
        confirmed: '<span class="status-confirmed text-xs px-2 py-1 rounded-full">Confirmed</span>',
        completed: '<span class="status-completed text-xs px-2 py-1 rounded-full">Completed</span>',
        cancelled: '<span class="status-cancelled text-xs px-2 py-1 rounded-full">Cancelled</span>'
    };
    return badges[status] || badges.pending;
}

// Check if lesson is in the past
function isPastLesson(date, time) {
    const lessonDateTime = new Date(date + 'T' + time);
    return lessonDateTime < new Date();
}

// Mark lesson as complete
async function markLessonComplete(lessonId) {
    if (!confirm('Mark this lesson as completed?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('lessons')
            .update({ status: 'completed' })
            .eq('id', lessonId);

        if (error) {
            throw error;
        }

        showSuccessMessage('Lesson marked as completed!');
        await loadTutorLessons();
    } catch (error) {
        console.error('Error marking lesson complete:', error);
        showErrorMessage('Failed to update lesson status.');
    }
}

// Mark all today's lessons as complete
async function markTodayComplete() {
    const today = new Date().toISOString().split('T')[0];
    const todayLessons = lessons.filter(lesson => 
        lesson.lesson_date === today && 
        lesson.status === 'confirmed' &&
        isPastLesson(lesson.lesson_date, lesson.start_time)
    );

    if (todayLessons.length === 0) {
        showErrorMessage('No completed lessons found for today.');
        return;
    }

    if (!confirm(`Mark ${todayLessons.length} lesson(s) as completed?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('lessons')
            .update({ status: 'completed' })
            .eq('lesson_date', today)
            .eq('tutor_id', currentUser.id)
            .eq('status', 'confirmed');

        if (error) {
            throw error;
        }

        showSuccessMessage(`${todayLessons.length} lesson(s) marked as completed!`);
        await loadTutorLessons();
    } catch (error) {
        console.error('Error marking lessons complete:', error);
        showErrorMessage('Failed to update lesson statuses.');
    }
}

// Cancel lesson
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
        await loadTutorLessons();
    } catch (error) {
        console.error('Error cancelling lesson:', error);
        showErrorMessage('Failed to cancel lesson.');
    }
}

// View lesson details in modal
function viewLessonDetails(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const studentData = lesson.student;
    const studentName = studentData?.raw_user_meta_data?.name ||
                       studentData?.raw_user_meta_data?.full_name ||
                       studentData?.email?.split('@')[0] ||
                       'Student';

    const modalContent = document.getElementById('lessonModalContent');

    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-sm font-medium text-gray-600">Student</label>
                    <p class="text-gray-900">${studentName}</p>
                    <p class="text-sm text-gray-500">${lesson.student?.email || 'Unknown'}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Status</label>
                    <div class="mt-1">${getStatusBadge(lesson.status)}</div>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Date</label>
                    <p class="text-gray-900">${formatLessonDate(lesson.lesson_date)}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Time</label>
                    <p class="text-gray-900">${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Type</label>
                    <p class="text-gray-900">${lesson.lesson_type || 'Conversation Practice'}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Duration</label>
                    <p class="text-gray-900">1 hour</p>
                </div>
            </div>
            
            ${lesson.notes ? `
                <div>
                    <label class="text-sm font-medium text-gray-600">Notes</label>
                    <p class="text-gray-900 mt-1">${lesson.notes}</p>
                </div>
            ` : ''}
            
            ${lesson.google_meet_link ? `
                <div>
                    <label class="text-sm font-medium text-gray-600">Meeting Link</label>
                    <a href="${lesson.google_meet_link}" target="_blank" 
                       class="text-indigo-600 hover:text-indigo-700 mt-1 block">
                        Join Google Meet
                    </a>
                </div>
            ` : ''}
            
            <div class="flex space-x-3 pt-4">
                ${lesson.status === 'confirmed' && isPastLesson(lesson.lesson_date, lesson.start_time) ? `
                    <button onclick="markLessonComplete('${lesson.id}'); closeLessonModal();" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        Mark Complete
                    </button>
                ` : ''}
                ${lesson.status === 'confirmed' && !isPastLesson(lesson.lesson_date, lesson.start_time) ? `
                    <button onclick="cancelLesson('${lesson.id}'); closeLessonModal();" 
                            class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                        Cancel Lesson
                    </button>
                ` : ''}
            </div>
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
    await loadTutorLessons();
    showSuccessMessage('Lessons refreshed!');
}

// Navigation functions
function goBackToTutorDashboard() {
    window.location.href = 'tutor-dashboard.html';
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
