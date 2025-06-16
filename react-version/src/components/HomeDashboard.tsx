import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Lesson {
  id: string;
  date: string;
  time: string;
  language: string;
  duration: number;
  tutor_name: string;
}

interface Teacher {
  id: string;
  name: string;
  language: string;
  rating: number;
  rate: number;
  avatar_url: string;
}

const HomeDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }
    setUser(session.user as User);
  };

  const loadDashboardData = async () => {
    try {
      // Load upcoming lessons (mock data for now)
      setLessons([
        {
          id: '1',
          date: 'June 12',
          time: '16:30',
          language: 'Hindi',
          duration: 60,
          tutor_name: 'Rajesh Kumar'
        },
        {
          id: '2',
          date: 'June 14',
          time: '18:00',
          language: 'Tamil',
          duration: 45,
          tutor_name: 'Priya Sharma'
        }
      ]);

      // Load teachers (mock data for now)
      setTeachers([
        {
          id: '1',
          name: 'Rajesh Kumar',
          language: 'Hindi Teacher',
          rating: 4.9,
          rate: 500,
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: '2',
          name: 'Priya Sharma',
          language: 'Tamil Teacher',
          rating: 4.8,
          rate: 450,
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: '3',
          name: 'Amit Patel',
          language: 'Bengali Teacher',
          rating: 4.7,
          rate: 400,
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate(ROUTES.LANDING);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const userAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=40`;

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
              <div className="profile-dropdown">
                <button className="profile-btn">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="profile-avatar"
                  />
                  <span className="profile-name">{userName}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                <div className="profile-dropdown-content">
                  <div className="profile-info">
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="dropdown-avatar"
                    />
                    <div className="dropdown-user-info">
                      <div className="dropdown-name">{userName}</div>
                      <div className="dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <hr className="dropdown-divider" />
                  <a href="#" onClick={() => navigate(ROUTES.PROFILE)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Account Settings
                  </a>
                  <a href="#" className="mode-toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Become a Tutor
                  </a>
                  <hr className="dropdown-divider" />
                  <a href="#" onClick={handleSignOut} className="logout-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16,17 21,12 16,7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="responsive-container">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h1 className="welcome-title">
              Welcome back, {userName}!
            </h1>
            <p className="welcome-subtitle">Continue your language learning journey</p>
          </section>

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Profile Card */}
            <div className="dashboard-card">
              <h3 className="card-title">Your Progress</h3>
              <div className="progress-content">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="progress-avatar"
                />
                <div className="progress-info">
                  <h4 className="progress-name">{userName}</h4>
                  <div className="progress-stats">
                    <div className="stat-item">
                      <div className="stat-number">7</div>
                      <div className="stat-label">Week streak</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">24</div>
                      <div className="stat-label">Total hours</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">85</div>
                      <div className="stat-label">Knowledge score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Lessons Card */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Upcoming Lessons</h3>
                <button className="view-all-btn">
                  View all
                </button>
              </div>
              <div className="lessons-list">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="lesson-item">
                    <div className="lesson-info">
                      <div className="lesson-date">
                        <div className="date-text">{lesson.date}</div>
                        <div className="time-text">{lesson.time}</div>
                      </div>
                      <div className="lesson-details">
                        <div className="lesson-language">{lesson.language}</div>
                        <div className="lesson-duration">{lesson.duration} min</div>
                      </div>
                    </div>
                    <button className="btn btn-primary lesson-join-btn">
                      Join
                    </button>
                  </div>
                ))}
                {lessons.length === 0 && (
                  <div className="no-lessons">
                    <p className="no-lessons-text">No upcoming lessons</p>
                    <button
                      onClick={() => navigate(ROUTES.MARKETPLACE)}
                      className="book-lesson-btn"
                    >
                      Book a lesson
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Teachers Section */}
          <section className="teachers-section">
            <div className="section-header">
              <h2 className="section-title">My Teachers</h2>
              <button
                onClick={() => navigate(ROUTES.MARKETPLACE)}
                className="view-all-btn"
              >
                View all
              </button>
            </div>
            <div className="teachers-grid">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="tutor-card">
                  <div className="tutor-header">
                    <img
                      src={teacher.avatar_url}
                      alt={teacher.name}
                      className="tutor-avatar"
                    />
                    <div className="tutor-info">
                      <h4 className="tutor-name">{teacher.name}</h4>
                      <p className="tutor-language">{teacher.language}</p>
                    </div>
                  </div>
                  <div className="tutor-stats">
                    <div className="tutor-rating">
                      <span className="star-icon">★</span>
                      <span className="rating-value">{teacher.rating}</span>
                    </div>
                    <span className="tutor-rate">₹{teacher.rate}/hour</span>
                  </div>
                  <button className="btn btn-primary tutor-book-btn">
                    Book
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HomeDashboard;
