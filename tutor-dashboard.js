// Tutor Dashboard JavaScript
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase = null;
let currentUser = null;
let tutorData = null;

// Initialize when page loads
window.addEventListener('load', function() {
    initializeSupabase();
});

function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        
        // Check authentication and tutor status
        checkAuthenticationAndTutorStatus();
        
        // Initialize UI components
        initializeDropdown();
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            if (event === 'SIGNED_OUT' || !session) {
                window.location.href = 'index.html';
            } else if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                checkAuthenticationAndTutorStatus();
            }
        });
    } else {
        console.error('Supabase library not loaded');
        setTimeout(initializeSupabase, 1000);
    }
}

async function checkAuthenticationAndTutorStatus() {
    if (!supabase) return;

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Auth check error:', error);
        window.location.href = 'index.html';
        return;
    }

    if (!session) {
        console.log('No active session, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    currentUser = session.user;
    console.log('User authenticated:', session.user.email);
    
    // Check if user is an approved tutor
    await checkTutorStatus();
}

async function checkTutorStatus() {
    try {
        console.log('Checking tutor status for user:', currentUser.id);

        // Try different possible column names for user reference
        let tutorDataResult = null;
        let error = null;

        // First try with user_id column
        const { data: userData, error: userError } = await supabase
            .from('tutors')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
            console.log('user_id column not found, trying id column...');

            // Try with id column (direct auth.users reference)
            const { data: idData, error: idError } = await supabase
                .from('tutors')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (idError && idError.code !== 'PGRST116') {
                console.log('id column failed, trying email match...');

                // Try with email match as fallback
                const { data: emailData, error: emailError } = await supabase
                    .from('tutors')
                    .select('*')
                    .eq('email', currentUser.email)
                    .maybeSingle();

                tutorDataResult = emailData;
                error = emailError;
            } else {
                tutorDataResult = idData;
                error = idError;
            }
        } else {
            tutorDataResult = userData;
            error = userError;
        }

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking tutor status:', error);
            // Don't redirect immediately, allow graceful fallback
            console.log('Tutor data not found, user may not be a tutor yet');
            tutorData = null;
            loadDashboardData(); // Load with limited data
            return;
        }

        if (!tutorDataResult) {
            console.log('No tutor record found for user');
            // Don't redirect immediately, show limited dashboard
            tutorData = null;
            loadDashboardData(); // Load with limited data
            return;
        }

        // Check if tutor is approved (if approved column exists)
        if (tutorDataResult.hasOwnProperty('approved') && !tutorDataResult.approved) {
            console.log('Tutor not approved yet');
            alert('Your tutor application is pending approval. Please wait for admin approval.');
            window.location.href = 'home.html';
            return;
        }

        tutorData = tutorDataResult;
        console.log('Tutor data loaded successfully:', tutorData);

        // Load dashboard data
        loadDashboardData();

        // Setup real-time subscriptions only if we have tutor data
        if (tutorData) {
            setupRealTimeSubscriptions();
        }

    } catch (error) {
        console.error('Error in checkTutorStatus:', error);
        // Don't redirect on error, show limited dashboard
        console.log('Loading dashboard with limited functionality due to error');
        tutorData = null;
        loadDashboardData();
    }
}

// Global variables for subscription management
let activeSubscriptions = [];

// Setup real-time subscriptions for lesson updates
function setupRealTimeSubscriptions() {
    if (!supabase || !currentUser) return;

    // Clean up any existing subscriptions first
    cleanupSubscriptions();

    try {
        // Subscribe to lesson_requests changes (only if table exists)
        const lessonRequestsSubscription = supabase
            .channel(`lesson_requests_${currentUser.id}_${Date.now()}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lesson_requests',
                    filter: `tutor_id=eq.${currentUser.id}`
                },
                (payload) => {
                    console.log('📡 Lesson request change detected:', payload);
                    // Refresh stats when lesson requests change
                    loadLessonStats();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Lesson requests subscription active');
                } else if (status === 'CHANNEL_ERROR') {
                    console.log('⚠️ Lesson requests subscription failed - table may not exist');
                }
            });

        activeSubscriptions.push(lessonRequestsSubscription);

        // Subscribe to lessons changes (only if table exists)
        const lessonsSubscription = supabase
            .channel(`lessons_${currentUser.id}_${Date.now()}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lessons',
                    filter: `tutor_id=eq.${currentUser.id}`
                },
                (payload) => {
                    console.log('📡 Lesson change detected:', payload);
                    // Refresh stats when lessons change
                    loadLessonStats();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Lessons subscription active');
                } else if (status === 'CHANNEL_ERROR') {
                    console.log('⚠️ Lessons subscription failed - table may not exist');
                }
            });

        activeSubscriptions.push(lessonsSubscription);

        console.log('✅ Real-time subscriptions setup complete');

    } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
        console.log('Continuing without real-time updates...');
    }
}

// Clean up subscriptions
function cleanupSubscriptions() {
    if (activeSubscriptions.length > 0) {
        console.log('🧹 Cleaning up existing subscriptions...');
        activeSubscriptions.forEach(subscription => {
            try {
                supabase.removeChannel(subscription);
            } catch (error) {
                console.log('Error removing subscription:', error);
            }
        });
        activeSubscriptions = [];
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanupSubscriptions);

function loadDashboardData() {
    // Update user profile info
    updateUserProfile();
    
    // Update teacher info
    updateTeacherInfo();
    
    // Load stats (placeholder data for now)
    updateStats();
    
    // Load earnings (placeholder data for now)
    updateEarnings();
}

function updateUserProfile() {
    // Handle case where tutorData might be null
    const userName = (tutorData && tutorData.name) || currentUser.email.split('@')[0];
    const userEmail = (tutorData && tutorData.email) || currentUser.email;
    const avatarUrl = (tutorData && tutorData.photo_url) || currentUser.user_metadata?.avatar_url;

    // Update profile elements
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const dropdownAvatar = document.getElementById('dropdownAvatar');

    if (profileName) profileName.textContent = userName;
    if (dropdownName) dropdownName.textContent = userName;
    if (dropdownEmail) dropdownEmail.textContent = userEmail;

    // Update avatars
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=40`;
    const avatarToUse = avatarUrl || defaultAvatar;

    if (profileAvatar) {
        profileAvatar.src = avatarToUse;
        profileAvatar.alt = userName;
    }
    if (dropdownAvatar) {
        dropdownAvatar.src = avatarToUse;
        dropdownAvatar.alt = userName;
    }
}

function updateTeacherInfo() {
    const teacherName = document.getElementById('teacherName');
    const teacherLanguages = document.getElementById('teacherLanguages');
    const teacherId = document.getElementById('teacherId');
    const teacherAvatar = document.getElementById('teacherAvatar');

    // Handle case where tutorData might be null
    if (tutorData) {
        if (teacherName) teacherName.textContent = tutorData.name || 'Teacher';
        if (teacherLanguages) teacherLanguages.textContent = `${tutorData.language || 'Language'} Teacher`;
        if (teacherId) teacherId.textContent = `ID: ${tutorData.id || 'N/A'}`;

        if (teacherAvatar) {
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorData.name || 'Teacher')}&background=6366f1&color=fff&size=80`;
            teacherAvatar.src = tutorData.photo_url || defaultAvatar;
            teacherAvatar.alt = tutorData.name || 'Teacher';
        }
    } else {
        // Fallback when no tutor data is available
        const userName = currentUser.email.split('@')[0];
        if (teacherName) teacherName.textContent = userName;
        if (teacherLanguages) teacherLanguages.textContent = 'Pending Approval';
        if (teacherId) teacherId.textContent = 'ID: Pending';

        if (teacherAvatar) {
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=80`;
            teacherAvatar.src = defaultAvatar;
            teacherAvatar.alt = userName;
        }
    }
}

async function updateStats() {
    try {
        // Load real lesson data from database
        await loadLessonStats();
    } catch (error) {
        console.error('Error updating stats:', error);
        // Fallback to placeholder stats
        const upcomingLessons = document.getElementById('upcomingLessons');
        const actionRequired = document.getElementById('actionRequired');
        const packageAction = document.getElementById('packageAction');

        if (upcomingLessons) upcomingLessons.textContent = '0';
        if (actionRequired) actionRequired.textContent = '0';
        if (packageAction) packageAction.textContent = '0';
    }
}

// Load lesson statistics from database
async function loadLessonStats() {
    console.log('🔍 [STATS] Starting loadLessonStats...');
    console.log('🔍 [STATS] Current user:', currentUser?.id);
    console.log('🔍 [STATS] Supabase available:', !!supabase);

    if (!currentUser || !supabase) {
        console.error('❌ [STATS] Missing currentUser or supabase');
        return;
    }

    try {
        console.log('📊 [STATS] Querying lesson_requests table...');
        console.log('📊 [STATS] Query parameters:', {
            table: 'lesson_requests',
            tutor_id: currentUser.id,
            status: 'pending'
        });

        // Load pending lesson requests (Action Required)
        const { data: pendingRequests, error: pendingError } = await supabase
            .from('lesson_requests')
            .select('id, tutor_id, student_id, status, created_at')
            .eq('tutor_id', currentUser.id)
            .eq('status', 'pending');

        console.log('📊 [STATS] Pending requests query result:', {
            data: pendingRequests,
            error: pendingError,
            count: pendingRequests?.length || 0
        });

        if (pendingError) {
            console.error('❌ [STATS] Error loading pending requests:', {
                message: pendingError.message,
                details: pendingError.details,
                hint: pendingError.hint,
                code: pendingError.code
            });

            if (pendingError.message.includes('relation "lesson_requests" does not exist')) {
                console.error('🚨 [STATS] CRITICAL: lesson_requests table does not exist!');
                console.error('🚨 [STATS] This explains why no lesson requests are showing up.');
                console.error('🚨 [STATS] Please create the lesson_requests table using the provided SQL script.');

                // Show error message to user
                const actionRequiredElement = document.getElementById('actionRequired');
                if (actionRequiredElement) {
                    actionRequiredElement.textContent = '!';
                    actionRequiredElement.title = 'Database setup incomplete - lesson_requests table missing';
                    actionRequiredElement.style.color = 'red';
                }
            }
        }

        console.log('📅 [STATS] Querying lessons table...');
        // Load upcoming confirmed lessons
        const today = new Date().toISOString().split('T')[0];
        console.log('📅 [STATS] Today date:', today);

        const { data: upcomingLessons, error: upcomingError } = await supabase
            .from('lessons')
            .select('id, tutor_id, student_id, status, lesson_date')
            .eq('tutor_id', currentUser.id)
            .eq('status', 'confirmed')
            .gte('lesson_date', today);

        console.log('📅 [STATS] Upcoming lessons query result:', {
            data: upcomingLessons,
            error: upcomingError,
            count: upcomingLessons?.length || 0
        });

        if (upcomingError) {
            console.error('❌ [STATS] Error loading upcoming lessons:', {
                message: upcomingError.message,
                details: upcomingError.details,
                hint: upcomingError.hint,
                code: upcomingError.code
            });
        }

        // Update UI with real counts
        const pendingCount = pendingRequests ? pendingRequests.length : 0;
        const upcomingCount = upcomingLessons ? upcomingLessons.length : 0;

        console.log('📈 [STATS] Final counts:', { pendingCount, upcomingCount });

        console.log('🎯 [STATS] Updating UI elements...');
        const actionRequiredElement = document.getElementById('actionRequired');
        const upcomingLessonsElement = document.getElementById('upcomingLessons');
        const packageActionElement = document.getElementById('packageAction');

        console.log('🎯 [STATS] UI elements found:', {
            actionRequired: !!actionRequiredElement,
            upcomingLessons: !!upcomingLessonsElement,
            packageAction: !!packageActionElement
        });

        if (actionRequiredElement) {
            console.log('🎯 [STATS] Setting action required count to:', pendingCount);
            actionRequiredElement.textContent = pendingCount;

            // Add notification styling if there are pending requests
            const actionRequiredCard = document.getElementById('actionRequiredCard');
            console.log('🎯 [STATS] Action required card found:', !!actionRequiredCard);

            if (pendingCount > 0) {
                console.log('🔔 [STATS] Adding notification styling for pending requests');
                if (actionRequiredCard) {
                    actionRequiredCard.classList.add('has-notification');
                }
            } else {
                console.log('🔕 [STATS] Removing notification styling (no pending requests)');
                if (actionRequiredCard) {
                    actionRequiredCard.classList.remove('has-notification');
                }
            }
        } else {
            console.error('❌ [STATS] actionRequired element not found!');
        }

        if (upcomingLessonsElement) {
            console.log('🎯 [STATS] Setting upcoming lessons count to:', upcomingCount);
            upcomingLessonsElement.textContent = upcomingCount;
        } else {
            console.error('❌ [STATS] upcomingLessons element not found!');
        }

        if (packageActionElement) {
            packageActionElement.textContent = '0'; // Placeholder for now
        }

        console.log('✅ [STATS] Lesson stats updated successfully:', { pendingCount, upcomingCount });

    } catch (error) {
        console.error('Error in loadLessonStats:', error);
    }
}

function updateEarnings() {
    // Placeholder earnings - in a real app, these would come from the database
    const totalBalance = document.getElementById('totalBalance');
    const mayEarnings = document.getElementById('mayEarnings');
    const mayReward = document.getElementById('mayReward');

    if (totalBalance) totalBalance.textContent = '₹ 0.00';
    if (mayEarnings) mayEarnings.textContent = '₹ 0.00';
    if (mayReward) mayReward.textContent = '₹ 0.00';
}

// Profile dropdown functionality
function initializeDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });

        // Close dropdown when clicking on links
        const dropdownLinks = dropdownMenu.querySelectorAll('a, button');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function() {
                dropdownMenu.classList.remove('show');
            });
        });
    }
}

// Logout functionality
async function logout() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        showErrorMessage('Logout failed: ' + error.message);
    } else {
        console.log('User logged out successfully');
        window.location.href = 'index.html';
    }
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Inter, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 5000);
}

// Make functions globally available
window.logout = logout;
window.handleLogout = logout;
