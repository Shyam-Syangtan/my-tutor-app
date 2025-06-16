import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';
import Footer from './Footer';

const ProfilePage: React.FC = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Profile</h1>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <img 
                src={getUserAvatar()}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-white"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{getUserName()}</h2>
                <p className="text-blue-100">{user?.email}</p>
                <span className="inline-block bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm mt-2">
                  Student
                </span>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{getUserName()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Type</label>
                    <p className="text-gray-900">Student</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-gray-900">
                      {new Date(user?.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Learning Preferences */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Preferences</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Languages</label>
                    <p className="text-gray-500">Not set</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Learning Goals</label>
                    <p className="text-gray-500">Not set</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Skill Level</label>
                    <p className="text-gray-500">Not set</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Schedule</label>
                    <p className="text-gray-500">Not set</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
              <i className="fas fa-tools text-blue-600 text-3xl mb-3"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Editing Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                We're working on adding profile editing features. Soon you'll be able to:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <i className="fas fa-edit text-blue-600 text-xl mb-2"></i>
                  <p className="text-sm text-gray-600">Edit personal information</p>
                </div>
                <div className="text-center">
                  <i className="fas fa-language text-blue-600 text-xl mb-2"></i>
                  <p className="text-sm text-gray-600">Set learning preferences</p>
                </div>
                <div className="text-center">
                  <i className="fas fa-camera text-blue-600 text-xl mb-2"></i>
                  <p className="text-sm text-gray-600">Upload profile picture</p>
                </div>
              </div>
              <button 
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfilePage;
