// Import auth service
import './authService.js';

// Google Sign-In Configuration
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your actual Google Client ID

// Initialize Google Sign-In when the page loads
window.addEventListener('load', function() {
    initializeGoogleSignIn();
});

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });
    } else {
        console.warn('Google Sign-In library not loaded');
    }
}

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    console.log('Google Sign-In successful');
    console.log('JWT Token:', response.credential);

    // Close the modal first
    closeLoginModal();

    // Decode the JWT token to get user information
    const userInfo = parseJwt(response.credential);
    console.log('User Info:', userInfo);

    // Show success message
    showNotification('Successfully signed in with Google!', 'success');

    // Here you would typically:
    // 1. Send the token to your backend for verification
    // 2. Create a user session
    // 3. Redirect to the dashboard or next step

    // For demo purposes, we'll just show user info
    displayUserInfo(userInfo);
}

// Parse JWT token to extract user information
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT token:', error);
        return null;
    }
}

// Modal Functions
window.openLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Focus management for accessibility
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.focus();
        }
    }
};

window.closeLoginModal = function(event) {
    // If event is provided and it's not a click on the overlay, don't close
    if (event && event.target !== event.currentTarget) {
        return;
    }

    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
};

// Handle Google login button click
window.handleGoogleLogin = async function() {
    // Use Supabase auth service if available
    if (window.authService) {
        await window.authService.signInWithGoogle();
        return;
    }

    // Fallback to direct Google Sign-In (for demo purposes)
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback: show the One Tap dialog
                google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
                    {
                        theme: 'outline',
                        size: 'large',
                        width: 250,
                        text: 'signin_with'
                    }
                );
            }
        });
    } else {
        // Fallback for when Google Sign-In is not available
        showNotification('Google Sign-In is not available. Please try again later.', 'error');
        console.error('Google Sign-In library not loaded');
    }
};

// Display user information after successful login
function displayUserInfo(userInfo) {
    if (!userInfo) return;
    
    const userDisplay = document.createElement('div');
    userDisplay.className = 'user-info-display';
    userDisplay.innerHTML = `
        <div class="user-card">
            <img src="${userInfo.picture}" alt="Profile" class="user-avatar">
            <div class="user-details">
                <h3>Welcome, ${userInfo.name}!</h3>
                <p>${userInfo.email}</p>
                <button onclick="signOut()" class="sign-out-btn">Sign Out</button>
            </div>
        </div>
    `;
    
    // Replace the CTA button with user info
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.parentNode.replaceChild(userDisplay, ctaButton);
    }
}

// Sign out function
async function signOut() {
    // Use Supabase auth service if available
    if (window.authService) {
        await window.authService.signOut();
        return;
    }

    // Fallback for direct Google Sign-In
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }

    // Reset UI
    resetUserInterface();
    showNotification('Successfully signed out', 'success');
}

// Reset user interface to signed-out state
function resetUserInterface() {
    const userDisplay = document.querySelector('.user-info-display');
    if (userDisplay) {
        const newCtaButton = document.createElement('button');
        newCtaButton.className = 'cta-button';
        newCtaButton.onclick = window.openLoginModal;
        newCtaButton.innerHTML = `
            <span class="google-icon">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            </span>
            Start Now with Google
        `;
        userDisplay.parentNode.replaceChild(newCtaButton, userDisplay);
    }
}

// Show notification messages
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
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
            
            .notification-success {
                background: linear-gradient(135deg, #38B000 0%, #2E8B00 100%);
            }

            .notification-error {
                background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
            }

            .notification-info {
                background: linear-gradient(135deg, #00C2B3 0%, #00A89B 100%);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .user-info-display {
                display: flex;
                justify-content: center;
                margin-top: 2rem;
            }
            
            .user-card {
                background: white;
                border-radius: 16px;
                padding: 2rem;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                display: flex;
                align-items: center;
                gap: 1rem;
                max-width: 400px;
            }
            
            .user-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .user-details h3 {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
            }
            
            .user-details p {
                margin: 0 0 1rem 0;
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .sign-out-btn {
                background: #ef4444;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.875rem;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .sign-out-btn:hover {
                background: #dc2626;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Language pill click handlers
document.addEventListener('DOMContentLoaded', function() {
    const languagePills = document.querySelectorAll('.language-pill');
    
    languagePills.forEach(pill => {
        pill.addEventListener('click', function() {
            const languageName = this.querySelector('.language-name').textContent;
            showNotification(`Exploring ${languageName} tutors...`, 'info');
            
            // Here you would typically navigate to the tutors page for that language
            console.log(`User clicked on ${languageName}`);
        });
    });
});

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add some interactive animations
document.addEventListener('DOMContentLoaded', function() {
    // Animate hero elements on load
    const heroTitle = document.querySelector('.hero-title');
    const heroFeatures = document.querySelector('.hero-features');
    const ctaButton = document.querySelector('.cta-button');

    if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(30px)';

        setTimeout(() => {
            heroTitle.style.transition = 'all 0.8s ease-out';
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 200);
    }

    if (heroFeatures) {
        heroFeatures.style.opacity = '0';
        heroFeatures.style.transform = 'translateY(30px)';

        setTimeout(() => {
            heroFeatures.style.transition = 'all 0.8s ease-out';
            heroFeatures.style.opacity = '1';
            heroFeatures.style.transform = 'translateY(0)';
        }, 400);
    }

    if (ctaButton) {
        ctaButton.style.opacity = '0';
        ctaButton.style.transform = 'translateY(30px)';

        setTimeout(() => {
            ctaButton.style.transition = 'all 0.8s ease-out';
            ctaButton.style.opacity = '1';
            ctaButton.style.transform = 'translateY(0)';
        }, 600);
    }
});

// Modal keyboard accessibility
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('loginModal');

    if (modal && modal.classList.contains('active')) {
        // Close modal on Escape key
        if (event.key === 'Escape') {
            closeLoginModal();
        }

        // Trap focus within modal
        if (event.key === 'Tab') {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }
});

// Check if user is already logged in (for landing page)
async function checkAuthStatus() {
    // Only run on landing page
    const currentPath = window.location.pathname
    const basePath = import.meta.env.BASE_URL || '/'

    if (currentPath !== basePath && currentPath !== basePath + 'index.html') {
        return
    }

    if (window.authService) {
        const { session } = await window.authService.auth.getSession()

        if (session) {
            // User is already logged in, redirect to home
            window.location.href = basePath + 'home.html'
        }
    }
}

// Initialize auth check for landing page
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for auth service to load
    setTimeout(checkAuthStatus, 500)
});
