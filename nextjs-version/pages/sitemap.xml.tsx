// Dynamic Sitemap Generation for SEO
import { GetServerSideProps } from 'next'
import { db } from '../lib/supabase'

// This component doesn't render anything - it just generates the sitemap
function Sitemap() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.shyamsyangtan.com'
  
  try {
    // Get all approved tutors for sitemap
    const { data: tutors } = await db.getTutors()
    
    // Static pages
    const staticPages = [
      '',
      '/marketplace',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/help'
    ]
    
    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'daily' : page === '/marketplace' ? 'hourly' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : page === '/marketplace' ? '0.9' : '0.7'}</priority>
  </url>`
    )
    .join('')}
  ${tutors
    ?.map(
      (tutor) => `
  <url>
    <loc>${baseUrl}/tutor/${tutor.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('') || ''}
</urlset>`

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
    res.write(sitemap)
    res.end()

    return {
      props: {}
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Fallback sitemap with just static pages
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('')}
</urlset>`

    res.setHeader('Content-Type', 'text/xml')
    res.write(fallbackSitemap)
    res.end()

    return {
      props: {}
    }
  }
}

export default Sitemap
