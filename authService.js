// Authentication Service
import { auth, db } from './supabaseClient.js'

class AuthService {
    constructor() {
        this.currentUser = null
        this.isAuthenticated = false
        this.init()
    }

    // Initialize auth service
    async init() {
        // Check for existing session
        await this.checkAuthStatus()
        
        // Listen for auth state changes
        auth.onAuthStateChange((event, session) => {
            this.handleAuthStateChange(event, session)
        })
    }

    // Handle authentication state changes
    async handleAuthStateChange(event, session) {
        switch (event) {
            case 'SIGNED_IN':
                this.currentUser = session.user
                this.isAuthenticated = true
                await this.handleSignIn(session.user)
                break
                
            case 'SIGNED_OUT':
                this.currentUser = null
                this.isAuthenticated = false
                this.handleSignOut()
                break
                
            case 'TOKEN_REFRESHED':
                console.log('Token refreshed')
                break
        }
    }

    // Handle successful sign in
    async handleSignIn(user) {
        console.log('User signed in:', user)

        // Close login modal if open
        if (typeof closeLoginModal === 'function') {
            closeLoginModal()
        }

        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification('Successfully signed in!', 'success')
        }

        // Create or update student profile
        await this.ensureStudentProfile(user)

        // Redirect to home page
        this.redirectToHome()
    }

    // Handle sign out
    handleSignOut() {
        console.log('User signed out')

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification('Successfully signed out', 'success')
        }

        // Redirect to landing page
        this.redirectToLanding()
    }

    // Redirect to landing page after logout
    redirectToLanding() {
        const currentPath = window.location.pathname
        const basePath = import.meta.env.BASE_URL || '/'

        if (currentPath !== basePath && currentPath !== basePath + 'index.html') {
            window.location.href = basePath + 'index.html'
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const { data, error } = await auth.signInWithGoogle()
            
            if (error) {
                console.error('Google sign-in failed:', error)
                if (typeof showNotification === 'function') {
                    showNotification('Sign-in failed. Please try again.', 'error')
                }
                return { success: false, error }
            }
            
            return { success: true, data }
        } catch (error) {
            console.error('Unexpected error during Google sign-in:', error)
            if (typeof showNotification === 'function') {
                showNotification('An unexpected error occurred.', 'error')
            }
            return { success: false, error }
        }
    }

    // Sign out
    async signOut() {
        try {
            const { error } = await auth.signOut()
            
            if (error) {
                console.error('Sign out failed:', error)
                if (typeof showNotification === 'function') {
                    showNotification('Error signing out', 'error')
                }
                return { success: false, error }
            }
            
            return { success: true }
        } catch (error) {
            console.error('Unexpected error during sign out:', error)
            return { success: false, error }
        }
    }

    // Check current authentication status
    async checkAuthStatus() {
        try {
            const { session, error } = await auth.getSession()
            
            if (error) {
                console.error('Error checking auth status:', error)
                return
            }
            
            if (session) {
                this.currentUser = session.user
                this.isAuthenticated = true
                this.updateUIForSignedInUser(session.user)
            }
        } catch (error) {
            console.error('Unexpected error checking auth status:', error)
        }
    }

    // Ensure student profile exists in database
    async ensureStudentProfile(user) {
        try {
            // Check if student exists
            const { exists } = await db.studentExists(user.id)

            if (!exists) {
                // Create new student profile
                const studentData = {
                    name: user.user_metadata.full_name || user.email.split('@')[0],
                    email: user.email,
                    profile_picture: user.user_metadata.avatar_url || user.user_metadata.picture
                }

                const result = await db.createStudent(user.id, studentData)
                if (result.error) {
                    console.error('Error creating student profile:', result.error)
                } else {
                    console.log('Student profile created successfully')
                }
            } else {
                // Update existing student with latest info
                const updateData = {
                    name: user.user_metadata.full_name || user.email.split('@')[0],
                    profile_picture: user.user_metadata.avatar_url || user.user_metadata.picture
                }

                await db.updateStudent(user.id, updateData)
                console.log('Student profile updated')
            }
        } catch (error) {
            console.error('Error ensuring student profile:', error)
        }
    }

    // Redirect to home page after login
    redirectToHome() {
        // Check if we're on the landing page
        const currentPath = window.location.pathname
        const basePath = import.meta.env.BASE_URL || '/'

        if (currentPath === basePath || currentPath === basePath + 'index.html') {
            window.location.href = basePath + 'home.html'
        }
    }

    // Update UI for signed-in user
    updateUIForSignedInUser(user) {
        if (typeof displayUserInfo === 'function') {
            displayUserInfo({
                name: user.user_metadata.full_name || user.email,
                email: user.email,
                picture: user.user_metadata.avatar_url
            })
        }
    }

    // Reset UI to signed-out state
    resetUI() {
        if (typeof resetUserInterface === 'function') {
            resetUserInterface()
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated
    }
}

// Create and export singleton instance
const authService = new AuthService()
export default authService

// Export for global access (for existing functions)
window.authService = authService
