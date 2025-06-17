// Next.js App Component with Global Styles
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // Handle authentication redirects
    const handleRouteChange = (url: string) => {
      // Add any global route change logic here
      console.log('App is changing to: ', url)
    }

    router.events.on('routeChangeStart', handleRouteChange)

    // Handle authentication state changes
    const handleAuthStateChange = async () => {
      try {
        // Dynamic import to avoid build-time issues
        const { supabase } = await import('../lib/supabase')

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.email)

            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in, redirecting to dashboard')
              // Only redirect if we're on the landing page
              if (router.pathname === '/') {
                router.push('/dashboard')
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out, redirecting to home')
              // Only redirect if we're on a protected page
              if (router.pathname !== '/' && router.pathname !== '/marketplace') {
                router.push('/')
              }
            }
          }
        )

        return subscription
      } catch (error) {
        console.error('Auth state change error:', error)
        return null
      }
    }

    // Initialize auth listener
    let authSubscription: any = null
    handleAuthStateChange().then(subscription => {
      authSubscription = subscription
    })

    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [router])

  return (
    <>
      <Head>
        {/* Global Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00C2B3" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://qbyyutebrgpxngvwenkd.supabase.co" />
        
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Prevent FOUC */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html { visibility: hidden; opacity: 0; }
            html.loaded { visibility: visible; opacity: 1; transition: opacity 0.3s; }
          `
        }} />
      </Head>
      
      <Component {...pageProps} />
      
      {/* Load completion script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              document.documentElement.classList.add('loaded');
            });
          `
        }}
      />
    </>
  )
}
