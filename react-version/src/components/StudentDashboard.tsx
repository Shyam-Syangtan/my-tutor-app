import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';
import DashboardNavigation from './DashboardNavigation';
import DashboardStats from './DashboardStats';
import AvailableTutors from './AvailableTutors';
import UpcomingLessons from './UpcomingLessons';
import QuickActions from './QuickActions';
import BookingModal from './BookingModal';
import Footer from './Footer';

interface Tutor {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  role: string;
}

interface Availability {
  id: string;
  tutor_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  tutor?: Tutor;
}

interface Lesson {
  id: string;
  tutor_id: string;
  student_id: string;
  lesson_date: string;
  start_time: string;
  duration: number;
  lesson_type: string;
  price: number;
  status: string;
  notes?: string;
  tutor_name?: string;
  tutor_email?: string;
}

const StudentDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
      setupUnreadCountSubscription();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }
    setUser(session.user);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTutors(),
        loadAvailability(),
        loadLessons(),
        loadUnreadMessageCount()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('role', 'tutor');

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error loading tutors:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('availability')
        .select(`
          *,
          tutor:tutor_id (
            name,
            email,
            profile_picture
          )
        `)
        .eq('is_booked', false)
        .gte('lesson_date', today)
        .order('lesson_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadLessons = async () => {
    try {
      if (!user) return;

      console.log('📚 [STUDENT] Loading lessons for student:', user.id);

      const { data: basicLessons, error: basicError } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', user.id)
        .order('lesson_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (!basicError && basicLessons) {
        // Simple approach - just use basic lesson data
        const lessonsData = basicLessons.map(lesson => ({
          ...lesson,
          tutor_name: 'Tutor', // Will be resolved later
          tutor_email: 'tutor@example.com'
        }));
        setLessons(lessonsData);
        console.log('✅ [STUDENT] Successfully loaded', lessonsData.length, 'lessons');
      } else {
        console.warn('⚠️ [STUDENT] Query failed:', basicError?.message);
        setLessons([]);
      }
    } catch (error) {
      console.error('❌ [STUDENT] Error loading lessons:', error);
      setLessons([]);
    }
  };

  const loadUnreadMessageCount = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .rpc('messaging_get_unread_count', { user_uuid: user.id });

      if (error) {
        console.warn('Could not load unread message count:', error.message);
        return;
      }

      const count = data || 0;
      setUnreadCount(count);
    } catch (error) {
      console.warn('Error loading unread message count:', error);
    }
  };

  const setupUnreadCountSubscription = () => {
    try {
      if (!user) return;

      // Subscribe to unread_messages changes for this user
      const subscription = supabase
        .channel(`unread_messages_${user.id}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'unread_messages',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('📨 [STUDENT] Unread count changed:', payload);
            loadUnreadMessageCount();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ [STUDENT] Unread count subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.log('⚠️ [STUDENT] Unread count subscription failed');
          }
        });

      console.log('✅ [STUDENT] Real-time unread count subscription setup');
    } catch (error) {
      console.warn('Error setting up unread count subscription:', error);
    }
  };

  const handleBookingClick = (availabilityItem: Availability) => {
    setSelectedAvailability(availabilityItem);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (lessonType: string, notes: string) => {
    if (!selectedAvailability || !user) return;

    try {
      const price = lessonType === 'trial' ? 10 : 25;

      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          tutor_id: selectedAvailability.tutor_id,
          student_id: user.id,
          availability_id: selectedAvailability.id,
          lesson_date: selectedAvailability.lesson_date,
          start_time: selectedAvailability.start_time,
          duration: 60,
          lesson_type: lessonType,
          price: price,
          notes: notes || null
        }])
        .select();

      if (error) throw error;

      console.log('✅ [BOOKING] Lesson booked successfully:', data);
      showNotification('Lesson booked successfully!', 'success');
      setShowBookingModal(false);
      setSelectedAvailability(null);
      await loadData();
    } catch (error) {
      console.error('❌ [BOOKING] Error booking lesson:', error);
      showNotification('Error booking lesson: ' + (error as any).message, 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate(ROUTES.LANDING);
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Failed to logout. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation 
        user={user}
        unreadCount={unreadCount}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats 
          lessons={lessons}
          availability={availability}
          tutors={tutors}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AvailableTutors 
              tutors={tutors}
              availability={availability}
              onBookingClick={handleBookingClick}
            />
          </div>

          <div className="space-y-6">
            <UpcomingLessons lessons={lessons} />
            <QuickActions />
          </div>
        </div>
      </div>

      {showBookingModal && selectedAvailability && (
        <BookingModal
          availability={selectedAvailability}
          onSubmit={handleBookingSubmit}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedAvailability(null);
          }}
        />
      )}

      {/* Footer */}
      <Footer variant="full" />
    </div>
  );
};

export default StudentDashboard;
