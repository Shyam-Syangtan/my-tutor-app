import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';

interface Tutor {
  id: string;
  user_id: string;
  name: string;
  photo_url: string;
  language: string;
  rate: number;
  rating: number;
  bio: string;
}

const MyTeachers: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadMyTeachers();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const loadMyTeachers = async () => {
    try {
      console.log('🔍 Loading teachers for user:', user.id);
      
      // Get all chats where current user is a participant
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (chatsError) {
        console.error('Error loading chats:', chatsError);
        return;
      }

      if (!chats || chats.length === 0) {
        console.log('No chats found');
        setTutors([]);
        return;
      }

      // Get participant IDs (excluding current user)
      const participantIds = chats.map(chat => 
        chat.user1_id === user.id ? chat.user2_id : chat.user1_id
      );

      // Get tutors from the participant IDs
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .in('user_id', participantIds)
        .eq('approved', true);

      if (tutorError) {
        console.error('Error loading tutors:', tutorError);
        return;
      }

      console.log('✅ Found', tutorData?.length || 0, 'teachers');
      setTutors(tutorData || []);
    } catch (error) {
      console.error('Error in loadMyTeachers:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.LANDING);
  };

  const handleDropdownClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    action();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const startConversation = (tutorUserId: string) => {
    navigate(`${ROUTES.MESSAGES}?tutor=${tutorUserId}`);
  };

  const getUserName = () => {
    if (!user) return 'Loading...';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
  };

  const getUserAvatar = () => {
    if (!user) return '';
    const name = getUserName();
    return user.user_metadata?.avatar_url || 
           `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
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
    <div className="dashboard-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <a href="#" className="nav-logo">IndianTutors</a>
            </div>
            <div className="nav-right nav-links">
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="nav-link"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate(ROUTES.MARKETPLACE)}
                className="nav-link"
              >
                Find a Teacher
              </button>
              <button
                onClick={() => navigate(ROUTES.MESSAGES)}
                className="nav-link"
              >
                Messages
              </button>

              {/* Profile Dropdown */}
              <div className={`profile-dropdown ${isDropdownOpen ? 'active' : ''}`}>
                <button className="profile-btn" onClick={toggleDropdown}>
                  <img
                    src={getUserAvatar()}
                    alt={getUserName()}
                    className="profile-avatar"
                  />
                  <span className="profile-name">{getUserName()}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="profile-dropdown-content">
                    <div className="profile-info">
                      <img
                        src={getUserAvatar()}
                        alt={getUserName()}
                        className="dropdown-avatar"
                      />
                      <div className="dropdown-user-info">
                        <div className="dropdown-name">{getUserName()}</div>
                        <div className="dropdown-email">{user?.email}</div>
                      </div>
                    </div>
                    <hr className="dropdown-divider" />
                    <a href="#" onClick={(e) => handleDropdownClick(e, () => navigate(ROUTES.MY_TEACHERS))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      My Teachers
                    </a>
                    <a href="#" onClick={(e) => handleDropdownClick(e, () => navigate(ROUTES.MY_LESSONS))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      My Lessons
                    </a>
                    <hr className="dropdown-divider" />
                    <a href="#" onClick={(e) => handleDropdownClick(e, () => navigate(ROUTES.PROFILE))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Account Settings
                    </a>
                    <hr className="dropdown-divider" />
                    <a href="#" onClick={(e) => handleDropdownClick(e, handleSignOut)} className="logout-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>My Teachers</h1>
            <p>Tutors you have previously contacted or messaged</p>
          </div>

          <div className="tutors-grid">
            {tutors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <h3>No Teachers Yet</h3>
                <p>You haven't contacted any tutors yet. Start by finding and messaging a tutor!</p>
                <button 
                  onClick={() => navigate(ROUTES.MARKETPLACE)}
                  className="btn btn-primary"
                >
                  Find Tutors
                </button>
              </div>
            ) : (
              tutors.map(tutor => (
                <div key={tutor.id} className="tutor-card">
                  <div className="tutor-avatar">
                    <img 
                      src={tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=6366f1&color=fff`} 
                      alt={tutor.name}
                    />
                  </div>
                  <div className="tutor-info">
                    <h3 className="tutor-name">{tutor.name}</h3>
                    <p className="tutor-language">{tutor.language} Teacher</p>
                    <div className="tutor-rating">
                      <span className="rating-stars">
                        {'★'.repeat(Math.floor(tutor.rating || 4.5))}
                        {'☆'.repeat(5 - Math.floor(tutor.rating || 4.5))}
                      </span>
                      <span className="rating-number">{tutor.rating || 4.5}</span>
                    </div>
                    <p className="tutor-rate">₹{tutor.rate}/hour</p>
                  </div>
                  <div className="tutor-actions">
                    <button 
                      onClick={() => startConversation(tutor.user_id)}
                      className="btn btn-primary"
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyTeachers;
