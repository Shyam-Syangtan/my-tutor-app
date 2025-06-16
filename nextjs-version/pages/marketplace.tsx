// Marketplace Page with SSG for SEO
import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { generateMetadata, generateMarketplaceStructuredData } from '../lib/seo'
import { db } from '../lib/supabase'

interface MarketplaceProps {
  tutors: any[]
  languages: string[]
}

export default function Marketplace({ tutors, languages }: MarketplaceProps) {
  const [filteredTutors, setFilteredTutors] = useState(tutors)
  const [filters, setFilters] = useState({
    language: '',
    priceRange: '',
    searchTerm: ''
  })

  const metadata = generateMetadata({
    title: 'Find Your Perfect Language Tutor',
    description: `Browse ${tutors.length} qualified Indian language tutors. Filter by language, price, and availability. Book 1-on-1 lessons with certified teachers.`,
    keywords: 'find language tutor, Indian language teachers, online tutoring, Hindi Tamil Bengali Telugu tutors',
    path: '/marketplace'
  })

  const structuredData = generateMarketplaceStructuredData(tutors)

  // Filter tutors based on search criteria
  useEffect(() => {
    let filtered = tutors

    if (filters.language) {
      filtered = filtered.filter(tutor => 
        tutor.language?.toLowerCase().includes(filters.language.toLowerCase()) ||
        tutor.native_language?.toLowerCase().includes(filters.language.toLowerCase())
      )
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(tutor =>
        tutor.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tutor.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tutor.bio_headline?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number)
      filtered = filtered.filter(tutor => {
        if (max) {
          return tutor.rate >= min && tutor.rate <= max
        } else {
          return tutor.rate >= min
        }
      })
    }

    setFilteredTutors(filtered)
  }, [filters, tutors])

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
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
        <meta property="og:url" content="https://www.shyamsyangtan.com/marketplace" />
        <meta property="og:image" content="https://www.shyamsyangtan.com/og-marketplace.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title as string} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content="https://www.shyamsyangtan.com/og-marketplace.jpg" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.shyamsyangtan.com/marketplace" />
      </Head>

      <div className="tutor-marketplace">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <Link href="/" className="nav-logo">
              IndianTutors
            </Link>
            <div className="nav-links">
              <Link href="/marketplace" className="nav-link active">Find a Teacher</Link>
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <button className="btn btn-primary">Log in</button>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="marketplace-header">
          <h1 className="marketplace-title">Find Your Perfect Language Tutor</h1>
          <p className="marketplace-subtitle">
            Choose from <span className="tutor-count">{filteredTutors.length}</span> experienced tutors
          </p>
        </div>

        {/* Filters */}
        <div className="search-filters">
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="filter-select"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="price">Price Range</label>
              <select
                id="price"
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="filter-select"
              >
                <option value="">Any Price</option>
                <option value="0-500">₹0 - ₹500</option>
                <option value="500-1000">₹500 - ₹1000</option>
                <option value="1000-2000">₹1000 - ₹2000</option>
                <option value="2000">₹2000+</option>
              </select>
            </div>

            <div className="search-group">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="text"
                placeholder="Search tutors..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="search-input"
              />
            </div>

            <div className="clear-group">
              <button
                onClick={() => setFilters({ language: '', priceRange: '', searchTerm: '' })}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="marketplace-results">
          {filteredTutors.length === 0 ? (
            <div className="no-results">
              <h3>No tutors found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="tutors-list">
              {filteredTutors.map(tutor => (
                <div key={tutor.id} className="tutor-card-container">
                  <div className="tutor-card">
                    <div className="tutor-content">
                      <div className="tutor-left-section">
                        <div className="tutor-header">
                          <img
                            src={tutor.photo_url || '/default-avatar.jpg'}
                            alt={tutor.name}
                            className="tutor-avatar"
                            loading="lazy"
                          />
                          <div className="tutor-info">
                            <h3 className="tutor-name">{tutor.name}</h3>
                            <p className="tutor-language">
                              {tutor.language} • {tutor.native_language}
                            </p>
                            <div className="tutor-stats">
                              <span className="rating">
                                ⭐ {tutor.rating}
                              </span>
                              <span className="students">
                                👥 {tutor.total_students || 0} students
                              </span>
                              <span className="lessons">
                                📚 {tutor.total_lessons || 0} lessons
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="tutor-bio">
                          <p>{tutor.bio_headline || tutor.bio?.substring(0, 150) + '...'}</p>
                        </div>
                      </div>

                      <div className="tutor-right-section">
                        <div className="tutor-pricing">
                          <span className="price">₹{tutor.rate}</span>
                          <span className="price-unit">per lesson</span>
                        </div>
                        
                        <div className="tutor-actions">
                          <Link
                            href={`/tutor/${tutor.id}`}
                            className="btn btn-secondary"
                          >
                            View Profile
                          </Link>
                          <button className="btn btn-primary">
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

// Static Site Generation for SEO
export const getStaticProps: GetStaticProps = async () => {
  try {
    // Fetch tutors data for SEO
    const { data: tutors } = await db.getTutors()
    
    // Extract unique languages
    const languages = Array.from(new Set(
      tutors?.flatMap(tutor => [tutor.language, tutor.native_language].filter(Boolean)) || []
    )).sort()
    
    return {
      props: {
        tutors: tutors || [],
        languages
      },
      // Revalidate every 30 minutes
      revalidate: 1800
    }
  } catch (error) {
    console.error('Error fetching tutors for marketplace:', error)
    return {
      props: {
        tutors: [],
        languages: []
      },
      revalidate: 1800
    }
  }
}
