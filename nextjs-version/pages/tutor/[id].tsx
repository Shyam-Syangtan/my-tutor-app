// Dynamic Tutor Profile Pages with SSG for SEO
import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { generateMetadata, generateTutorStructuredData } from '../../lib/seo'
import { db } from '../../lib/supabase'

interface TutorProfileProps {
  tutor: any
}

export default function TutorProfile({ tutor }: TutorProfileProps) {
  if (!tutor) {
    return (
      <div className="error-page">
        <h1>Tutor not found</h1>
        <Link href="/marketplace">Back to Marketplace</Link>
      </div>
    )
  }

  const metadata = generateMetadata({
    title: `${tutor.name} - ${tutor.language} Tutor`,
    description: `Learn ${tutor.language} with ${tutor.name}. ${tutor.bio_headline || tutor.bio?.substring(0, 150)} Rated ${tutor.rating}/5 by ${tutor.total_students || 0} students. Book lessons from ₹${tutor.rate}.`,
    keywords: `${tutor.name}, ${tutor.language} tutor, ${tutor.native_language} teacher, online language lessons, Indian language tutor`,
    path: `/tutor/${tutor.id}`
  })

  const structuredData = generateTutorStructuredData(tutor)

  return (
    <>
      <Head>
        <title>{metadata.title as string}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={metadata.title as string} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://www.shyamsyangtan.com/tutor/${tutor.id}`} />
        <meta property="og:image" content={tutor.photo_url || 'https://www.shyamsyangtan.com/default-tutor.jpg'} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title as string} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={tutor.photo_url || 'https://www.shyamsyangtan.com/default-tutor.jpg'} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.shyamsyangtan.com/tutor/${tutor.id}`} />
      </Head>

      <div className="tutor-profile-page">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <Link href="/" className="nav-logo">
              IndianTutors
            </Link>
            <div className="nav-links">
              <Link href="/marketplace" className="nav-link">Find a Teacher</Link>
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <button className="btn btn-primary">Log in</button>
            </div>
          </div>
        </nav>

        {/* Profile Content */}
        <div className="tutor-profile-main">
          <div className="profile-container">
            {/* Breadcrumb */}
            <nav className="breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/marketplace">Find Tutors</Link>
              <span>/</span>
              <span>{tutor.name}</span>
            </nav>

            <div className="profile-layout">
              {/* Left Column */}
              <div className="profile-left">
                <div className="tutor-card">
                  <div className="tutor-header">
                    <img
                      src={tutor.photo_url || '/default-avatar.jpg'}
                      alt={`${tutor.name} - ${tutor.language} Tutor`}
                      className="tutor-avatar-large"
                    />
                    <div className="tutor-info">
                      <h1 className="tutor-name">{tutor.name}</h1>
                      <p className="tutor-languages">
                        Teaches: <strong>{tutor.language}</strong>
                        {tutor.native_language && (
                          <> • Native: <strong>{tutor.native_language}</strong></>
                        )}
                      </p>
                      
                      <div className="tutor-stats">
                        <div className="stat-item">
                          <span className="stat-icon">⭐</span>
                          <span className="stat-value">{tutor.rating}</span>
                          <span className="stat-label">Rating</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">👥</span>
                          <span className="stat-value">{tutor.total_students || 0}</span>
                          <span className="stat-label">Students</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">📚</span>
                          <span className="stat-value">{tutor.total_lessons || 0}</span>
                          <span className="stat-label">Lessons</span>
                        </div>
                      </div>

                      {tutor.is_professional && (
                        <div className="professional-badge">
                          <span className="badge-icon">🎓</span>
                          Professional Tutor
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pricing-section">
                    <div className="price-display">
                      <span className="price">₹{tutor.rate}</span>
                      <span className="price-unit">per lesson</span>
                    </div>
                    
                    <div className="action-buttons">
                      <button className="btn btn-primary btn-full">
                        Book Trial Lesson
                      </button>
                      <button className="btn btn-secondary btn-full">
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>

                {/* Languages Spoken */}
                {tutor.languages_spoken && (
                  <div className="languages-card">
                    <h3>Languages Spoken</h3>
                    <div className="languages-list">
                      {Array.isArray(tutor.languages_spoken) 
                        ? tutor.languages_spoken.map((lang: string, index: number) => (
                            <span key={index} className="language-tag">{lang}</span>
                          ))
                        : <span className="language-tag">{tutor.languages_spoken}</span>
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="profile-right">
                {/* Video Introduction */}
                {tutor.video_url && (
                  <div className="video-section">
                    <h2>Introduction Video</h2>
                    <div className="video-container">
                      <video
                        controls
                        poster={tutor.photo_url}
                        className="intro-video"
                      >
                        <source src={tutor.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                {/* About Section */}
                <div className="about-section">
                  <h2>About {tutor.name}</h2>
                  {tutor.bio_headline && (
                    <div className="bio-headline">
                      <h3>{tutor.bio_headline}</h3>
                    </div>
                  )}
                  {tutor.bio && (
                    <div className="bio-content">
                      <p>{tutor.bio}</p>
                    </div>
                  )}
                </div>

                {/* Teaching Specialties */}
                {tutor.tags && (
                  <div className="specialties-section">
                    <h2>Teaching Specialties</h2>
                    <div className="tags-list">
                      {Array.isArray(tutor.tags)
                        ? tutor.tags.map((tag: string, index: number) => (
                            <span key={index} className="specialty-tag">{tag}</span>
                          ))
                        : <span className="specialty-tag">{tutor.tags}</span>
                      }
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="reviews-section">
                  <h2>Student Reviews</h2>
                  <div className="reviews-summary">
                    <div className="rating-overview">
                      <span className="rating-large">{tutor.rating}</span>
                      <div className="rating-stars">
                        {'⭐'.repeat(Math.floor(tutor.rating))}
                      </div>
                      <p>{tutor.total_students || 0} student reviews</p>
                    </div>
                  </div>
                  
                  {/* Placeholder for actual reviews */}
                  <div className="reviews-list">
                    <p className="no-reviews">Reviews will be displayed here once available.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                </ul>
              </div>
              <div className="footer-section">
                <h4>Legal</h4>
                <ul>
                  <li><Link href="/privacy">Privacy Policy</Link></li>
                  <li><Link href="/terms">Terms of Service</Link></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Support</h4>
                <ul>
                  <li><Link href="/help">Help Center</Link></li>
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

// Generate static paths for all tutors
export const getStaticPaths: GetStaticPaths = async () => {
  // Return empty paths for now to avoid build errors
  // This will use fallback: 'blocking' to generate pages on demand
  return {
    paths: [],
    fallback: 'blocking' // Enable ISR for new tutors
  }
}

// Generate static props for each tutor
export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const tutorId = params?.id as string

    // For now, return a sample tutor to avoid database dependency during build
    const sampleTutor = {
      id: tutorId,
      name: 'Sample Tutor',
      language: 'Hindi',
      native_language: 'Hindi',
      rate: 500,
      rating: 4.8,
      total_students: 50,
      total_lessons: 200,
      photo_url: '/default-avatar.jpg',
      bio: 'Experienced language tutor with years of teaching experience.',
      bio_headline: 'Expert Hindi Teacher',
      languages_spoken: ['Hindi', 'English'],
      tags: ['Conversational', 'Grammar', 'Business'],
      is_professional: true
    }

    return {
      props: {
        tutor: sampleTutor
      },

    }
  } catch (error) {
    console.error('Error fetching tutor:', error)
    return {
      notFound: true
    }
  }
}
