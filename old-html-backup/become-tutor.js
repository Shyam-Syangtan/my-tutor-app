// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase = null;
let currentUser = null;
let selectedLanguages = [];

// Initialize when page loads
window.addEventListener('load', function() {
    initializeSupabase();
});

function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        
        // Check authentication
        checkAuthentication();
        
        // Initialize form handlers
        initializeFormHandlers();
    } else {
        console.error('Supabase library not loaded');
        setTimeout(initializeSupabase, 1000);
    }
}

async function checkAuthentication() {
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
    
    // Check if user already has a tutor application
    await checkExistingApplication();
}

async function checkExistingApplication() {
    try {
        const { data, error } = await supabase
            .from('tutors')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        if (data) {
            // User already has an application
            showExistingApplicationMessage(data);
        }
    } catch (error) {
        // No existing application found, which is fine
        console.log('No existing application found');
    }
}

function showExistingApplicationMessage(tutorData) {
    const container = document.querySelector('.become-tutor-container');
    const status = tutorData.approved ? 'approved' : 'pending review';
    const statusColor = tutorData.approved ? '#10b981' : '#f59e0b';
    
    container.innerHTML = `
        <a href="home.html" class="back-link">← Back to Home</a>
        <h1>Tutor Application Status</h1>
        <div style="background: ${statusColor}; color: white; padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
            <h3 style="margin: 0 0 0.5rem 0;">Application ${status.toUpperCase()}</h3>
            <p style="margin: 0;">
                ${tutorData.approved 
                    ? 'Congratulations! Your tutor application has been approved. You can now start teaching!'
                    : 'Your tutor application is currently under review. We\'ll notify you once it\'s approved.'
                }
            </p>
        </div>
        ${tutorData.approved ? `
            <div style="text-align: center; margin: 2rem 0;">
                <a href="tutor-dashboard.html" style="background: var(--primary-color); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Go to Tutor Dashboard
                </a>
            </div>
        ` : ''}
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4>Your Application Details:</h4>
            <p><strong>Name:</strong> ${tutorData.name}</p>
            <p><strong>Languages:</strong> ${tutorData.language}</p>
            <p><strong>Rate:</strong> ₹${tutorData.rate}/hour</p>
            <p><strong>Experience:</strong> ${tutorData.experience}</p>
            <p><strong>Submitted:</strong> ${new Date(tutorData.created_at).toLocaleDateString()}</p>
        </div>
    `;
}

function initializeFormHandlers() {
    // Language input handler
    const languageInput = document.getElementById('languageInput');
    if (languageInput) {
        languageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addLanguage();
            }
        });
    }

    // Form submission handler
    const form = document.getElementById('tutorApplicationForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }
}

function addLanguage() {
    const input = document.getElementById('languageInput');
    const language = input.value.trim();
    
    if (language && !selectedLanguages.includes(language)) {
        selectedLanguages.push(language);
        input.value = '';
        updateLanguageTags();
    }
}

function removeLanguage(language) {
    selectedLanguages = selectedLanguages.filter(lang => lang !== language);
    updateLanguageTags();
}

function updateLanguageTags() {
    const container = document.getElementById('languageTags');
    container.innerHTML = selectedLanguages.map(language => `
        <div class="language-tag">
            ${language}
            <span class="remove" onclick="removeLanguage('${language}')">&times;</span>
        </div>
    `).join('');
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    // Hide previous messages
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Validate languages
        if (selectedLanguages.length === 0) {
            throw new Error('Please add at least one language you can teach');
        }
        
        // Get form data
        const formData = new FormData(e.target);

        // Process specialties - convert to array if it's a string
        const specialtiesText = formData.get('specialties') || '';
        const specialtiesArray = specialtiesText ?
            specialtiesText.split(',').map(s => s.trim()).filter(s => s.length > 0) :
            [];

        const tutorData = {
            user_id: currentUser.id,
            email: currentUser.email,
            name: formData.get('fullName'),
            bio: formData.get('bio'),
            language: selectedLanguages.join(', '),
            languages: selectedLanguages, // Store as array
            experience: formData.get('experience'),
            rate: parseInt(formData.get('hourlyRate')),
            video_url: formData.get('videoUrl'),
            specialties: specialtiesArray, // Store as array
            availability: formData.get('availability') || null,
            approved: false, // Default to false, admin will approve
            rating: 0, // Default rating
            photo_url: currentUser.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString()
        };
        
        // Submit to Supabase
        const { data, error } = await supabase
            .from('tutors')
            .insert([tutorData])
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        console.log('Tutor application submitted:', data);
        
        // Show success message
        successMessage.style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 3000);
        
    } catch (error) {
        console.error('Error submitting application:', error);
        errorMessage.textContent = error.message || 'There was an error submitting your application. Please try again.';
        errorMessage.style.display = 'block';
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        
        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Make functions globally available
window.removeLanguage = removeLanguage;
