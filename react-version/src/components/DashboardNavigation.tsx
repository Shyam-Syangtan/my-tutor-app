import React from 'react';

interface DashboardNavigationProps {
  user: any;
  unreadCount: number;
  onSignOut: () => void;
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({ 
  user, 
  unreadCount, 
  onSignOut 
}) => {
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

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Messages Icon */}
            <a 
              href="/my-tutor-app/react-version/messages" 
              className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                />
              </svg>
              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </a>

            <div className="flex items-center space-x-2">
              <img 
                className="h-8 w-8 rounded-full" 
                src={getUserAvatar()} 
                alt="Profile"
              />
              <span className="text-sm font-medium text-gray-700">
                {getUserName()}
              </span>
            </div>
            <button 
              onClick={onSignOut}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavigation;
