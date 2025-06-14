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

// Setup real-time subscriptions for lesson updates with throttling
function setupRealTimeSubscriptions() {
    if (!supabase || !currentUser) return;

    // Clean up any existing subscriptions first
    cleanupSubscriptions();

    // Throttle updates to prevent flickering
    let updateTimeout = null;
    const throttledUpdate = () => {
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(() => {
            console.log('🔄 [THROTTLED] Updating stats after real-time change');
            loadLessonStats();
        }, 1000); // Wait 1 second before updating
    };

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
                    console.log('📡 [THROTTLED] Lesson request change detected:', payload.eventType);
                    // Use throttled update to prevent flickering
                    throttledUpdate();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Lesson requests subscription active (throttled)');
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
                    console.log('📡 [THROTTLED] Lesson change detected:', payload.eventType);
                    // Use throttled update to prevent flickering
                    throttledUpdate();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Lessons subscription active (throttled)');
                } else if (status === 'CHANNEL_ERROR') {
                    console.log('⚠️ Lessons subscription failed - table may not exist');
                }
            });

        activeSubscriptions.push(lessonsSubscription);

        console.log('✅ Real-time subscriptions setup complete with throttling');

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

    // Load unread message count
    loadUnreadMessageCount();

    // Setup real-time unread count updates
    setupUnreadCountSubscription();
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

// Load lesson statistics from database with caching to prevent flickering
let lastStatsUpdate = 0;
let cachedStats = { pendingCount: 0, upcomingCount: 0 };

async function loadLessonStats() {
    console.log('🔍 [STATS] Starting loadLessonStats...');

    // Prevent excessive updates (max once per 2 seconds)
    const now = Date.now();
    if (now - lastStatsUpdate < 2000) {
        console.log('🔄 [STATS] Skipping update - too recent (preventing flicker)');
        return;
    }

    if (!currentUser || !supabase) {
        console.error('❌ [STATS] Missing currentUser or supabase');
        return;
    }

    // Initialize with cached values
    let pendingCount = cachedStats.pendingCount;
    let upcomingCount = cachedStats.upcomingCount;

    try {
        console.log('📊 [STATS] Querying lesson_requests table...');

        // Load pending lesson requests (Action Required) with error handling
        try {
            const { data: pendingRequests, error: pendingError } = await supabase
                .from('lesson_requests')
                .select('id, tutor_id, student_id, status, created_at')
                .eq('tutor_id', currentUser.id)
                .eq('status', 'pending');

            if (pendingError) {
                console.warn('⚠️ [STATS] Error loading pending requests:', pendingError.message);
                // Keep cached value on error
            } else {
                pendingCount = pendingRequests ? pendingRequests.length : 0;
                console.log('📊 [STATS] Pending requests loaded:', pendingCount);
            }
        } catch (error) {
            console.warn('⚠️ [STATS] Exception loading pending requests:', error.message);
        }

        // Load upcoming confirmed lessons with error handling
        console.log('📅 [STATS] Querying lessons table...');
        const today = new Date().toISOString().split('T')[0];

        try {
            const { data: upcomingLessons, error: upcomingError } = await supabase
                .from('lessons')
                .select('id, tutor_id, student_id, status, lesson_date')
                .eq('tutor_id', currentUser.id)
                .eq('status', 'confirmed')
                .gte('lesson_date', today);

            if (upcomingError) {
                console.warn('⚠️ [STATS] Error loading upcoming lessons:', upcomingError.message);
                // Keep cached value on error
            } else {
                upcomingCount = upcomingLessons ? upcomingLessons.length : 0;
                console.log('📅 [STATS] Upcoming lessons loaded:', upcomingCount);
            }
        } catch (error) {
            console.warn('⚠️ [STATS] Exception loading upcoming lessons:', error.message);
        }

        // Only update UI if values actually changed
        const hasChanged = pendingCount !== cachedStats.pendingCount || upcomingCount !== cachedStats.upcomingCount;

        if (hasChanged) {
            console.log('📈 [STATS] Values changed, updating UI:', {
                old: cachedStats,
                new: { pendingCount, upcomingCount }
            });

            // Update cached values
            cachedStats = { pendingCount, upcomingCount };
            lastStatsUpdate = now;

            // Update UI elements with error handling
            try {
                const actionRequiredElement = document.getElementById('actionRequired');
                const upcomingLessonsElement = document.getElementById('upcomingLessons');
                const packageActionElement = document.getElementById('packageAction');

                if (actionRequiredElement) {
                    actionRequiredElement.textContent = pendingCount;
                    console.log('🎯 [STATS] Action required count set to:', pendingCount);

                    // Add notification styling if there are pending requests
                    const actionRequiredCard = document.getElementById('actionRequiredCard');
                    if (actionRequiredCard) {
                        if (pendingCount > 0) {
                            actionRequiredCard.classList.add('has-notification');
                            console.log('🔔 [STATS] Added notification styling');
                        } else {
                            actionRequiredCard.classList.remove('has-notification');
                            console.log('🔕 [STATS] Removed notification styling');
                        }
                    }
                }

                if (upcomingLessonsElement) {
                    upcomingLessonsElement.textContent = upcomingCount;
                    console.log('🎯 [STATS] Upcoming lessons count set to:', upcomingCount);
                }

                if (packageActionElement) {
                    packageActionElement.textContent = '0'; // Placeholder
                }

                console.log('✅ [STATS] UI updated successfully');
            } catch (uiError) {
                console.error('❌ [STATS] Error updating UI:', uiError.message);
            }
        } else {
            console.log('📊 [STATS] No changes detected, skipping UI update');
        }

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

async function loadUnreadMessageCount() {
    try {
        if (!currentUser || !supabase) return;

        const { data, error } = await supabase
            .rpc('messaging_get_unread_count', { user_uuid: currentUser.id });

        if (error) {
            console.warn('Could not load unread message count:', error.message);
            return;
        }

        const unreadCount = data || 0;
        updateUnreadBadges(unreadCount);
    } catch (error) {
        console.warn('Error loading unread message count:', error);
    }
}

function updateUnreadBadges(unreadCount) {
    const badge = document.getElementById('tutorUnreadBadge');
    const dropdownBadge = document.getElementById('tutorUnreadBadgeDropdown');

    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    if (dropdownBadge) {
        if (unreadCount > 0) {
            dropdownBadge.textContent = unreadCount;
            dropdownBadge.classList.remove('hidden');
        } else {
            dropdownBadge.classList.add('hidden');
        }
    }
}

function setupUnreadCountSubscription() {
    try {
        if (!currentUser || !supabase) return;

        // Subscribe to unread_messages changes for this user
        const subscription = supabase
            .channel(`unread_messages_${currentUser.id}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'unread_messages',
                    filter: `user_id=eq.${currentUser.id}`
                },
                (payload) => {
                    console.log('📨 [TUTOR] Unread count changed:', payload);
                    // Reload unread count when changes occur
                    loadUnreadMessageCount();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [TUTOR] Unread count subscription active');
                } else if (status === 'CHANNEL_ERROR') {
                    console.log('⚠️ [TUTOR] Unread count subscription failed');
                }
            });

        // Add to active subscriptions for cleanup
        activeSubscriptions.push(subscription);
        console.log('✅ [TUTOR] Real-time unread count subscription setup');
    } catch (error) {
        console.warn('Error setting up unread count subscription:', error);
    }
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
