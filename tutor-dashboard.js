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
        const { data: tutorDataResult, error } = await supabase
            .from('tutors')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('approved', true)
            .single();

        if (error) {
            console.error('Error checking tutor status:', error);
            // User is not an approved tutor, redirect to home
            alert('Access denied. You need to be an approved tutor to access this dashboard.');
            window.location.href = 'home.html';
            return;
        }

        if (!tutorDataResult) {
            // User is not an approved tutor
            alert('Access denied. You need to be an approved tutor to access this dashboard.');
            window.location.href = 'home.html';
            return;
        }

        tutorData = tutorDataResult;
        console.log('Tutor data loaded:', tutorData);
        
        // Load dashboard data
        loadDashboardData();

        // Setup real-time subscriptions
        setupRealTimeSubscriptions();

    } catch (error) {
        console.error('Error in checkTutorStatus:', error);
        alert('Error loading tutor data. Please try again.');
        window.location.href = 'home.html';
    }
}

// Setup real-time subscriptions for lesson updates
function setupRealTimeSubscriptions() {
    if (!supabase || !currentUser) return;

    // Subscribe to lesson_requests changes
    const lessonRequestsSubscription = supabase
        .channel('lesson_requests_changes')
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
        .subscribe();

    // Subscribe to lessons changes
    const lessonsSubscription = supabase
        .channel('lessons_changes')
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
        .subscribe();

    console.log('✅ Real-time subscriptions setup complete');
}

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
    const userName = tutorData.name || currentUser.email.split('@')[0];
    const userEmail = tutorData.email || currentUser.email;
    const avatarUrl = tutorData.photo_url || currentUser.user_metadata?.avatar_url;

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

    if (teacherName) teacherName.textContent = tutorData.name;
    if (teacherLanguages) teacherLanguages.textContent = `${tutorData.language} Teacher`;
    if (teacherId) teacherId.textContent = `ID: ${tutorData.id}`;

    if (teacherAvatar) {
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorData.name)}&background=6366f1&color=fff&size=80`;
        teacherAvatar.src = tutorData.photo_url || defaultAvatar;
        teacherAvatar.alt = tutorData.name;
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
    if (!currentUser || !supabase) return;

    try {
        // Load pending lesson requests (Action Required)
        const { data: pendingRequests, error: pendingError } = await supabase
            .from('lesson_requests')
            .select('id')
            .eq('tutor_id', currentUser.id)
            .eq('status', 'pending');

        if (pendingError) {
            console.error('Error loading pending requests:', pendingError);
        }

        // Load upcoming confirmed lessons
        const today = new Date().toISOString().split('T')[0];
        const { data: upcomingLessons, error: upcomingError } = await supabase
            .from('lessons')
            .select('id')
            .eq('tutor_id', currentUser.id)
            .eq('status', 'confirmed')
            .gte('lesson_date', today);

        if (upcomingError) {
            console.error('Error loading upcoming lessons:', upcomingError);
        }

        // Update UI with real counts
        const pendingCount = pendingRequests ? pendingRequests.length : 0;
        const upcomingCount = upcomingLessons ? upcomingLessons.length : 0;

        const actionRequiredElement = document.getElementById('actionRequired');
        const upcomingLessonsElement = document.getElementById('upcomingLessons');
        const packageActionElement = document.getElementById('packageAction');

        if (actionRequiredElement) {
            actionRequiredElement.textContent = pendingCount;
            // Add notification styling if there are pending requests
            const actionRequiredCard = document.getElementById('actionRequiredCard');
            if (pendingCount > 0) {
                if (actionRequiredCard) {
                    actionRequiredCard.classList.add('has-notification');
                }
            } else {
                if (actionRequiredCard) {
                    actionRequiredCard.classList.remove('has-notification');
                }
            }
        }

        if (upcomingLessonsElement) {
            upcomingLessonsElement.textContent = upcomingCount;
        }

        if (packageActionElement) {
            packageActionElement.textContent = '0'; // Placeholder for now
        }

        console.log('✅ Lesson stats updated:', { pendingCount, upcomingCount });

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
