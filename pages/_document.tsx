// Next.js Document Component for HTML Structure
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//qbyyutebrgpxngvwenkd.supabase.co" />
        
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          as="style"
        />
        
        {/* Critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS - Above the fold styles */
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1E1E1E;
              background-color: #FAFBFC;
            }
            
            .navbar {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              z-index: 1000;
              background: white;
              border-bottom: 1px solid #E5E7EB;
              height: 70px;
            }
            
            .nav-container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            
            .nav-logo {
              font-size: 1.5rem;
              font-weight: 700;
              color: #00C2B3;
              text-decoration: none;
            }
            
            .hero {
              padding-top: 120px;
              padding-bottom: 4rem;
              background: linear-gradient(135deg, #FAFBFC 0%, #F0F9FF 100%);
            }
            
            .hero-container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem;
              text-align: center;
            }
            
            .hero-title {
              font-size: 3rem;
              font-weight: 700;
              color: #1E1E1E;
              margin-bottom: 1.5rem;
              line-height: 1.2;
            }
            
            @media (max-width: 768px) {
              .hero-title {
                font-size: 2rem;
              }
            }
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
        
        {/* Google Analytics - Add your GA4 tracking ID */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID');
            `,
          }}
        />
      </body>
    </Html>
  )
}
