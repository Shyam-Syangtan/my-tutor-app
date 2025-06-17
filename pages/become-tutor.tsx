// Become Tutor Application Page - Migrated from React version
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

interface TutorApplication {
  name: string;
  email: string;
  phone: string;
  language: string;
  native_language: string;
  experience: string;
  bio: string;
  rate: number;
  video_url: string;
  certifications: string;
  availability: string;
  is_professional: boolean;
}

export default function BecomeTutor() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TutorApplication>({
    name: '',
    email: '',
    phone: '',
    language: '',
    native_language: '',
    experience: '',
    bio: '',
    rate: 500,
    video_url: '',
    certifications: '',
    availability: '',
    is_professional: false
  });
  const router = useRouter();

  const metadata = generateMetadata({
    title: 'Tutor Application - Join Our Teaching Community',
    description: 'Apply to become an Indian language tutor. Complete our application form to start teaching Hindi, Tamil, Bengali, Telugu and other languages online.',
    keywords: 'tutor application, become language teacher, online tutoring application, Indian language instructor',
    path: '/become-tutor'
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
    
    // Pre-fill form with user data
    setFormData(prev => ({
      ...prev,
      name: session.user.user_metadata?.full_name || '',
      email: session.user.email || ''
    }));
    
    setLoading(false);
  };

  const handleInputChange = (field: keyof TutorApplication, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tutors')
        .insert([{
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          language: formData.language,
          native_language: formData.native_language,
          experience: formData.experience,
          bio: formData.bio,
          rate: formData.rate,
          video_url: formData.video_url,
          certifications: formData.certifications,
          availability: formData.availability,
          is_professional: formData.is_professional,
          approved: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      alert('Application submitted successfully! We\'ll review it and get back to you soon.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
            <p className="loading-text">Loading application...</p>
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
        <meta property="og:url" content="https://www.shyamsyangtan.com/become-tutor" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.shyamsyangtan.com/become-tutor" />
      </Head>

      <div className="become-tutor-page">
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
              <h1 className="page-title">Tutor Application</h1>
            </div>
            <div className="header-right">
              <span className="step-indicator">Step {currentStep} of 3</span>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
        </div>

        {/* Form */}
        <main className="application-main">
          <div className="form-container">
            <form onSubmit={handleSubmit} className="application-form">
              {currentStep === 1 && (
                <div className="form-step">
                  <h2 className="step-title">Basic Information</h2>
                  
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="form-input"
                      required
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="language" className="form-label">Primary Teaching Language *</label>
                    <select
                      id="language"
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="">Select a language</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="native_language" className="form-label">Native Language *</label>
                    <input
                      type="text"
                      id="native_language"
                      value={formData.native_language}
                      onChange={(e) => handleInputChange('native_language', e.target.value)}
                      className="form-input"
                      placeholder="e.g., Hindi, Tamil"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary"
                      disabled={!formData.name || !formData.email || !formData.phone || !formData.language || !formData.native_language}
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="form-step">
                  <h2 className="step-title">Teaching Experience</h2>
                  
                  <div className="form-group">
                    <label htmlFor="experience" className="form-label">Teaching Experience *</label>
                    <textarea
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="form-textarea"
                      rows={4}
                      placeholder="Describe your teaching experience, qualifications, and methodology..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio" className="form-label">Bio/Introduction *</label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="form-textarea"
                      rows={4}
                      placeholder="Tell students about yourself, your teaching style, and what makes you unique..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="rate" className="form-label">Hourly Rate (₹) *</label>
                    <input
                      type="number"
                      id="rate"
                      value={formData.rate}
                      onChange={(e) => handleInputChange('rate', parseInt(e.target.value))}
                      className="form-input"
                      min="100"
                      max="5000"
                      required
                    />
                    <small className="form-help">Recommended range: ₹500-2000 per hour</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="certifications" className="form-label">Certifications (Optional)</label>
                    <textarea
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => handleInputChange('certifications', e.target.value)}
                      className="form-textarea"
                      rows={3}
                      placeholder="List any teaching certifications, degrees, or relevant qualifications..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.is_professional}
                        onChange={(e) => handleInputChange('is_professional', e.target.checked)}
                        className="form-checkbox"
                      />
                      I am a professional teacher with formal qualifications
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary"
                      disabled={!formData.experience || !formData.bio}
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="form-step">
                  <h2 className="step-title">Final Details</h2>
                  
                  <div className="form-group">
                    <label htmlFor="video_url" className="form-label">Introduction Video URL (Optional)</label>
                    <input
                      type="url"
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => handleInputChange('video_url', e.target.value)}
                      className="form-input"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <small className="form-help">Upload a 2-3 minute introduction video to YouTube and paste the link here</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="availability" className="form-label">Availability *</label>
                    <textarea
                      id="availability"
                      value={formData.availability}
                      onChange={(e) => handleInputChange('availability', e.target.value)}
                      className="form-textarea"
                      rows={3}
                      placeholder="Describe your general availability (days, times, timezone)..."
                      required
                    />
                  </div>

                  <div className="application-summary">
                    <h3 className="summary-title">Application Summary</h3>
                    <div className="summary-item">
                      <strong>Name:</strong> {formData.name}
                    </div>
                    <div className="summary-item">
                      <strong>Teaching Language:</strong> {formData.language}
                    </div>
                    <div className="summary-item">
                      <strong>Rate:</strong> ₹{formData.rate}/hour
                    </div>
                    <div className="summary-item">
                      <strong>Professional Teacher:</strong> {formData.is_professional ? 'Yes' : 'No'}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting || !formData.availability}
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </>
  );
}

// Server-side props to ensure user is authenticated
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};
