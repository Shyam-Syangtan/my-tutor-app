// Become Tutor Info Page - Migrated from React version
import { GetStaticProps } from 'next'
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

export default function BecomeTutorInfo() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const metadata = generateMetadata({
    title: 'Become a Tutor - Share Your Language Expertise',
    description: 'Join our community of Indian language tutors. Teach Hindi, Tamil, Bengali, Telugu and more. Flexible schedule, competitive rates, global students.',
    keywords: 'become language tutor, teach Indian languages, online tutoring jobs, Hindi teacher, Tamil teacher, language instructor',
    path: '/become-tutor-info'
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

  const handleGetStarted = () => {
    router.push('/become-tutor');
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
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
            <p className="loading-text">Loading...</p>
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
        <meta property="og:url" content="https://www.shyamsyangtan.com/become-tutor-info" />
        <meta property="og:image" content="https://www.shyamsyangtan.com/og-become-tutor.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title as string} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content="https://www.shyamsyangtan.com/og-become-tutor.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.shyamsyangtan.com/become-tutor-info" />
      </Head>

      <div className="become-tutor-info-page">
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
              <h1 className="page-title">Become a Tutor</h1>
            </div>
            <div className="header-right">
              <button
                onClick={() => router.push('/dashboard')}
                className="btn btn-secondary"
              >
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">Share Your Language Expertise</h1>
              <p className="hero-subtitle">
                Join thousands of tutors teaching Indian languages to students worldwide. 
                Set your own schedule, rates, and make a meaningful impact.
              </p>
              <button
                onClick={handleGetStarted}
                className="btn btn-primary hero-cta"
              >
                Get Started Today
              </button>
            </div>
            <div className="hero-image">
              <div className="hero-placeholder">
                <span className="hero-icon">🎓</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="benefits-section">
          <div className="section-container">
            <h2 className="section-title">Why Teach With Us?</h2>
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">💰</div>
                <h3 className="benefit-title">Competitive Earnings</h3>
                <p className="benefit-description">
                  Set your own rates and earn ₹500-2000+ per hour teaching your native language.
                </p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">⏰</div>
                <h3 className="benefit-title">Flexible Schedule</h3>
                <p className="benefit-description">
                  Teach when you want. Set your availability and work around your schedule.
                </p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🌍</div>
                <h3 className="benefit-title">Global Students</h3>
                <p className="benefit-description">
                  Connect with motivated students from around the world eager to learn.
                </p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📚</div>
                <h3 className="benefit-title">Teaching Support</h3>
                <p className="benefit-description">
                  Access teaching resources, training materials, and ongoing support.
                </p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🏆</div>
                <h3 className="benefit-title">Build Your Reputation</h3>
                <p className="benefit-description">
                  Grow your teaching profile with student reviews and ratings.
                </p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">💻</div>
                <h3 className="benefit-title">Easy Platform</h3>
                <p className="benefit-description">
                  User-friendly tools for scheduling, messaging, and conducting lessons.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="requirements-section">
          <div className="section-container">
            <h2 className="section-title">Requirements</h2>
            <div className="requirements-content">
              <div className="requirements-list">
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span className="requirement-text">Native or fluent speaker of an Indian language</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span className="requirement-text">Passion for teaching and helping others learn</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span className="requirement-text">Reliable internet connection and quiet teaching space</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span className="requirement-text">Basic computer skills and webcam</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span className="requirement-text">Teaching experience preferred but not required</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="process-section">
          <div className="section-container">
            <h2 className="section-title">How It Works</h2>
            <div className="process-steps">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3 className="step-title">Apply</h3>
                  <p className="step-description">
                    Complete our simple application form with your teaching background and language expertise.
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3 className="step-title">Review</h3>
                  <p className="step-description">
                    Our team reviews your application and may schedule a brief interview.
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3 className="step-title">Start Teaching</h3>
                  <p className="step-description">
                    Once approved, set up your profile and start accepting students!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">Ready to Start Teaching?</h2>
            <p className="cta-description">
              Join our community of passionate language tutors and start making a difference today.
            </p>
            <button
              onClick={handleGetStarted}
              className="btn btn-primary cta-button"
            >
              Apply Now
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

// Static generation for SEO
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 86400 // Revalidate once per day
  };
};
