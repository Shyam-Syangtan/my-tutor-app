// SEO Configuration and Helpers
import { Metadata } from 'next'

// Base SEO configuration
export const baseSEO = {
  title: 'IndianTutors - Learn Indian Languages with Expert Tutors',
  description: 'Connect with qualified Indian language tutors for personalized learning experiences. Learn Hindi, Tamil, Bengali, Telugu and more with certified teachers.',
  keywords: 'Indian language tutors, Hindi tutor, Tamil tutor, Bengali tutor, Telugu tutor, online language learning, Indian languages',
  author: 'IndianTutors',
  siteUrl: 'https://www.shyamsyangtan.com',
  image: '/og-image.jpg',
  twitterHandle: '@IndianTutors'
}

// Generate metadata for pages
export function generateMetadata({
  title,
  description,
  keywords,
  image,
  path = '',
  noIndex = false
}: {
  title?: string
  description?: string
  keywords?: string
  image?: string
  path?: string
  noIndex?: boolean
}): Metadata {
  const fullTitle = title ? `${title} | ${baseSEO.title}` : baseSEO.title
  const fullDescription = description || baseSEO.description
  const fullImage = image || baseSEO.image
  const fullUrl = `${baseSEO.siteUrl}${path}`

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords || baseSEO.keywords,
    authors: [{ name: baseSEO.author }],
    creator: baseSEO.author,
    publisher: baseSEO.author,
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: baseSEO.title,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: baseSEO.twitterHandle,
    },
    
    // Additional SEO
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Canonical URL
    alternates: {
      canonical: fullUrl,
    },
    
    // Verification
    verification: {
      google: 'your-google-verification-code', // Add your verification code
    },
  }
}

// Generate structured data for tutors
export function generateTutorStructuredData(tutor: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: tutor.name,
    jobTitle: 'Language Tutor',
    description: tutor.bio || tutor.bio_headline,
    image: tutor.photo_url,
    url: `${baseSEO.siteUrl}/tutor/${tutor.id}`,
    knowsLanguage: tutor.languages_spoken || [tutor.language, tutor.native_language],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: tutor.rating,
      ratingCount: tutor.total_students || 1
    },
    offers: {
      '@type': 'Offer',
      price: tutor.rate,
      priceCurrency: 'INR',
      description: `${tutor.language} language lessons`
    }
  }
}

// Generate structured data for marketplace
export function generateMarketplaceStructuredData(tutors: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: baseSEO.title,
    description: baseSEO.description,
    url: baseSEO.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseSEO.siteUrl}/marketplace?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tutors.length,
      itemListElement: tutors.map((tutor, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: generateTutorStructuredData(tutor)
      }))
    }
  }
}
