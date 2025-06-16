import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';
import Footer from './Footer';

const BecomeTutorInfo: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    
    // Check if user is already an approved tutor
    try {
      const { data: tutorData, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('approved', true)
        .single();

      if (tutorData) {
        // User is already an approved tutor, redirect to dashboard
        navigate(ROUTES.TUTOR_DASHBOARD);
        return;
      }
    } catch (error) {
      // No approved tutor profile found, continue normally
      console.log('No approved tutor profile found');
    }
    
    setLoading(false);
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

  return (
    <div className="become-tutor-info-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <h2 className="nav-logo">IndianTutors</h2>
            </div>
            <div className="nav-right nav-links">
              <button onClick={() => navigate(ROUTES.HOME)} className="nav-link">
                Home
              </button>
              <button onClick={() => navigate(ROUTES.MARKETPLACE)} className="nav-link">
                Find Teachers
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="tutor-info-main">
        <div className="tutor-info-container">
          <button onClick={() => navigate(ROUTES.HOME)} className="back-link">
            ← Back to Home
          </button>
          
          {/* Header Section */}
          <div className="header-section">
            <h1>Become a Tutor</h1>
            <p>Join our community of passionate educators and start sharing your knowledge with students around the world</p>
          </div>

          {/* Requirements Grid */}
          <div className="requirements-grid">
            <div className="requirement-card">
              <div className="icon">📝</div>
              <h3>Is your language open?</h3>
              <p>Before applying check if your teaching language is open for application.</p>
              <button className="action-btn">CHECK THE LIST</button>
            </div>

            <div className="requirement-card">
              <div className="icon">🎓</div>
              <h3>What type of teacher are you?</h3>
              <p>On IndianTutors you can become a Professional Teacher or a Community Tutor. Discover a solution that suits you.</p>
              <button className="action-btn">LEARN MORE</button>
            </div>

            <div className="requirement-card">
              <div className="icon">⏰</div>
              <h3>How much can you earn?</h3>
              <p>Your earnings depend on your hourly rate, number of lessons, and student reviews. Set your own schedule and rates.</p>
              <button className="action-btn">CALCULATE EARNINGS</button>
            </div>
          </div>

          {/* Information Section */}
          <div className="info-section">
            <h3>What you'll need to provide:</h3>
            <ul>
              <li>Basic personal information (name, email, country)</li>
              <li>Native language(s) and languages you want to teach</li>
              <li>Professional profile photo</li>
              <li>1-2 minute video introduction</li>
              <li>Teaching experience and qualifications</li>
              <li>Weekly availability schedule</li>
              <li>Written profile introduction</li>
            </ul>
          </div>

          {/* Start Application Section */}
          <div className="start-application">
            <h2>Ready to Start Teaching?</h2>
            <p>Complete your tutor application and join thousands of educators making a difference</p>
            <button
              onClick={() => navigate(ROUTES.BECOME_TUTOR)}
              className="start-btn"
            >
              START YOUR APPLICATION
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BecomeTutorInfo;
