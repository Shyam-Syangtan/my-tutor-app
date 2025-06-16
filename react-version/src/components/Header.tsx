import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

interface HeaderProps {
  onLoginClick?: () => void;
  user?: any;
  onSignOut?: () => void;
  unreadCount?: number;
  tutorStatus?: {
    hasApplication: boolean;
    isApproved: boolean;
    applicationData?: any;
  };
}

const Header: React.FC<HeaderProps> = ({
  onLoginClick,
  user,
  onSignOut,
  unreadCount = 0,
  tutorStatus = { hasApplication: false, isApproved: false }
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [window.location.pathname]);

  const getUserName = () => {
    if (!user) return 'Loading...';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
  };

  const getUserAvatar = () => {
    if (!user) return '';
    const name = getUserName();
    return user.user_metadata?.avatar_url ||
           `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;
  };

  const getTutorToggleInfo = () => {
    if (!tutorStatus.hasApplication) {
      return {
        text: 'Become a Tutor',
        action: () => navigate(ROUTES.BECOME_TUTOR_INFO),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        )
      };
    } else if (tutorStatus.isApproved) {
      return {
        text: 'Switch to Tutor Mode',
        action: () => navigate(ROUTES.TUTOR_DASHBOARD),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )
      };
    } else {
      return {
        text: 'Switch to Teacher Mode',
        action: () => navigate(ROUTES.TUTOR_DASHBOARD),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        )
      };
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Prevent body scroll when menu is open
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
    setIsProfileDropdownOpen(false);
  };

  return (
    <>
      <nav className="responsive-nav navbar">
        <div className="responsive-container nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <Link to={user ? ROUTES.DASHBOARD : ROUTES.LANDING} className="nav-logo">
                IndianTutors
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="nav-right nav-links desktop-nav">
              {user ? (
                // Authenticated Navigation
                <>
                  <button
                    onClick={() => navigate(ROUTES.MARKETPLACE)}
                    className="nav-link"
                  >
                    Find a Teacher
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.MESSAGES)}
                    className="nav-link nav-messages"
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className="message-badge">{unreadCount}</span>
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  <div className="profile-dropdown" ref={profileDropdownRef}>
                    <button
                      className="profile-trigger"
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    >
                      <img src={getUserAvatar()} alt="Profile" className="profile-avatar" />
                      <span className="profile-name">{getUserName()}</span>
                      <svg className="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </button>

                    {isProfileDropdownOpen && (
                      <div className="dropdown-menu">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation(ROUTES.MY_TEACHERS); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          My Teachers
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation(ROUTES.MY_LESSONS); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                          </svg>
                          My Lessons
                        </a>
                        <hr className="dropdown-divider" />
                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation(ROUTES.PROFILE); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          Account Settings
                        </a>
                        <a href="#" className="mode-toggle" onClick={(e) => { e.preventDefault(); getTutorToggleInfo().action(); }}>
                          {getTutorToggleInfo().icon}
                          {getTutorToggleInfo().text}
                        </a>
                        <hr className="dropdown-divider" />
                        <a href="#" className="sign-out" onClick={(e) => { e.preventDefault(); onSignOut?.(); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16,17 21,12 16,7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                          Sign Out
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Unauthenticated Navigation
                <>
                  <Link to={ROUTES.MARKETPLACE} className="nav-link">Find a Teacher</Link>
                  <button
                    className="btn btn-primary nav-btn login-btn"
                    onClick={onLoginClick}
                  >
                    Log in
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              className="mobile-menu-toggle"
              onClick={handleMobileMenuToggle}
              aria-label="Toggle mobile menu"
            >
              <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={handleMobileMenuClose}></div>
          <div className="mobile-menu-drawer" ref={mobileMenuRef}>
            <div className="mobile-menu-header">
              <h3>Menu</h3>
              <button className="mobile-menu-close" onClick={handleMobileMenuClose}>
                ×
              </button>
            </div>

            <div className="mobile-menu-content">
              {user ? (
                // Authenticated Mobile Menu
                <>
                  <div className="mobile-user-info">
                    <img src={getUserAvatar()} alt="Profile" className="mobile-user-avatar" />
                    <span className="mobile-user-name">{getUserName()}</span>
                  </div>

                  <div className="mobile-menu-items">
                    <button onClick={() => handleNavigation(ROUTES.MARKETPLACE)} className="mobile-menu-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      Find a Teacher
                    </button>

                    <button onClick={() => handleNavigation(ROUTES.MESSAGES)} className="mobile-menu-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
                      </svg>
                      Messages
                      {unreadCount > 0 && (
                        <span className="mobile-message-badge">{unreadCount}</span>
                      )}
                    </button>

                    <button onClick={() => handleNavigation(ROUTES.MY_TEACHERS)} className="mobile-menu-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      My Teachers
                    </button>

                    <button onClick={() => handleNavigation(ROUTES.MY_LESSONS)} className="mobile-menu-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      My Lessons
                    </button>

                    <div className="mobile-menu-divider"></div>

                    <button onClick={() => handleNavigation(ROUTES.PROFILE)} className="mobile-menu-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Account Settings
                    </button>

                    <button onClick={() => { getTutorToggleInfo().action(); handleMobileMenuClose(); }} className="mobile-menu-item mode-toggle">
                      {getTutorToggleInfo().icon}
                      {getTutorToggleInfo().text}
                    </button>

                    <div className="mobile-menu-divider"></div>

                    <button onClick={() => { onSignOut?.(); handleMobileMenuClose(); }} className="mobile-menu-item sign-out">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                // Unauthenticated Mobile Menu
                <div className="mobile-menu-items">
                  <button onClick={() => handleNavigation(ROUTES.MARKETPLACE)} className="mobile-menu-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Find a Teacher
                  </button>

                  <button onClick={() => { onLoginClick?.(); handleMobileMenuClose(); }} className="mobile-menu-item login-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10,17 15,12 10,7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Log in
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
