import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';

interface FormData {
  fullName: string;
  bio: string;
  language: string;
  rate: string;
  experience: string;
  videoUrl: string;
  specialties: string;
  availability: string;
}

const BecomeTutor: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    bio: '',
    language: '',
    rate: '',
    experience: '',
    videoUrl: '',
    specialties: '',
    availability: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }

    setUser(session.user);
    await checkExistingApplication(session.user.id);
    setLoading(false);
  };

  const checkExistingApplication = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setExistingApplication(data);
      }
    } catch (error) {
      // No existing application found
      console.log('No existing application found');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setShowError(false);

    try {
      const applicationData = {
        user_id: user.id,
        name: formData.fullName,
        email: user.email,
        bio: formData.bio,
        language: formData.language,
        rate: parseInt(formData.rate),
        experience: formData.experience,
        video_url: formData.videoUrl,
        specialties: formData.specialties,
        availability: formData.availability,
        approved: false,
        photo_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=6366f1&color=fff&size=150`
      };

      const { error } = await supabase
        .from('tutors')
        .insert([applicationData]);

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, 3000);

    } catch (error) {
      console.error('Error submitting application:', error);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="become-tutor-page">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-content">
              <div className="nav-left">
                <h2 className="nav-logo">IndianTutors</h2>
              </div>
            </div>
          </div>
        </nav>

        <main className="tutor-main">
          <div className="become-tutor-container">
            <button onClick={() => navigate(ROUTES.HOME)} className="back-link">
              ← Back to Home
            </button>
            
            <div className="existing-application">
              <h1>Application Status</h1>
              {existingApplication.approved ? (
                <div className="status-approved">
                  <h3>🎉 Congratulations! Your application has been approved!</h3>
                  <p>You can now start teaching and managing your lessons.</p>
                  <button 
                    onClick={() => navigate(ROUTES.TUTOR_DASHBOARD)}
                    className="btn btn-primary"
                  >
                    Go to Tutor Dashboard
                  </button>
                </div>
              ) : (
                <div className="status-pending">
                  <h3>⏳ Your application is under review</h3>
                  <p>We're reviewing your tutor application. You'll receive an email notification once it's approved.</p>
                </div>
              )}
              
              <div className="application-details">
                <h4>Your Application Details:</h4>
                <p><strong>Name:</strong> {existingApplication.name}</p>
                <p><strong>Languages:</strong> {existingApplication.language}</p>
                <p><strong>Rate:</strong> ₹{existingApplication.rate}/hour</p>
                <p><strong>Experience:</strong> {existingApplication.experience}</p>
                <p><strong>Submitted:</strong> {new Date(existingApplication.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="become-tutor-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <h2 className="nav-logo">IndianTutors</h2>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="tutor-main">
        <div className="become-tutor-container">
          <button onClick={() => navigate(ROUTES.HOME)} className="back-link">
            ← Back to Home
          </button>
          
          <h1>Become a Tutor</h1>
          <p>Join our community of language tutors and start teaching students worldwide!</p>
          
          <div className="info-box">
            <h4>📋 Application Process</h4>
            <p>After submitting your application, our team will review your profile. Once approved, you'll be able to start teaching and your profile will appear in our tutor directory.</p>
          </div>
          
          {showSuccess && (
            <div className="success-message">
              Your tutor application has been submitted successfully! We'll review it and get back to you soon.
            </div>
          )}
          
          {showError && (
            <div className="error-message">
              There was an error submitting your application. Please try again.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="tutor-form">
            {/* Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName" 
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio / About Me *</label>
                <textarea 
                  id="bio" 
                  name="bio" 
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell students about yourself, your teaching experience, and what makes you a great tutor..." 
                  required
                />
              </div>
            </div>

            {/* Teaching Information */}
            <div className="form-section">
              <h3>Teaching Information</h3>
              
              <div className="form-group">
                <label htmlFor="language">Language You Teach *</label>
                <select 
                  id="language" 
                  name="language" 
                  value={formData.language}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a language</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Punjabi">Punjabi</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="rate">Hourly Rate (₹) *</label>
                <input 
                  type="number" 
                  id="rate" 
                  name="rate" 
                  value={formData.rate}
                  onChange={handleInputChange}
                  min="100" 
                  max="5000" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="experience">Teaching Experience *</label>
                <textarea 
                  id="experience" 
                  name="experience" 
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Describe your teaching experience, qualifications, and methodology..." 
                  required
                />
              </div>
            </div>

            {/* Video Introduction */}
            <div className="form-section">
              <h3>Video Introduction</h3>
              
              <div className="form-group">
                <label htmlFor="videoUrl">Video Introduction URL</label>
                <input 
                  type="url" 
                  id="videoUrl" 
                  name="videoUrl" 
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..." 
                />
                <small>Upload a 1-2 minute video introducing yourself (YouTube, Vimeo, etc.)</small>
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="form-section">
              <h3>Additional Information</h3>
              
              <div className="form-group">
                <label htmlFor="specialties">Teaching Specialties</label>
                <textarea 
                  id="specialties" 
                  name="specialties" 
                  value={formData.specialties}
                  onChange={handleInputChange}
                  placeholder="e.g., Conversational Hindi, Business English, Grammar, Pronunciation..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="availability">Preferred Teaching Hours</label>
                <textarea 
                  id="availability" 
                  name="availability" 
                  value={formData.availability}
                  onChange={handleInputChange}
                  placeholder="e.g., Weekdays 6-10 PM, Weekends 9 AM - 6 PM..."
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BecomeTutor;
