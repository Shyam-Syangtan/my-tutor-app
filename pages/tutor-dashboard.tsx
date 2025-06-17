// Tutor Dashboard Page - Migrated from React version
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { generateMetadata } from '../lib/seo'

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface TutorProfile {
  id: string;
  name: string;
  language: string;
  rate: number;
  rating: number;
  bio: string;
  approved: boolean;
  total_students: number;
  total_lessons: number;
}

interface TutorDashboardProps {
  initialStats: {
    totalTutors: number;
    totalStudents: number;
  };
}

export default function TutorDashboard({ initialStats }: TutorDashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const metadata = generateMetadata({
    title: 'Tutor Dashboard - Manage Your Teaching Business',
    description: 'Comprehensive tutor dashboard for Indian language teachers. Manage students, schedule lessons, track earnings, and grow your teaching business.',
    keywords: 'tutor dashboard, teacher management, lesson scheduling, student management, teaching analytics',
    path: '/tutor-dashboard'
  })

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session.user as User);
    await loadTutorProfile(session.user.id);
    setLoading(false);
  };

  const loadTutorProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading tutor profile:', error);
        // Redirect to student dashboard if not a tutor
        router.push('/dashboard');
        return;
      }

      if (!data.approved) {
        alert('Your tutor application is still under review. You\'ll be redirected to the student dashboard.');
        router.push('/dashboard');
        return;
      }

      setTutorProfile({
        id: data.id,
        name: data.name,
        language: data.language,
        rate: data.rate,
        rating: data.rating || 4.5,
        bio: data.bio,
        approved: data.approved,
        total_students: 0, // Will be calculated from actual data
        total_lessons: 0   // Will be calculated from actual data
      });
    } catch (error) {
      console.error('Error loading tutor profile:', error);
      router.push('/dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>{metadata.title as string}</title>
          <meta name="description" content={metadata.description} />
        </Head>
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading tutor dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (!tutorProfile) {
    return (
      <>
        <Head>
          <title>Access Denied - Tutor Dashboard</title>
          <meta name="description" content="Access denied to tutor dashboard" />
        </Head>
        <div className="access-denied">
          <h1>Access Denied</h1>
          <p>You don't have access to the tutor dashboard.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{metadata.title as string}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={metadata.title as string} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.shyamsyangtan.com/tutor-dashboard" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.shyamsyangtan.com/tutor-dashboard" />
      </Head>

      <div className="tutor-dashboard-page">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-container">
            <div className="header-left">
              <h1 className="dashboard-title">Tutor Dashboard</h1>
              <p className="dashboard-subtitle">Welcome back, {tutorProfile.name}!</p>
            </div>
            <div className="header-right">
              <button
                onClick={() => router.push('/dashboard')}
                className="btn btn-secondary"
              >
                Switch to Student Mode
              </button>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="dashboard-nav">
          <div className="nav-container">
            <button
              className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              My Students
            </button>
            <button
              className={`nav-tab ${activeTab === 'lessons' ? 'active' : ''}`}
              onClick={() => setActiveTab('lessons')}
            >
              Lessons
            </button>
            <button
              className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
            <button
              className={`nav-tab ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings
            </button>
            <button
              className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="dashboard-content">
          <div className="content-container">
            {activeTab === 'overview' && (
              <div className="overview-section">
                <h2 className="section-title">Teaching Overview</h2>
                
                {/* Stats Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-info">
                      <div className="stat-number">{tutorProfile.total_students}</div>
                      <div className="stat-label">Total Students</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                      <div className="stat-number">{tutorProfile.total_lessons}</div>
                      <div className="stat-label">Lessons Taught</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                      <div className="stat-number">{tutorProfile.rating}</div>
                      <div className="stat-label">Average Rating</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <div className="stat-number">₹{tutorProfile.rate}</div>
                      <div className="stat-label">Hourly Rate</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                  <h3 className="section-subtitle">Quick Actions</h3>
                  <div className="actions-grid">
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="action-card"
                    >
                      <div className="action-icon">📅</div>
                      <div className="action-text">Manage Schedule</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="action-card"
                    >
                      <div className="action-icon">👥</div>
                      <div className="action-text">View Students</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('lessons')}
                      className="action-card"
                    >
                      <div className="action-icon">🎓</div>
                      <div className="action-text">Lesson Requests</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="action-card"
                    >
                      <div className="action-icon">⚙️</div>
                      <div className="action-text">Edit Profile</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="recent-activity">
                  <h3 className="section-subtitle">Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon">📚</div>
                      <div className="activity-content">
                        <div className="activity-text">No recent activity</div>
                        <div className="activity-time">Start teaching to see activity</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="students-section">
                <div className="section-header">
                  <h2 className="section-title">My Students</h2>
                  <div className="section-stats">
                    <span className="stat-badge">{tutorProfile.total_students} Students</span>
                  </div>
                </div>
                
                <div className="students-content">
                  <div className="empty-state">
                    <div className="empty-icon">👨‍🎓</div>
                    <h3 className="empty-title">No students yet</h3>
                    <p className="empty-description">
                      Students will appear here once they book lessons with you.
                    </p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="btn btn-primary"
                    >
                      Optimize Your Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
              <div className="lessons-section">
                <div className="section-header">
                  <h2 className="section-title">Lesson Management</h2>
                  <div className="lesson-tabs">
                    <button className="lesson-tab active">Requests</button>
                    <button className="lesson-tab">Upcoming</button>
                    <button className="lesson-tab">Completed</button>
                  </div>
                </div>
                
                <div className="lessons-content">
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3 className="empty-title">No lesson requests</h3>
                    <p className="empty-description">
                      Lesson requests from students will appear here for you to approve or decline.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="calendar-section">
                <div className="section-header">
                  <h2 className="section-title">Teaching Calendar</h2>
                  <button className="btn btn-primary">
                    Set Availability
                  </button>
                </div>
                
                <div className="calendar-content">
                  <div className="calendar-placeholder">
                    <div className="calendar-icon">📅</div>
                    <h3 className="calendar-title">Calendar Coming Soon</h3>
                    <p className="calendar-description">
                      Manage your teaching schedule and availability here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="earnings-section">
                <div className="section-header">
                  <h2 className="section-title">Earnings</h2>
                  <div className="earnings-period">
                    <select className="period-select">
                      <option>This Month</option>
                      <option>Last Month</option>
                      <option>This Year</option>
                    </select>
                  </div>
                </div>
                
                <div className="earnings-content">
                  <div className="earnings-stats">
                    <div className="earnings-card">
                      <h3 className="earnings-title">Total Earnings</h3>
                      <div className="earnings-amount">₹0</div>
                    </div>
                    <div className="earnings-card">
                      <h3 className="earnings-title">This Month</h3>
                      <div className="earnings-amount">₹0</div>
                    </div>
                    <div className="earnings-card">
                      <h3 className="earnings-title">Pending</h3>
                      <div className="earnings-amount">₹0</div>
                    </div>
                  </div>
                  
                  <div className="earnings-chart">
                    <div className="chart-placeholder">
                      <div className="chart-icon">📊</div>
                      <p>Earnings chart will appear here once you start teaching</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2 className="section-title">Tutor Profile</h2>
                  <button className="btn btn-primary">
                    Edit Profile
                  </button>
                </div>
                
                <div className="profile-content">
                  <div className="profile-card">
                    <div className="profile-header">
                      <div className="profile-avatar">
                        <span className="avatar-placeholder">
                          {tutorProfile.name.charAt(0)}
                        </span>
                      </div>
                      <div className="profile-info">
                        <h3 className="profile-name">{tutorProfile.name}</h3>
                        <p className="profile-language">{tutorProfile.language} Teacher</p>
                        <div className="profile-rating">
                          <span className="star-icon">★</span>
                          <span className="rating-value">{tutorProfile.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="profile-details">
                      <div className="detail-item">
                        <strong>Hourly Rate:</strong> ₹{tutorProfile.rate}
                      </div>
                      <div className="detail-item">
                        <strong>Bio:</strong> {tutorProfile.bio}
                      </div>
                      <div className="detail-item">
                        <strong>Status:</strong> 
                        <span className="status-badge approved">Approved</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// Server-side data fetching for SEO
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch platform stats for SEO
    const { count: totalTutors } = await supabase
      .from('tutors')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true);

    // For now, student count is estimated
    const totalStudents = 0;

    return {
      props: {
        initialStats: {
          totalTutors: totalTutors || 0,
          totalStudents
        }
      }
    };
  } catch (error) {
    console.error('Error fetching tutor dashboard data:', error);
    return {
      props: {
        initialStats: {
          totalTutors: 0,
          totalStudents: 0
        }
      }
    };
  }
};
