// Advanced Student Dashboard - Migrated from React version
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

interface StudentDashboardProps {
  initialData: {
    tutorCount: number;
    lessonCount: number;
  };
}

export default function StudentDashboard({ initialData }: StudentDashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const metadata = generateMetadata({
    title: 'Advanced Student Dashboard - Comprehensive Learning Management',
    description: 'Advanced student dashboard with detailed analytics, lesson management, tutor connections, and progress tracking for Indian language learning.',
    keywords: 'advanced student dashboard, learning analytics, lesson management, tutor connections, progress tracking',
    path: '/student-dashboard'
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
    setLoading(false);
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
            <p className="loading-text">Loading student dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

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
        <meta property="og:url" content="https://www.shyamsyangtan.com/student-dashboard" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.shyamsyangtan.com/student-dashboard" />
      </Head>

      <div className="student-dashboard-page">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-container">
            <div className="header-left">
              <h1 className="dashboard-title">Student Dashboard</h1>
              <p className="dashboard-subtitle">Advanced Learning Management</p>
            </div>
            <div className="header-right">
              <button
                onClick={() => router.push('/marketplace')}
                className="btn btn-primary"
              >
                Find Tutors
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
              className={`nav-tab ${activeTab === 'lessons' ? 'active' : ''}`}
              onClick={() => setActiveTab('lessons')}
            >
              My Lessons
            </button>
            <button
              className={`nav-tab ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              My Teachers
            </button>
            <button
              className={`nav-tab ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              Progress
            </button>
            <button
              className={`nav-tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="dashboard-content">
          <div className="content-container">
            {activeTab === 'overview' && (
              <div className="overview-section">
                <h2 className="section-title">Welcome back, {userName}!</h2>
                
                {/* Stats Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                      <div className="stat-number">{initialData.lessonCount}</div>
                      <div className="stat-label">Total Lessons</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👨‍🏫</div>
                    <div className="stat-info">
                      <div className="stat-number">{initialData.tutorCount}</div>
                      <div className="stat-label">Available Tutors</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                      <div className="stat-number">4.8</div>
                      <div className="stat-label">Average Rating</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-info">
                      <div className="stat-number">7</div>
                      <div className="stat-label">Day Streak</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                  <h3 className="section-subtitle">Quick Actions</h3>
                  <div className="actions-grid">
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="action-card"
                    >
                      <div className="action-icon">🔍</div>
                      <div className="action-text">Find New Tutors</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('lessons')}
                      className="action-card"
                    >
                      <div className="action-icon">📅</div>
                      <div className="action-text">Schedule Lesson</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('messages')}
                      className="action-card"
                    >
                      <div className="action-icon">💬</div>
                      <div className="action-text">Message Tutors</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className="action-card"
                    >
                      <div className="action-icon">📊</div>
                      <div className="action-text">View Progress</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
              <div className="lessons-section">
                <div className="section-header">
                  <h2 className="section-title">My Lessons</h2>
                  <button
                    onClick={() => router.push('/marketplace')}
                    className="btn btn-primary"
                  >
                    Book New Lesson
                  </button>
                </div>
                
                <div className="lessons-content">
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3 className="empty-title">No lessons yet</h3>
                    <p className="empty-description">
                      Start your learning journey by booking your first lesson with a qualified tutor.
                    </p>
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="btn btn-primary"
                    >
                      Find Tutors
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="teachers-section">
                <div className="section-header">
                  <h2 className="section-title">My Teachers</h2>
                  <button
                    onClick={() => router.push('/marketplace')}
                    className="btn btn-primary"
                  >
                    Find More Tutors
                  </button>
                </div>
                
                <div className="teachers-content">
                  <div className="empty-state">
                    <div className="empty-icon">👨‍🏫</div>
                    <h3 className="empty-title">No teachers connected</h3>
                    <p className="empty-description">
                      Connect with experienced tutors to start learning Indian languages.
                    </p>
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="btn btn-primary"
                    >
                      Browse Tutors
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="progress-section">
                <h2 className="section-title">Learning Progress</h2>
                
                <div className="progress-content">
                  <div className="progress-card">
                    <h3 className="progress-title">Overall Progress</h3>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '65%' }}></div>
                    </div>
                    <p className="progress-text">65% Complete</p>
                  </div>
                  
                  <div className="achievements">
                    <h3 className="achievements-title">Achievements</h3>
                    <div className="achievement-item">
                      <span className="achievement-icon">🏆</span>
                      <span className="achievement-text">First Lesson Completed</span>
                    </div>
                    <div className="achievement-item">
                      <span className="achievement-icon">🔥</span>
                      <span className="achievement-text">7-Day Streak</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="messages-section">
                <div className="section-header">
                  <h2 className="section-title">Messages</h2>
                  <button
                    onClick={() => router.push('/messages')}
                    className="btn btn-primary"
                  >
                    View All Messages
                  </button>
                </div>
                
                <div className="messages-content">
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h3 className="empty-title">No messages yet</h3>
                    <p className="empty-description">
                      Start a conversation with your tutors to ask questions and get guidance.
                    </p>
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="btn btn-primary"
                    >
                      Contact Tutors
                    </button>
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

// Server-side data fetching for SEO and initial data
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch tutor count
    const { count: tutorCount } = await supabase
      .from('tutors')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true);

    // For now, lesson count is 0 since we don't have lesson data
    const lessonCount = 0;

    return {
      props: {
        initialData: {
          tutorCount: tutorCount || 0,
          lessonCount
        }
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      props: {
        initialData: {
          tutorCount: 0,
          lessonCount: 0
        }
      }
    };
  }
};
