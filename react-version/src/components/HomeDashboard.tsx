import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';
import Header from './Header';
import Footer from './Footer';

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
  const [tutorStatus, setTutorStatus] = useState<{
    hasApplication: boolean;
    isApproved: boolean;
    applicationData?: any;
  }>({ hasApplication: false, isApproved: false });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (user) {
      checkTutorStatus();
    }
  }, [user]);



  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }
    setUser(session.user as User);
  };

  const checkTutorStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking tutor status:', error);
        return;
      }

      if (data) {
        setTutorStatus({
          hasApplication: true,
          isApproved: data.approved || false,
          applicationData: data
        });
      } else {
        setTutorStatus({
          hasApplication: false,
          isApproved: false
        });
      }
    } catch (error) {
      console.error('Error checking tutor status:', error);
    }
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

      // Load top 3 approved tutors from database
      await loadTopTutors();

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const loadTopTutors = async () => {
    try {
      console.log('🔍 Loading top 3 approved tutors...');

      const { data: tutorsData, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('approved', true)
        .order('rating', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error loading tutors:', error);
        return;
      }

      if (!tutorsData || tutorsData.length === 0) {
        console.log('No approved tutors found');
        setTeachers([]);
        return;
      }

      // Transform tutor data to match Teacher interface
      const transformedTeachers: Teacher[] = tutorsData.map(tutor => ({
        id: tutor.id,
        name: tutor.name,
        language: `${tutor.language} Teacher`,
        rating: tutor.rating || 4.5,
        rate: tutor.rate,
        avatar_url: tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=6366f1&color=fff`
      }));

      // If we have fewer than 3 tutors, fill with empty placeholders
      while (transformedTeachers.length < 3) {
        transformedTeachers.push({
          id: `placeholder-${transformedTeachers.length}`,
          name: 'Find More Tutors',
          language: 'Available Soon',
          rating: 0,
          rate: 0,
          avatar_url: 'https://ui-avatars.com/api/?name=Find+Tutors&background=e5e7eb&color=6b7280'
        });
      }

      console.log('✅ Loaded', tutorsData.length, 'approved tutors');
      setTeachers(transformedTeachers);
    } catch (error) {
      console.error('Error in loadTopTutors:', error);
      setTeachers([]);
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



  const getTutorToggleInfo = () => {
    if (!tutorStatus.hasApplication) {
      return {
        text: '🎓 Become a Tutor',
        action: () => navigate(ROUTES.BECOME_TUTOR_INFO),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
        )
      };
    } else if (tutorStatus.hasApplication && !tutorStatus.isApproved) {
      return {
        text: '⏳ Application Pending',
        action: () => alert('Your tutor application is under review. We\'ll notify you once it\'s approved!'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
        )
      };
    } else if (tutorStatus.isApproved) {
      return {
        text: '🎓 Switch to Teacher Mode',
        action: () => navigate(ROUTES.TUTOR_DASHBOARD),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        )
      };
    }

    // Fallback
    return {
      text: '🎓 Become a Tutor',
      action: () => navigate(ROUTES.BECOME_TUTOR_INFO),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      )
    };
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const userAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=40`;

  return (
    <div className="dashboard-page">
      <Header
        user={user}
        onSignOut={handleSignOut}
        unreadCount={0}
        tutorStatus={tutorStatus}
      />

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

          {/* Top 3 Tutors Section */}
          <section className="teachers-section">
            <div className="section-header">
              <h2 className="section-title">Top 3 Tutors</h2>
              <button
                onClick={() => navigate(ROUTES.MARKETPLACE)}
                className="view-all-btn"
              >
                Find Tutors
              </button>
            </div>
            <div className="teachers-grid">
              {teachers.map((teacher) => (
                <div key={teacher.id} className={`tutor-card ${teacher.id.startsWith('placeholder') ? 'placeholder-card' : ''}`}>
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
                  {!teacher.id.startsWith('placeholder') ? (
                    <>
                      <div className="tutor-stats">
                        <div className="tutor-rating">
                          <span className="star-icon">★</span>
                          <span className="rating-value">{teacher.rating}</span>
                        </div>
                        <span className="tutor-rate">₹{teacher.rate}/hour</span>
                      </div>
                      <div className="tutor-actions">
                        <button
                          onClick={() => navigate(`/tutor/${teacher.id}`)}
                          className="btn btn-secondary tutor-view-btn"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => navigate(`${ROUTES.MESSAGES}?tutor=${teacher.id}`)}
                          className="btn btn-primary tutor-contact-btn"
                        >
                          Contact
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="placeholder-actions">
                      <button
                        onClick={() => navigate(ROUTES.MARKETPLACE)}
                        className="btn btn-primary find-tutors-btn"
                      >
                        Find Tutors
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomeDashboard;
