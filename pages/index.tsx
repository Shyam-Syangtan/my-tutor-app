// Landing Page with SSG for SEO
import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { generateMetadata, generateMarketplaceStructuredData } from '../lib/seo'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'

interface LandingPageProps {
  tutors: any[]
  tutorCount: number
}

export default function LandingPage({ tutors, tutorCount }: LandingPageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const router = useRouter()

  // Test if React is working
  useEffect(() => {
    console.log('React component mounted successfully!')
    console.log('Tutors data:', tutors)
    console.log('Tutor count:', tutorCount)
  }, [])

  // Simple test function first
  const testClick = () => {
    alert('TEST: Button is working!')
    console.log('TEST: Button clicked successfully')
  }

  const handleGoogleLogin = async () => {
    console.log('Google login button clicked!')
    alert('Button clicked! Check console for details.')

    try {
      console.log('Attempting Supabase OAuth...')
      console.log('Supabase client:', supabase)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      console.log('OAuth response:', { data, error })

      if (error) {
        console.error('Login error:', error)
        alert(`Login failed: ${error.message}`)
      } else {
        console.log('OAuth initiated successfully')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert(`Login failed: ${error}`)
    }
  }

  const metadata = generateMetadata({
    title: 'Learn Indian Languages with Expert Tutors',
    description: `Connect with ${tutorCount}+ qualified Indian language tutors. Learn Hindi, Tamil, Bengali, Telugu and more with certified teachers. 1-on-1 video lessons, flexible schedules.`,
    keywords: 'Indian language tutors, Hindi tutor, Tamil tutor, Bengali tutor, online language learning, certified teachers',
    path: '/'
  })

  const structuredData = generateMarketplaceStructuredData(tutors.slice(0, 10))

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
        <meta property="og:url" content="https://www.shyamsyangtan.com/" />
        <meta property="og:image" content="https://www.shyamsyangtan.com/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title as string} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content="https://www.shyamsyangtan.com/og-image.jpg" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.shyamsyangtan.com/" />
      </Head>

      <div className="landing-page">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <Link href="/" className="nav-logo">
              IndianTutors
            </Link>
            <div className="nav-links">
              <Link href="/marketplace" className="nav-link">Find a Teacher</Link>
              <button
                className="btn btn-primary"
                onClick={testClick}
              >
                Log in
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <h1 className="hero-title">Become fluent in any Indian language</h1>
            <ul className="hero-features">
              <li>
                <span className="feature-icon">📹</span>
                1-on-1 video lessons
              </li>
              <li>
                <span className="feature-icon">🎓</span>
                {tutorCount}+ certified tutors
              </li>
              <li>
                <span className="feature-icon">⏰</span>
                Flexible schedules and prices
              </li>
            </ul>
            <button
              className="btn btn-primary cta-button"
              onClick={testClick}
            >
              <span className="google-icon">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </span>
              Continue with Google
            </button>
          </div>
        </section>

        {/* Languages Section */}
        <section className="languages">
          <div className="languages-container">
            <h2 className="languages-title">Popular Indian Languages</h2>
            <div className="languages-grid">
              <div className="language-pill">
                <span className="language-name">Hindi</span>
                <span className="tutor-count">1,247 tutors</span>
              </div>
              <div className="language-pill">
                <span className="language-name">Tamil</span>
                <span className="tutor-count">892 tutors</span>
              </div>
              <div className="language-pill">
                <span className="language-name">Bengali</span>
                <span className="tutor-count">634 tutors</span>
              </div>
              <div className="language-pill">
                <span className="language-name">Telugu</span>
                <span className="tutor-count">567 tutors</span>
              </div>
              <div className="language-pill">
                <span className="language-name">Marathi</span>
                <span className="tutor-count">423 tutors</span>
              </div>
              <div className="language-pill">
                <span className="language-name">Gujarati</span>
                <span className="tutor-count">389 tutors</span>
              </div>
              <div className="language-pill">
                <span className="language-name">Punjabi</span>
                <span className="tutor-count">312 tutors</span>
              </div>
              <div className="language-pill">
                <span className="language-name">Kannada</span>
                <span className="tutor-count">298 tutors</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta">
          <div className="cta-container">
            <h2 className="cta-title">Start learning today</h2>
            <p className="cta-description">
              Join thousands of students learning Indian languages with our certified tutors
            </p>
            <Link href="/marketplace" className="btn btn-primary cta-button">
              Browse Tutors
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>IndianTutors</h3>
                <p>Connect with qualified tutors for personalized learning experiences.</p>
              </div>
              <div className="footer-section">
                <h4>Company</h4>
                <ul>
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/contact">Contact Us</Link></li>
                  <li><Link href="/careers">Careers</Link></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Legal</h4>
                <ul>
                  <li><Link href="/privacy">Privacy Policy</Link></li>
                  <li><Link href="/terms">Terms of Service</Link></li>
                  <li><Link href="/cookies">Cookie Policy</Link></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Support</h4>
                <ul>
                  <li><Link href="/help">Help Center</Link></li>
                  <li><Link href="/community">Community Guidelines</Link></li>
                  <li><Link href="/safety">Safety</Link></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2025 IndianTutors. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

// Static Site Generation for SEO
export const getStaticProps: GetStaticProps = async () => {
  try {
    // Fetch tutors data for SEO
    const { data: tutors } = await db.getTutors()
    
    return {
      props: {
        tutors: tutors || [],
        tutorCount: tutors?.length || 0
      }
    }
  } catch (error) {
    console.error('Error fetching tutors for landing page:', error)
    return {
      props: {
        tutors: [],
        tutorCount: 0
      }
    }
  }
}
