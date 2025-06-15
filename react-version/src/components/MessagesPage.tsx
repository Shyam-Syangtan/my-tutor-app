import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';

const MessagesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    setLoading(false);
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
          <div className="loading-spinner"></div>
          <p className="text-gray-600 mt-4">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-comments text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Messages Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              The messaging system is being converted to React. This page will include:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <i className="fas fa-chat text-blue-600 text-2xl mb-2"></i>
              <h3 className="font-semibold text-gray-900">Real-time Chat</h3>
              <p className="text-sm text-gray-600">Live messaging with tutors</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <i className="fas fa-bell text-green-600 text-2xl mb-2"></i>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Unread message alerts</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <i className="fas fa-history text-purple-600 text-2xl mb-2"></i>
              <h3 className="font-semibold text-gray-900">Chat History</h3>
              <p className="text-sm text-gray-600">Previous conversations</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-500">
              For now, you can use the contact buttons on tutor profiles to start conversations.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => navigate(ROUTES.MARKETPLACE)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Find Tutors
              </button>
              <button 
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
