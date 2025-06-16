import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';

interface TutorData {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  language: string;
  rate: number;
  rating: number;
  photo_url: string;
  native_language?: string;
  languages_spoken?: any;
  tags?: any;
  country_flag?: string;
  total_students?: number;
  total_lessons?: number;
  is_professional?: boolean;
  video_url?: string;
  about_me?: string;
  teaching_style?: string;
  resume?: string;
  experience?: string;
}

const TutorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    if (id) {
      loadTutorProfile(id);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }
    setUser(session.user);
  };

  const loadTutorProfile = async (tutorId: string) => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', tutorId)
        .eq('approved', true)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setTutor(data);
      }
    } catch (err) {
      console.error('Error loading tutor profile:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const contactTutor = async () => {
    if (!tutor || !user) return;

    try {
      // Initialize messaging service (placeholder for now)
      alert(`Starting conversation with ${tutor.name}...`);
      navigate(ROUTES.MESSAGES);
    } catch (error) {
      console.error('Error contacting tutor:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const bookLesson = () => {
    if (!tutor) return;
    alert(`Booking lesson with ${tutor.name} - Feature coming soon!`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="error-screen">
        <h2>Tutor Not Found</h2>
        <p>The tutor profile you're looking for doesn't exist.</p>
        <button onClick={() => navigate(ROUTES.MARKETPLACE)} className="btn btn-primary">
          Browse Tutors
        </button>
      </div>
    );
  }

  const avatarUrl = tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=6366f1&color=fff&size=150`;
  const rating = tutor.rating || 4.5;
  const ratingStars = '⭐'.repeat(Math.floor(rating));
  const languages = tutor.languages_spoken && tutor.languages_spoken.length > 0 ?
    (typeof tutor.languages_spoken === 'string' ? JSON.parse(tutor.languages_spoken) : tutor.languages_spoken) :
    [{ language: tutor.native_language || tutor.language, proficiency: 'Native' }];
  const tags = tutor.tags && tutor.tags.length > 0 ?
    (typeof tutor.tags === 'string' ? JSON.parse(tutor.tags) : tutor.tags) :
    ['Conversational', 'Grammar', 'Beginner Friendly'];

  return (
    <div className="tutor-profile-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <h2 className="nav-logo">IndianTutors</h2>
            </div>
            <div className="nav-right">
              <button 
                onClick={() => navigate(ROUTES.MARKETPLACE)}
                className="nav-link back-link"
              >
                ← Back to Tutors
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="tutor-profile-main">
        <div className="tutor-profile-container">
          <div className="tutor-profile-grid">
            {/* Left Section - Main Content */}
            <div className="profile-main-content">
              {/* Tutor Header */}
              <div className="tutor-header-card">
                <div className="tutor-header-info">
                  <div className="tutor-avatar-section">
                    <img src={avatarUrl} alt={tutor.name} className="tutor-profile-avatar" />
                    <div className="online-status"></div>
                  </div>
                  <div className="tutor-basic-info">
                    <div className="tutor-name-section">
                      <h1 className="tutor-profile-name">{tutor.name}</h1>
                      <span className="tutor-flag">{tutor.country_flag || '🇮🇳'}</span>
                      {tutor.is_professional && (
                        <span className="professional-badge">Professional Teacher</span>
                      )}
                    </div>
                    <div className="tutor-languages">
                      <span className="language-badge primary">
                        {tutor.native_language || tutor.language} <span className="proficiency">Native</span>
                      </span>
                    </div>
                    <div className="tutor-rating">
                      <span className="rating-stars">{ratingStars}</span>
                      <span className="rating-number">{rating}</span>
                      <span className="rating-count">({tutor.total_students || 25} students)</span>
                    </div>
                    <div className="tutor-stats">
                      <span className="stat-item">{tutor.total_lessons || 150} lessons</span>
                      <span className="stat-item">{tutor.total_students || 25} students</span>
                    </div>
                  </div>
                </div>
                <div className="tutor-tags">
                  {tags.map((tag: string, index: number) => (
                    <span key={index} className="tutor-tag">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Tabbed Content */}
              <div className="tutor-tabs-card">
                <div className="tab-navigation">
                  {[
                    { id: 'about', label: 'About Me' },
                    { id: 'teacher', label: 'Me as a Teacher' },
                    { id: 'style', label: 'My lessons & teaching style' },
                    { id: 'resume', label: 'Resume & Certificates' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="tab-content-area">
                  {activeTab === 'about' && (
                    <div className="tab-content">
                      <h3>About Me</h3>
                      <p>{tutor.about_me || tutor.bio || 'I am passionate about teaching and helping students achieve their language learning goals.'}</p>
                      <h4>Interests</h4>
                      <div className="interests-tags">
                        {['Films & TV Series', 'Travel', 'History', 'Business & Finance', 'Sports & Fitness'].map(interest => (
                          <span key={interest} className="interest-tag">{interest}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'teacher' && (
                    <div className="tab-content">
                      <h3>Me as a Teacher</h3>
                      <p>{tutor.teaching_style || tutor.experience || 'I focus on creating a comfortable and engaging learning environment for my students.'}</p>
                    </div>
                  )}
                  
                  {activeTab === 'style' && (
                    <div className="tab-content">
                      <h3>My lessons & teaching style</h3>
                      <p>I adapt my teaching style to each student's needs and learning preferences. My lessons are interactive and practical.</p>
                    </div>
                  )}
                  
                  {activeTab === 'resume' && (
                    <div className="tab-content">
                      <h3>Resume & Certificates</h3>
                      <p>{tutor.resume || `Bachelor's degree in ${tutor.native_language || tutor.language} Literature. Certified language teacher with 5+ years of experience.`}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Sidebar */}
            <div className="profile-sidebar">
              {/* Pricing Card */}
              <div className="pricing-card">
                <div className="price-display">
                  <span className="price-amount">₹{tutor.rate}</span>
                  <span className="price-period">per lesson</span>
                </div>
                <div className="booking-actions">
                  <button onClick={bookLesson} className="btn btn-primary book-btn">
                    Book Trial Lesson
                  </button>
                  <button onClick={contactTutor} className="btn btn-secondary contact-btn">
                    Contact Tutor
                  </button>
                </div>
              </div>

              {/* Video Introduction */}
              {tutor.video_url && (
                <div className="video-card">
                  <h3>Video Introduction</h3>
                  <div className="video-placeholder">
                    <p>Video introduction available</p>
                    <button className="btn btn-outline">Watch Video</button>
                  </div>
                </div>
              )}

              {/* Reviews Preview */}
              <div className="reviews-card">
                <h3>Student Reviews</h3>
                <div className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">Sarah M.</span>
                    <span className="review-rating">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p className="review-text">Excellent teacher! Very patient and helpful.</p>
                </div>
                <button className="btn btn-outline view-all-reviews">
                  View All Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TutorProfile;
