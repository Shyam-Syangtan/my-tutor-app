// Enhanced Authentication Handler with Role-Based Redirection
class AuthHandler {
    constructor() {
        this.supabase = window.supabase.createClient(
            'https://qbyyutebrgpxngvwenkd.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY'
        );
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        // Check current session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            await this.loadUserProfile();
        }

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                await this.loadUserProfile();
                await this.handleRoleBasedRedirect();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.userProfile = null;
                window.location.href = 'index.html';
            }
        });
    }

    async signInWithGoogle(role = 'student') {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/home.html',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    // Store role in user metadata
                    data: {
                        role: role
                    }
                }
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error signing in:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error signing out:', error);
            return { success: false, error: error.message };
        }
    }

    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            if (!data) {
                // Create profile if it doesn't exist
                await this.createUserProfile();
            } else {
                this.userProfile = data;
            }

            return this.userProfile;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }

    async createUserProfile(role = 'student') {
        if (!this.currentUser) return null;

        try {
            const profileData = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentUser.user_metadata?.full_name || this.currentUser.email,
                role: this.currentUser.user_metadata?.role || role,
                profile_picture: this.currentUser.user_metadata?.avatar_url || null
            };

            const { data, error } = await this.supabase
                .from('students')
                .insert([profileData])
                .select()
                .single();

            if (error) throw error;

            this.userProfile = data;
            return data;
        } catch (error) {
            console.error('Error creating user profile:', error);
            return null;
        }
    }

    async updateUserRole(role) {
        if (!this.currentUser || !this.userProfile) return null;

        try {
            const { data, error } = await this.supabase
                .from('students')
                .update({ role: role, updated_at: new Date().toISOString() })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            this.userProfile = data;
            return data;
        } catch (error) {
            console.error('Error updating user role:', error);
            return null;
        }
    }

    async handleRoleBasedRedirect() {
        if (!this.userProfile) {
            await this.loadUserProfile();
        }

        if (!this.userProfile) {
            console.error('No user profile found');
            return;
        }

        const currentPage = window.location.pathname.split('/').pop();
        
        // Don't redirect if already on the correct page
        if (this.userProfile.role === 'tutor' && currentPage === 'tutor-dashboard.html') return;
        if (this.userProfile.role === 'student' && currentPage === 'student-dashboard.html') return;

        // Redirect based on role
        if (this.userProfile.role === 'tutor') {
            window.location.href = 'tutor-dashboard.html';
        } else if (this.userProfile.role === 'student') {
            window.location.href = 'student-dashboard.html';
        } else {
            // Default to student dashboard
            window.location.href = 'student-dashboard.html';
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isTutor() {
        return this.userProfile?.role === 'tutor';
    }

    isStudent() {
        return this.userProfile?.role === 'student';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserProfile() {
        return this.userProfile;
    }

    // Utility method to require authentication
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Utility method to require specific role
    requireRole(role) {
        if (!this.requireAuth()) return false;
        
        if (this.userProfile?.role !== role) {
            this.handleRoleBasedRedirect();
            return false;
        }
        return true;
    }
}

// Create global auth handler instance
window.authHandler = new AuthHandler();
