// Book Lesson Page - Migrated from React version
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

interface Tutor {
  id: string;
  name: string;
  language: string;
  rate: number;
  rating: number;
  bio: string;
  photo_url: string;
}

interface BookLessonProps {
  tutor: Tutor | null;
}

export default function BookLesson({ tutor }: BookLessonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { tutorId } = router.query;

  const metadata = generateMetadata({
    title: `Book Lesson${tutor ? ` with ${tutor.name}` : ''} - Indian Language Learning`,
    description: `Book a personalized ${tutor?.language || 'Indian language'} lesson${tutor ? ` with ${tutor.name}` : ''}. Flexible scheduling, competitive rates, expert instruction.`,
    keywords: `book lesson, ${tutor?.language || 'Indian language'} lesson, online tutoring, language learning booking`,
    path: '/book-lesson'
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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tutor || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .insert([{
          tutor_id: tutor.id,
          student_id: user.id,
          requested_date: selectedDate,
          requested_start: selectedTime,
          requested_end: calculateEndTime(selectedTime, duration),
          status: 'pending',
          student_message: message,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      alert('Lesson request sent successfully! The tutor will respond soon.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error booking lesson:', error);
      alert('Error booking lesson. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const calculateTotal = () => {
    if (!tutor) return 0;
    return Math.round((tutor.rate * duration) / 60);
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
            <p className="loading-text">Loading booking form...</p>
          </div>
        </div>
      </>
    );
  }

  if (!tutor) {
    return (
      <>
        <Head>
          <title>Tutor Not Found - Book Lesson</title>
          <meta name="description" content="The requested tutor could not be found" />
        </Head>
        <div className="error-page">
          <div className="error-content">
            <h1 className="error-title">Tutor Not Found</h1>
            <p className="error-description">
              The tutor you're looking for could not be found.
            </p>
            <button
              onClick={() => router.push('/marketplace')}
              className="btn btn-primary"
            >
              Browse Tutors
            </button>
          </div>
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
        <meta property="og:url" content={`https://www.shyamsyangtan.com/book-lesson?tutorId=${tutorId}`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.shyamsyangtan.com/book-lesson?tutorId=${tutorId}`} />
      </Head>

      <div className="book-lesson-page">
        {/* Header */}
        <header className="page-header">
          <div className="header-container">
            <div className="header-left">
              <button
                onClick={() => router.back()}
                className="back-btn"
              >
                ← Back
              </button>
              <h1 className="page-title">Book a Lesson</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="booking-main">
          <div className="booking-container">
            {/* Tutor Info */}
            <div className="tutor-info-card">
              <div className="tutor-header">
                <img
                  src={tutor.photo_url}
                  alt={tutor.name}
                  className="tutor-avatar"
                />
                <div className="tutor-details">
                  <h2 className="tutor-name">{tutor.name}</h2>
                  <p className="tutor-language">{tutor.language} Teacher</p>
                  <div className="tutor-rating">
                    <span className="star-icon">★</span>
                    <span className="rating-value">{tutor.rating}</span>
                  </div>
                  <div className="tutor-rate">₹{tutor.rate}/hour</div>
                </div>
              </div>
              <div className="tutor-bio">
                <p>{tutor.bio}</p>
              </div>
            </div>

            {/* Booking Form */}
            <div className="booking-form-card">
              <h3 className="form-title">Schedule Your Lesson</h3>
              
              <form onSubmit={handleSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="date" className="form-label">Select Date *</label>
                  <select
                    id="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Choose a date</option>
                    {generateDateOptions().map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="time" className="form-label">Select Time *</label>
                  <select
                    id="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Choose a time</option>
                    {generateTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <small className="form-help">Times shown in your local timezone</small>
                </div>

                <div className="form-group">
                  <label htmlFor="duration" className="form-label">Lesson Duration *</label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="form-select"
                    required
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">Message to Tutor (Optional)</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="form-textarea"
                    rows={4}
                    placeholder="Tell your tutor about your learning goals, current level, or any specific topics you'd like to focus on..."
                  />
                </div>

                {/* Booking Summary */}
                <div className="booking-summary">
                  <h4 className="summary-title">Booking Summary</h4>
                  <div className="summary-item">
                    <span className="summary-label">Tutor:</span>
                    <span className="summary-value">{tutor.name}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Language:</span>
                    <span className="summary-value">{tutor.language}</span>
                  </div>
                  {selectedDate && (
                    <div className="summary-item">
                      <span className="summary-label">Date:</span>
                      <span className="summary-value">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="summary-item">
                      <span className="summary-label">Time:</span>
                      <span className="summary-value">{selectedTime} - {calculateEndTime(selectedTime, duration)}</span>
                    </div>
                  )}
                  <div className="summary-item">
                    <span className="summary-label">Duration:</span>
                    <span className="summary-value">{duration} minutes</span>
                  </div>
                  <div className="summary-item total">
                    <span className="summary-label">Total:</span>
                    <span className="summary-value">₹{calculateTotal()}</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || !selectedDate || !selectedTime}
                  >
                    {submitting ? 'Sending Request...' : 'Request Lesson'}
                  </button>
                </div>
              </form>

              <div className="booking-note">
                <p className="note-text">
                  <strong>Note:</strong> This is a lesson request. The tutor will review and confirm your booking. 
                  You'll receive a notification once they respond.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// Server-side props to fetch tutor data
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { tutorId } = context.query;

  if (!tutorId) {
    return {
      props: {
        tutor: null
      }
    };
  }

  try {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', tutorId)
      .eq('approved', true)
      .single();

    if (error || !data) {
      return {
        props: {
          tutor: null
        }
      };
    }

    const tutor: Tutor = {
      id: data.id,
      name: data.name,
      language: data.language,
      rate: data.rate,
      rating: data.rating || 4.5,
      bio: data.bio,
      photo_url: data.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6366f1&color=fff`
    };

    return {
      props: {
        tutor
      }
    };
  } catch (error) {
    console.error('Error fetching tutor for booking:', error);
    return {
      props: {
        tutor: null
      }
    };
  }
};
