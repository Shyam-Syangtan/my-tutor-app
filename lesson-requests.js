/**
 * Lesson Requests Management System
 * Handles tutor approval/decline of student booking requests
 */

// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase;
let currentUser;
let currentFilter = 'pending';
let lessonRequests = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 [INIT] Initializing lesson requests page...');

        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ [INIT] Supabase client initialized');

        // Check authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('❌ [INIT] Session error:', sessionError);
            showErrorMessage('Authentication error. Please log in again.');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }

        if (!session) {
            console.log('❌ [INIT] No session found, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        currentUser = session.user;
        console.log('✅ [INIT] User authenticated:', currentUser.email);

        // Update user info in nav
        document.getElementById('userEmail').textContent = currentUser.email;

        // Load lesson requests
        await loadLessonRequests();

        // Setup event listeners
        setupEventListeners();

        // Hide loading state and show main content
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        console.log('✅ [INIT] Initialization complete');

    } catch (error) {
        console.error('❌ [INIT] Error initializing lesson requests:', error);
        showErrorMessage(`Failed to initialize: ${error.message}`);

        // Still show the main content but with error state
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
    }
});

// Load lesson requests from database
async function loadLessonRequests() {
    try {
        console.log('🔍 Loading lesson requests for tutor:', currentUser.id);

        // First, test if the lesson_requests table exists
        console.log('🔍 [DEBUG] Testing lesson_requests table access...');
        const { data: testData, error: testError } = await supabase
            .from('lesson_requests')
            .select('id')
            .limit(1);

        if (testError) {
            console.error('❌ [DEBUG] Table access failed:', testError);
            if (testError.message.includes('relation "lesson_requests" does not exist')) {
                showErrorMessage('The lesson_requests table does not exist. Please run the database setup first.');
                return;
            }
            if (testError.message.includes('permission denied') || testError.message.includes('RLS')) {
                showErrorMessage('Permission denied. Please check database RLS policies.');
                return;
            }
            throw testError;
        }

        console.log('✅ [DEBUG] Table access successful, loading tutor requests...');

        // Load lesson requests for this tutor
        const { data: requests, error: requestsError } = await supabase
            .from('lesson_requests')
            .select('*')
            .eq('tutor_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (requestsError) {
            console.error('❌ [DEBUG] Failed to load requests:', requestsError);
            throw requestsError;
        }

        console.log('📋 [DEBUG] Raw lesson requests loaded:', requests?.length || 0);

        // Get student information for each request using enhanced name resolution
        const requestsWithStudents = [];
        for (const request of (requests || [])) {
            try {
                let studentData = { email: 'Student', full_name: null };

                // Strategy 1: Try enhanced database function (accesses Google auth data)
                try {
                    const { data: realUserName, error: functionError } = await supabase
                        .rpc('get_real_user_name', { user_uuid: request.student_id });

                    if (!functionError && realUserName && realUserName !== 'User' && realUserName !== 'Student') {
                        studentData = {
                            email: realUserName,
                            full_name: realUserName
                        };
                        console.log('✅ [ENHANCED] Real user name resolved:', realUserName, 'for', request.student_id.substring(0, 8));
                    } else {
                        console.log('⚠️ [ENHANCED] Function returned generic name:', realUserName);
                        throw new Error('Generic name returned');
                    }
                } catch (error) {
                    console.log('⚠️ [ENHANCED] Database function failed, trying fallback...');

                    // Strategy 2: If current user is the student, use their auth data directly
                    if (currentUser && request.student_id === currentUser.id) {
                        const userName = currentUser.user_metadata?.full_name ||
                                       currentUser.user_metadata?.name ||
                                       currentUser.email?.split('@')[0] ||
                                       'You';
                        studentData = {
                            email: userName,
                            full_name: userName
                        };
                        console.log('✅ [DIRECT] Current user name resolved:', userName);
                    } else {
                        // Strategy 3: Generate meaningful name from UUID
                        const friendlyName = `Student${request.student_id.substring(0, 4)}`;
                        studentData = { email: friendlyName, full_name: friendlyName };
                        console.log('✅ [FALLBACK] Generated friendly student name:', friendlyName);
                    }
                }

                requestsWithStudents.push({
                    ...request,
                    student: studentData
                });
            } catch (studentError) {
                console.warn('Could not load student data for request:', request.id, studentError);
                const friendlyName = `Student${request.student_id.substring(0, 4)}`;
                requestsWithStudents.push({
                    ...request,
                    student: { email: friendlyName, full_name: friendlyName }
                });
            }
        }

        lessonRequests = requestsWithStudents;
        console.log('✅ [DEBUG] Processed lesson requests:', lessonRequests.length);

        // Update pending count
        const pendingCount = lessonRequests.filter(req => req.status === 'pending').length;
        document.getElementById('pendingCount').textContent = pendingCount;
        console.log('📊 [DEBUG] Pending requests count:', pendingCount);

        // Render requests
        renderLessonRequests();

    } catch (error) {
        console.error('❌ Error loading lesson requests:', error);
        showErrorMessage(`Failed to load lesson requests: ${error.message}`);

        // Show empty state
        document.getElementById('requestsContainer').innerHTML = '';
        document.getElementById('emptyState').classList.remove('hidden');
    }
}

// Render lesson requests based on current filter
function renderLessonRequests() {
    const container = document.getElementById('requestsContainer');
    const emptyState = document.getElementById('emptyState');
    
    // Filter requests based on current filter
    let filteredRequests = lessonRequests;
    if (currentFilter !== 'all') {
        filteredRequests = lessonRequests.filter(req => req.status === currentFilter);
    }

    if (filteredRequests.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    container.innerHTML = filteredRequests.map(request => `
        <div class="card request-card bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div class="card-header flex justify-between items-start mb-4">
                <div class="student-info flex items-center space-x-3">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span class="text-indigo-600 font-semibold text-sm sm:text-base">
                            ${request.student?.email ? request.student.email.substring(0, 2).toUpperCase() : 'ST'}
                        </span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900 text-sm sm:text-base">
                            ${request.student?.email || 'Student'}
                        </h3>
                        <p class="text-xs sm:text-sm text-gray-500">
                            Requested ${formatDate(request.created_at)}
                        </p>
                    </div>
                </div>
                <div class="status-badge flex items-center space-x-2">
                    ${getStatusBadge(request.status)}
                </div>
            </div>

            <div class="info-grid responsive-grid grid-1 md:grid-3 gap-3 sm:gap-4 mb-4">
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="text-xs sm:text-sm text-gray-600 mb-1">Date</div>
                    <div class="font-semibold text-gray-900 text-sm sm:text-base">
                        ${formatLessonDate(request.requested_date)}
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="text-xs sm:text-sm text-gray-600 mb-1">Time</div>
                    <div class="font-semibold text-gray-900 text-sm sm:text-base">
                        ${formatTime(request.requested_start_time)} - ${formatTime(request.requested_end_time)}
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="text-xs sm:text-sm text-gray-600 mb-1">Duration</div>
                    <div class="font-semibold text-gray-900 text-sm sm:text-base">1 hour</div>
                </div>
            </div>

            ${request.student_message ? `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div class="text-xs sm:text-sm text-blue-800 font-medium mb-1">Student Message:</div>
                    <div class="text-blue-700 text-sm sm:text-base">${request.student_message}</div>
                </div>
            ` : ''}

            ${request.tutor_response ? `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div class="text-xs sm:text-sm text-gray-600 font-medium mb-1">Your Response:</div>
                    <div class="text-gray-700 text-sm sm:text-base">${request.tutor_response}</div>
                </div>
            ` : ''}

            ${request.status === 'pending' ? `
                <div class="action-buttons flex justify-end space-x-3">
                    <button onclick="handleRequestAction('${request.id}', 'declined')"
                            class="action-btn btn btn-secondary px-3 sm:px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                        Decline
                    </button>
                    <button onclick="handleRequestAction('${request.id}', 'approved')"
                            class="action-btn btn btn-success px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base">
                        Approve
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>',
        approved: '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Approved</span>',
        declined: '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Declined</span>'
    };
    return badges[status] || badges.pending;
}

// Handle request approval/decline
async function handleRequestAction(requestId, action) {
    const request = lessonRequests.find(req => req.id === requestId);
    if (!request) return;

    const actionText = action === 'approved' ? 'approve' : 'decline';
    const modalTitle = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Lesson Request`;
    const modalMessage = `Are you sure you want to ${actionText} this lesson request for ${formatLessonDate(request.requested_date)} at ${formatTime(request.requested_start_time)}?`;

    showConfirmationModal(modalTitle, modalMessage, async () => {
        await updateRequestStatus(requestId, action);
    });
}

// Update request status in database
async function updateRequestStatus(requestId, status) {
    try {
        console.log('Updating request status:', { requestId, status });

        // First, get the current request data
        const { data: currentRequest, error: fetchError } = await supabase
            .from('lesson_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError) {
            console.error('Error fetching request:', fetchError);
            throw new Error('Failed to fetch request details');
        }

        console.log('Current request data:', currentRequest);

        // Update the request status
        const { data: updatedRequest, error: updateError } = await supabase
            .from('lesson_requests')
            .update({
                status: status,
                tutor_response: status === 'approved' ? 'Lesson request approved!' : 'Lesson request declined.',
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) {
            console.error('Update error details:', updateError);
            throw updateError;
        }

        console.log('Request updated successfully:', updatedRequest);

        // If approved, ensure lesson is created
        if (status === 'approved') {
            console.log('✅ Request approved, ensuring lesson creation...');
            showSuccessMessage(`Lesson request approved! Creating lesson...`);

            // Try to create the lesson
            try {
                // First check if lesson already exists
                const lessonExists = await checkLessonExists(currentRequest);

                if (lessonExists) {
                    console.log('✅ Lesson already exists for this request');
                    showSuccessMessage(`Lesson request approved! The lesson is already available in both dashboards.`);
                } else {
                    // Create lesson manually to ensure it exists
                    console.log('📅 Creating lesson from approved request...');
                    const lessonResult = await createLessonFromRequest(currentRequest);

                    if (lessonResult && lessonResult !== 'error') {
                        console.log('✅ Lesson created successfully:', lessonResult);
                        showSuccessMessage(`Lesson request approved and lesson created! The lesson will appear in both dashboards.`);
                    } else {
                        console.warn('⚠️ Lesson creation may have failed');
                        showErrorMessage(`Request approved but lesson creation may have failed. Please check both dashboards.`);
                    }
                }
            } catch (lessonError) {
                console.error('❌ Error in lesson creation:', lessonError);
                showErrorMessage(`Request approved but lesson creation failed: ${lessonError.message}`);
            }
        } else {
            showSuccessMessage(`Lesson request ${status} successfully!`);
        }

        // Reload requests
        await loadLessonRequests();

    } catch (error) {
        console.error('Error updating request status:', error);
        showErrorMessage('Failed to update request status. Please try again.');
    }
}

// Check if lesson exists for a request
async function checkLessonExists(request) {
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('id')
            .eq('tutor_id', request.tutor_id)
            .eq('student_id', request.student_id)
            .eq('lesson_date', request.requested_date)
            .eq('start_time', request.requested_start_time)
            .eq('end_time', request.requested_end_time)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error checking lesson existence:', error);
            return false;
        }

        return data !== null;
    } catch (error) {
        console.error('Error in checkLessonExists:', error);
        return false;
    }
}

// Create lesson record from approved request
async function createLessonFromRequest(request) {
    try {
        console.log('📅 [LESSON] Creating confirmed lesson from approved request:', {
            requestId: request.id,
            tutorId: request.tutor_id,
            studentId: request.student_id,
            date: request.requested_date,
            time: `${request.requested_start_time} - ${request.requested_end_time}`
        });

        // First try the database function approach
        try {
            console.log('🔧 [LESSON] Trying manual_create_lesson function...');
            const { data: functionResult, error: functionError } = await supabase
                .rpc('manual_create_lesson', {
                    p_tutor_id: request.tutor_id,
                    p_student_id: request.student_id,
                    p_lesson_date: request.requested_date,
                    p_start_time: request.requested_start_time,
                    p_end_time: request.requested_end_time,
                    p_notes: request.student_message || 'Lesson created from approved request'
                });

            if (functionError) {
                console.warn('🔧 [LESSON] Function failed:', functionError.message);
                if (functionError.message.includes('already exists') || functionError.message.includes('duplicate')) {
                    console.log('✅ [LESSON] Lesson already exists (from function)');
                    return 'existing';
                }
                // Don't throw here, try direct insert instead
            } else if (functionResult) {
                console.log('✅ [LESSON] Lesson created via function:', functionResult);
                return functionResult;
            }
        } catch (funcError) {
            console.warn('🔧 [LESSON] Function approach failed, trying direct insert:', funcError.message);
        }

        // Fallback to direct insert
        console.log('📝 [LESSON] Trying direct insert...');
        const { data: insertResult, error: insertError } = await supabase
            .from('lessons')
            .insert({
                tutor_id: request.tutor_id,
                student_id: request.student_id,
                lesson_date: request.requested_date,
                start_time: request.requested_start_time,
                end_time: request.requested_end_time,
                status: 'confirmed',
                lesson_type: 'conversation_practice',
                notes: request.student_message || 'Lesson created from approved request',
                price: 500.00,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('📝 [LESSON] Direct insert failed:', insertError);
            if (insertError.code === '23505') { // Unique constraint violation
                console.log('✅ [LESSON] Lesson already exists (from direct insert)');
                return 'existing';
            }
            throw insertError;
        }

        if (insertResult) {
            console.log('✅ [LESSON] Lesson created via direct insert:', insertResult.id);
            return insertResult.id;
        }

        console.warn('⚠️ [LESSON] No result from either method');
        return null;

    } catch (error) {
        console.error('❌ [LESSON] Error creating confirmed lesson:', error);
        return 'error';
    }
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
    
    // Re-render requests
    renderLessonRequests();
}

// Refresh requests
async function refreshRequests() {
    await loadLessonRequests();
    showSuccessMessage('Lesson requests refreshed!');
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

// Modal functions
function showConfirmationModal(title, message, onConfirm) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('confirmationModal').classList.remove('hidden');
    
    // Set up confirm button
    const confirmButton = document.getElementById('confirmButton');
    confirmButton.onclick = () => {
        closeConfirmationModal();
        onConfirm();
    };
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').classList.add('hidden');
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
