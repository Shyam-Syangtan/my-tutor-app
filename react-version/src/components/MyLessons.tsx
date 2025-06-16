import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';
import Footer from './Footer';

interface Lesson {
  id: string;
  tutor_id: string;
  student_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: string;
  student_message?: string;
  tutor_response?: string;
  created_at: string;
  tutor_name?: string;
  tutor_photo?: string;
}

const MyLessons: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadMyLessons();
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

  const loadMyLessons = async () => {
    try {
      console.log('📚 Loading lessons for user:', user.id);
      
      // Get lessons for current student
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', user.id)
        .order('lesson_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (lessonsError) {
        console.error('Error loading lessons:', lessonsError);
        return;
      }

      if (!lessonsData || lessonsData.length === 0) {
        console.log('No lessons found');
        setLessons([]);
        return;
      }

      // Get tutor info for each lesson
      const tutorIds = Array.from(new Set(lessonsData.map(lesson => lesson.tutor_id)));
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('user_id, name, photo_url')
        .in('user_id', tutorIds);

      if (tutorsError) {
        console.error('Error loading tutors:', tutorsError);
      }

      // Create tutor lookup map
      const tutorMap = new Map();
      tutorsData?.forEach(tutor => {
        tutorMap.set(tutor.user_id, tutor);
      });

      // Combine lesson and tutor data
      const enrichedLessons = lessonsData.map(lesson => ({
        ...lesson,
        tutor_name: tutorMap.get(lesson.tutor_id)?.name || 'Unknown Tutor',
        tutor_photo: tutorMap.get(lesson.tutor_id)?.photo_url
      }));

      console.log('✅ Found', enrichedLessons.length, 'lessons');
      setLessons(enrichedLessons);
    } catch (error) {
      console.error('Error in loadMyLessons:', error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Declined';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
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
            <h1>My Lessons</h1>
            <p>Your scheduled and past lessons</p>
          </div>

          <div className="lessons-list">
            {lessons.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h3>No Lessons Yet</h3>
                <p>You haven't booked any lessons yet. Find a tutor and schedule your first lesson!</p>
                <button 
                  onClick={() => navigate(ROUTES.MARKETPLACE)}
                  className="btn btn-primary"
                >
                  Find Tutors
                </button>
              </div>
            ) : (
              lessons.map(lesson => (
                <div key={lesson.id} className="lesson-card">
                  <div className="lesson-tutor">
                    <img 
                      src={lesson.tutor_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(lesson.tutor_name || 'Tutor')}&background=6366f1&color=fff`} 
                      alt={lesson.tutor_name}
                      className="tutor-avatar"
                    />
                    <div className="tutor-info">
                      <h3>{lesson.tutor_name}</h3>
                      <p>Language Tutor</p>
                    </div>
                  </div>
                  <div className="lesson-details">
                    <div className="lesson-date">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>{formatDate(lesson.lesson_date)}</span>
                    </div>
                    <div className="lesson-time">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                      <span>{formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}</span>
                    </div>
                  </div>
                  <div className="lesson-status">
                    <span className={`status-badge ${getStatusColor(lesson.status)}`}>
                      {getStatusText(lesson.status)}
                    </span>
                  </div>
                  {lesson.student_message && (
                    <div className="lesson-message">
                      <p><strong>Your message:</strong> {lesson.student_message}</p>
                    </div>
                  )}
                  {lesson.tutor_response && (
                    <div className="lesson-response">
                      <p><strong>Tutor response:</strong> {lesson.tutor_response}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MyLessons;
