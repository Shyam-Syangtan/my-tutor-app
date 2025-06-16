import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';

interface TutorData {
  id: string;
  name: string;
  email: string;
  bio: string;
  language: string;
  rate: number;
  photo_url: string;
  approved: boolean;
}

const TutorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tutorData, setTutorData] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingLessons: 0,
    actionRequired: 0,
    totalStudents: 0
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    checkAuthAndTutorStatus();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const checkAuthAndTutorStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }

    setUser(session.user);

    // Check if user is an approved tutor
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error || !data) {
        alert('You are not registered as a tutor. Please apply first.');
        navigate(ROUTES.BECOME_TUTOR_INFO);
        return;
      }

      if (!data.approved) {
        alert('Your tutor application is pending approval. Please wait for admin approval.');
        navigate(ROUTES.HOME);
        return;
      }

      setTutorData(data);
      loadDashboardData();
    } catch (error) {
      console.error('Error checking tutor status:', error);
      navigate(ROUTES.HOME);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // Load dashboard statistics (placeholder for now)
    setStats({
      upcomingLessons: 3,
      actionRequired: 2,
      totalStudents: 15
    });
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

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    action();
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

  if (!tutorData) {
    return (
      <div className="error-screen">
        <h2>Access Denied</h2>
        <p>You need to be an approved tutor to access this dashboard.</p>
        <button onClick={() => navigate(ROUTES.HOME)} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  const userName = tutorData.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tutor';
  const userAvatar = tutorData.photo_url || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=40`;

  return (
    <div className="tutor-dashboard-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <h2 className="nav-logo">IndianTutors</h2>
            </div>
            <div className="nav-right nav-links">
              <button onClick={() => navigate(ROUTES.MESSAGES)} className="nav-link">
                Messages
              </button>
              
              {/* Profile Dropdown */}
              <div className={`profile-dropdown ${isDropdownOpen ? 'active' : ''}`}>
                <button className="profile-btn" onClick={toggleDropdown}>
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
                {isDropdownOpen && (
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
                    <a href="#" onClick={(e) => handleDropdownClick(e, () => navigate(ROUTES.PROFILE))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Account Settings
                    </a>
                    <a href="#" onClick={(e) => handleDropdownClick(e, () => navigate(ROUTES.HOME))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      🎓 Switch to Student Mode
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

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        <div className="responsive-container">
          <div className="tutor-dashboard-grid">
            {/* Left Column - Main Content */}
            <div className="main-content">
              {/* Teacher Profile Card */}
              <div className="dashboard-card teacher-profile-card">
                <div className="teacher-header">
                  <img 
                    src={userAvatar} 
                    alt="Teacher Avatar" 
                    className="teacher-avatar"
                  />
                  <div className="teacher-info">
                    <h2 className="teacher-name">{tutorData.name}</h2>
                    <p className="teacher-id">ID: {tutorData.id}</p>
                    <div className="teacher-status">
                      <span className="status-badge approved">✅ Approved</span>
                      <span className="language-badge">{tutorData.language} Teacher</span>
                    </div>
                  </div>
                </div>

                <div className="teacher-stats">
                  <div className="stat-card">
                    <div className="stat-number">{stats.upcomingLessons}</div>
                    <div className="stat-label">Upcoming Lessons</div>
                  </div>
                  <div className="stat-card action-required" onClick={() => navigate('/lesson-requests')}>
                    <div className="stat-number">{stats.actionRequired}</div>
                    <div className="stat-label">Action Required</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card quick-actions-card">
                <h3 className="card-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                  <button className="action-btn" onClick={() => navigate('/lesson-requests')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11H1v6h8v-6zM23 11h-8v6h8v-6z"></path>
                      <path d="M11 1H1v6h10V1zM23 1h-8v6h8V1z"></path>
                    </svg>
                    Manage Lessons
                  </button>
                  <button className="action-btn" onClick={() => navigate('/availability')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Set Availability
                  </button>
                  <button className="action-btn" onClick={() => navigate(ROUTES.MESSAGES)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Messages
                  </button>
                  <button className="action-btn" onClick={() => navigate(ROUTES.PROFILE)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="sidebar-content">
              {/* Earnings Card */}
              <div className="dashboard-card earnings-card">
                <h3 className="card-title">Earnings</h3>
                <div className="earnings-total">
                  <div className="total-amount">₹ 0.00 <span>INR</span></div>
                  <p className="total-label">Total Balance</p>
                </div>

                <div className="earnings-breakdown">
                  <div className="earning-item">
                    <h4>₹ 395.00</h4>
                    <p>This Month</p>
                  </div>
                  <div className="earning-item">
                    <h4>₹ 0.00</h4>
                    <p>Bonus</p>
                  </div>
                </div>

                <div className="earnings-tip">
                  <p className="tip-title">✅ You can do it!</p>
                  <p className="tip-text">Check out these tips to help you get an excellence reward next month!</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="dashboard-card activity-card">
                <h3 className="card-title">Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">📚</div>
                    <div className="activity-content">
                      <p>New lesson request from Sarah</p>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">⭐</div>
                    <div className="activity-content">
                      <p>Received 5-star review</p>
                      <span className="activity-time">1 day ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">💬</div>
                    <div className="activity-content">
                      <p>New message from John</p>
                      <span className="activity-time">2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TutorDashboard;
