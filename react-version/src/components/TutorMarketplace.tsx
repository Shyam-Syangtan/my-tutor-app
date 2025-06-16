import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../constants/routes';
import TutorCard from './TutorCard';
import SearchFilters from './SearchFilters';
import LoadingSpinner from './LoadingSpinner';
import Header from './Header';
import Footer from './Footer';

interface Tutor {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  bio_headline?: string;
  rate: number;
  rating: number;
  photo_url?: string;
  native_language?: string;
  language?: string;
  languages_spoken?: any;
  tags?: any;
  country_flag?: string;
  total_students?: number;
  total_lessons?: number;
  is_professional?: boolean;
  approved: boolean;
  video_url?: string;
}

interface FilterState {
  language: string;
  priceRange: string;
  searchTerm: string;
}

const TutorMarketplace: React.FC = () => {
  const [allTutors, setAllTutors] = useState<Tutor[]>([]);
  const navigate = useNavigate();
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tutorStatus, setTutorStatus] = useState<{
    hasApplication: boolean;
    isApproved: boolean;
    applicationData?: any;
  }>({ hasApplication: false, isApproved: false });
  const [filters, setFilters] = useState<FilterState>({
    language: '',
    priceRange: '',
    searchTerm: ''
  });

  // Sticky video card state - only one video card visible at a time
  const [activeVideoTutorId, setActiveVideoTutorId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadTutors();
  }, []);

  useEffect(() => {
    if (user) {
      checkTutorStatus();
    }
  }, [user]);

  useEffect(() => {
    filterTutors();
  }, [filters, allTutors]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(ROUTES.LANDING);
      return;
    }
    setUser(session.user);
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate(ROUTES.LANDING);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadTutors = async () => {
    try {
      console.log('🔍 Loading tutors from database...');

      // Try to load tutors with error handling
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('approved', true)
        .order('rating', { ascending: false });

      if (error) {
        console.error('❌ Database error loading tutors:', error);

        // Try a simpler query without the approved filter
        console.log('🔄 Trying simpler query...');
        const { data: allData, error: simpleError } = await supabase
          .from('tutors')
          .select('*')
          .limit(10);

        if (simpleError) {
          throw simpleError;
        }

        // Filter approved tutors client-side
        const approvedTutors = (allData || []).filter(tutor => tutor.approved === true);
        setAllTutors(approvedTutors);
        console.log('✅ Loaded tutors with fallback method:', approvedTutors.length);
      } else {
        setAllTutors(data || []);
        console.log('✅ Loaded tutors successfully:', data?.length || 0);

        // Enhanced debug video URLs
        const tutorsWithVideos = (data || []).filter(tutor => tutor.video_url);
        console.log('🎬 Tutors with video URLs:', tutorsWithVideos.length);
        console.log('📊 Total tutors loaded:', data?.length || 0);

        // Detailed video URL debugging
        tutorsWithVideos.forEach(tutor => {
          console.log(`📹 ${tutor.name}:`, {
            video_url: tutor.video_url,
            id: tutor.id,
            approved: tutor.approved
          });
        });

        // Check for tutors without videos
        const tutorsWithoutVideos = (data || []).filter(tutor => !tutor.video_url);
        console.log('❌ Tutors without video URLs:', tutorsWithoutVideos.length);

        // Log all tutor data for debugging
        console.log('🔍 All tutor data:', data?.map(tutor => ({
          name: tutor.name,
          id: tutor.id,
          video_url: tutor.video_url,
          approved: tutor.approved
        })));
      }

    } catch (error) {
      console.error('❌ Error loading tutors:', error);
      showError(`Failed to load tutors: ${(error as any).message}. Please refresh the page or try again later.`);
      setAllTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTutors = () => {
    let filtered = allTutors.filter(tutor => {
      // Language filter - check native_language or language field
      if (filters.language && (tutor.native_language || tutor.language) !== filters.language) {
        return false;
      }

      // Price filter
      if (filters.priceRange) {
        const rate = tutor.rate;
        if (filters.priceRange === '0-300' && (rate < 0 || rate > 300)) return false;
        if (filters.priceRange === '300-500' && (rate < 300 || rate > 500)) return false;
        if (filters.priceRange === '500-800' && (rate < 500 || rate > 800)) return false;
        if (filters.priceRange === '800-1200' && (rate < 800 || rate > 1200)) return false;
        if (filters.priceRange === '1200+' && rate < 1200) return false;
      }

      // Search filter - search in name and bio
      if (filters.searchTerm) {
        const searchableText = `${tutor.name} ${tutor.bio || ''} ${tutor.bio_headline || ''}`.toLowerCase();
        if (!searchableText.includes(filters.searchTerm.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    setFilteredTutors(filtered);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      language: '',
      priceRange: '',
      searchTerm: ''
    });
  };

  const showError = (message: string) => {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
  };

  const contactTeacher = async (tutorUserId: string, tutorName: string) => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to contact teachers');
        navigate(ROUTES.LANDING);
        return;
      }

      // Navigate to messages page with tutor parameter to create conversation
      navigate(`${ROUTES.MESSAGES}?tutor=${tutorUserId}`);

    } catch (error) {
      console.error('Error contacting teacher:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const viewTutorProfile = (tutorId: string) => {
    navigate(`/tutor/${tutorId}`);
  };

  // Sticky video card handlers - italki-style behavior
  const handleTutorHover = (tutorId: string) => {
    // Only change if hovering over a different tutor
    if (activeVideoTutorId !== tutorId) {
      setActiveVideoTutorId(tutorId);
    }
  };

  const handleTutorLeave = (tutorId: string) => {
    // Don't close video card on mouse leave - keep it sticky
    // Video card only changes when hovering over a different tutor
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="tutor-marketplace">
      <Header
        user={user}
        onSignOut={handleSignOut}
        unreadCount={0}
        tutorStatus={tutorStatus}
      />

      {/* Header */}
      <div className="marketplace-header">
        <h1 className="marketplace-title">Find Your Perfect Language Tutor</h1>
        <p className="marketplace-subtitle">
          Choose from <span className="tutor-count">{filteredTutors.length}</span> experienced tutors
        </p>
      </div>

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Results */}
      <div className="marketplace-results">
        {filteredTutors.length === 0 ? (
          <div className="no-results">
            <svg className="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"></path>
            </svg>
            <h3 className="no-results-title">No tutors found</h3>
            <p className="no-results-text">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="tutors-list">
            {filteredTutors.map(tutor => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                onContact={contactTeacher}
                onViewProfile={viewTutorProfile}
                onHover={handleTutorHover}
                onLeave={handleTutorLeave}
                isVideoActive={activeVideoTutorId === tutor.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TutorMarketplace;
