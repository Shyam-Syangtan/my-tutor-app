// Import auth service
import './authService.js';

// Home Page JavaScript
class HomePageManager {
    constructor() {
        this.currentUser = null
        this.studentData = null
        this.init()
    }

    async init() {
        // Wait for auth service to be available
        await this.waitForAuthService()
        
        // Check authentication status
        await this.checkAuthStatus()
        
        // Load student data
        await this.loadStudentData()
        
        // Initialize UI
        this.initializeUI()
    }

    // Wait for auth service to be loaded
    async waitForAuthService() {
        let attempts = 0
        const maxAttempts = 50
        
        while (!window.authService && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
        }
        
        if (!window.authService) {
            console.error('Auth service not available')
            this.redirectToLogin()
        }
    }

    // Check if user is authenticated
    async checkAuthStatus() {
        try {
            const { session } = await window.authService.auth.getSession()
            
            if (!session) {
                console.log('No active session, redirecting to login')
                this.redirectToLogin()
                return
            }
            
            this.currentUser = session.user
            console.log('User authenticated:', this.currentUser)
        } catch (error) {
            console.error('Error checking auth status:', error)
            this.redirectToLogin()
        }
    }

    // Load student data from database
    async loadStudentData() {
        if (!this.currentUser) return
        
        try {
            const { data, error } = await window.authService.db.getStudent(this.currentUser.id)
            
            if (error) {
                console.error('Error loading student data:', error)
                return
            }
            
            this.studentData = data
            console.log('Student data loaded:', this.studentData)
        } catch (error) {
            console.error('Error loading student data:', error)
        }
    }

    // Initialize UI components
    initializeUI() {
        this.updateProfileElements()
        this.setupEventListeners()
        this.updateWelcomeMessage()
    }

    // Update all profile-related elements
    updateProfileElements() {
        if (!this.studentData) return

        const elements = {
            profileAvatar: document.getElementById('profileAvatar'),
            profileName: document.getElementById('profileName'),
            dropdownAvatar: document.getElementById('dropdownAvatar'),
            dropdownName: document.getElementById('dropdownName'),
            dropdownEmail: document.getElementById('dropdownEmail'),
            cardAvatar: document.getElementById('cardAvatar'),
            cardName: document.getElementById('cardName'),
            welcomeName: document.getElementById('welcomeName')
        }

        // Update avatars
        const avatarUrl = this.studentData.profile_picture || '/default-avatar.png'
        if (elements.profileAvatar) elements.profileAvatar.src = avatarUrl
        if (elements.dropdownAvatar) elements.dropdownAvatar.src = avatarUrl
        if (elements.cardAvatar) elements.cardAvatar.src = avatarUrl

        // Update names
        const name = this.studentData.name || 'Student'
        if (elements.profileName) elements.profileName.textContent = name
        if (elements.dropdownName) elements.dropdownName.textContent = name
        if (elements.cardName) elements.cardName.textContent = name
        if (elements.welcomeName) elements.welcomeName.textContent = name

        // Update email
        if (elements.dropdownEmail) {
            elements.dropdownEmail.textContent = this.studentData.email || ''
        }
    }

    // Update welcome message
    updateWelcomeMessage() {
        const welcomeElement = document.getElementById('welcomeName')
        if (welcomeElement && this.studentData) {
            const firstName = this.studentData.name.split(' ')[0]
            welcomeElement.textContent = firstName
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Book lesson buttons
        const bookButtons = document.querySelectorAll('.book-btn')
        bookButtons.forEach(btn => {
            btn.addEventListener('click', this.handleBookLesson.bind(this))
        })

        // Join lesson buttons
        const joinButtons = document.querySelectorAll('.lesson-join-btn')
        joinButtons.forEach(btn => {
            btn.addEventListener('click', this.handleJoinLesson.bind(this))
        })

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-dropdown-content a, .profile-dropdown-content a')
        navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this))
        })

        // Profile dropdown toggle (for mobile)
        const profileBtn = document.getElementById('profileBtn')
        if (profileBtn) {
            profileBtn.addEventListener('click', this.toggleProfileDropdown.bind(this))
        }
    }

    // Handle book lesson
    handleBookLesson(event) {
        const teacherCard = event.target.closest('.teacher-card')
        const teacherName = teacherCard.querySelector('.teacher-name').textContent
        
        this.showNotification(`Booking lesson with ${teacherName}...`, 'info')
        
        // Here you would typically open a booking modal or navigate to booking page
        console.log('Book lesson with:', teacherName)
    }

    // Handle join lesson
    handleJoinLesson(event) {
        const lessonItem = event.target.closest('.lesson-item')
        const language = lessonItem.querySelector('.lesson-language').textContent
        const time = lessonItem.querySelector('.lesson-hour').textContent
        
        this.showNotification(`Joining ${language} lesson at ${time}...`, 'info')
        
        // Here you would typically open the lesson interface
        console.log('Join lesson:', language, time)
    }

    // Handle navigation
    handleNavigation(event) {
        event.preventDefault()
        const href = event.target.getAttribute('href')
        
        if (href && href !== '#') {
            this.showNotification(`Navigating to ${href.replace('#', '')}...`, 'info')
            console.log('Navigate to:', href)
        }
    }

    // Toggle profile dropdown (mobile)
    toggleProfileDropdown(event) {
        event.stopPropagation()
        const dropdown = event.target.closest('.profile-dropdown')
        const content = dropdown.querySelector('.profile-dropdown-content')
        
        content.style.opacity = content.style.opacity === '1' ? '0' : '1'
        content.style.visibility = content.style.visibility === 'visible' ? 'hidden' : 'visible'
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div')
        notification.className = `notification notification-${type}`
        notification.textContent = message
        
        // Add styles if not present
        if (!document.querySelector('#home-notification-styles')) {
            const styles = document.createElement('style')
            styles.id = 'home-notification-styles'
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    animation: slideIn 0.3s ease-out;
                    max-width: 300px;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                }
                
                .notification-success { background: linear-gradient(135deg, #38B000 0%, #2E8B00 100%); }
                .notification-error { background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); }
                .notification-info { background: linear-gradient(135deg, #00C2B3 0%, #00A89B 100%); }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `
            document.head.appendChild(styles)
        }
        
        document.body.appendChild(notification)
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        }, 3000)
    }

    // Redirect to login page
    redirectToLogin() {
        const basePath = import.meta.env.BASE_URL || '/'
        window.location.href = basePath + 'index.html'
    }
}

// Global logout function
async function handleLogout() {
    if (window.authService) {
        await window.authService.signOut()
    } else {
        window.location.href = '/index.html'
    }
}

// Initialize home page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomePageManager()
})

// Close dropdowns when clicking outside
document.addEventListener('click', (event) => {
    const dropdowns = document.querySelectorAll('.profile-dropdown-content')
    dropdowns.forEach(dropdown => {
        if (!dropdown.closest('.profile-dropdown').contains(event.target)) {
            dropdown.style.opacity = '0'
            dropdown.style.visibility = 'hidden'
        }
    })
})
