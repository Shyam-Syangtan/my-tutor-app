import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import LoginModal from './LoginModal';

const LandingPage: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      // Redirect to dashboard if already authenticated
      window.location.href = '/my-tutor-app/react-version/dashboard';
    }
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    document.body.style.overflow = '';
  };

  return (
    <div className="landing-page">
      <Header onLoginClick={openLoginModal} />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="responsive-container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Become fluent in any Indian language</h1>
            <ul className="hero-features">
              <li>
                <span className="feature-icon">📹</span>
                1-on-1 video lessons
              </li>
              <li>
                <span className="feature-icon">🎓</span>
                Certified tutors
              </li>
              <li>
                <span className="feature-icon">⏰</span>
                Flexible schedules and prices
              </li>
            </ul>
            <button 
              className="btn btn-primary cta-button btn-full-mobile" 
              onClick={openLoginModal}
            >
              <span className="google-icon">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </span>
              Start Now with Google
            </button>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="illustration-card">
                <div className="card-header">
                  <div className="avatar"></div>
                  <div className="tutor-info">
                    <div className="tutor-name"></div>
                    <div className="tutor-lang"></div>
                  </div>
                </div>
                <div className="card-content">
                  <div className="lesson-preview"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="languages">
        <div className="responsive-container languages-container">
          <h2 className="languages-title">Popular Indian Languages</h2>
          <div className="responsive-grid grid-4 grid-mobile-2 languages-grid">
            <div className="language-pill">
              <span className="language-name">Hindi</span>
              <span className="tutor-count">1,247 tutors</span>
            </div>
            <div className="language-pill">
              <span className="language-name">Tamil</span>
              <span className="tutor-count">892 tutors</span>
            </div>
            <div className="language-pill">
              <span className="language-name">Bengali</span>
              <span className="tutor-count">634 tutors</span>
            </div>
            <div className="language-pill">
              <span className="language-name">Telugu</span>
              <span className="tutor-count">578 tutors</span>
            </div>
            <div className="language-pill">
              <span className="language-name">Marathi</span>
              <span className="tutor-count">423 tutors</span>
            </div>
            <div className="language-pill">
              <span className="language-name">Gujarati</span>
              <span className="tutor-count">356 tutors</span>
            </div>
            <div className="language-pill">
              <span className="language-name">Kannada</span>
              <span className="tutor-count">289 tutors</span>
            </div>
            <div className="language-pill">
              <span className="language-name">Malayalam</span>
              <span className="tutor-count">234 tutors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={closeLoginModal} />
      )}
    </div>
  );
};

export default LandingPage;
