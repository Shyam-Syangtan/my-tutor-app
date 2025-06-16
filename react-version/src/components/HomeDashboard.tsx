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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-teal-600">IndianTutors</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(ROUTES.MARKETPLACE)}
                className="text-gray-600 hover:text-teal-600 transition-colors"
              >
                Find a Teacher
              </button>
              <button
                onClick={() => navigate(ROUTES.MESSAGES)}
                className="text-gray-600 hover:text-teal-600 transition-colors"
              >
                Messages
              </button>
              <div className="flex items-center space-x-2">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700">{userName}</span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-red-600 transition-colors ml-4"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600">Continue your language learning journey</p>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
            <div className="flex items-center space-x-4">
              <img
                src={userAvatar}
                alt={userName}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{userName}</h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-600">7</div>
                    <div className="text-sm text-gray-500">Week streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-600">24</div>
                    <div className="text-sm text-gray-500">Total hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-600">85</div>
                    <div className="text-sm text-gray-500">Knowledge score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Lessons Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Lessons</h3>
              <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{lesson.date}</div>
                      <div className="text-sm text-gray-500">{lesson.time}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{lesson.language}</div>
                      <div className="text-sm text-gray-500">{lesson.duration} min</div>
                    </div>
                  </div>
                  <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    Join
                  </button>
                </div>
              ))}
              {lessons.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">No upcoming lessons</p>
                  <button
                    onClick={() => navigate(ROUTES.MARKETPLACE)}
                    className="mt-2 text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Book a lesson
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Teachers Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Teachers</h2>
            <button
              onClick={() => navigate(ROUTES.MARKETPLACE)}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={teacher.avatar_url}
                    alt={teacher.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{teacher.name}</h4>
                    <p className="text-sm text-gray-500">{teacher.language}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium text-gray-900">{teacher.rating}</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{teacher.rate}/hour</span>
                </div>
                <button className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors">
                  Book
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomeDashboard;
