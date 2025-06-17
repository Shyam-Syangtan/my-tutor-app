// Next.js App Component with Global Styles
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    // Handle authentication redirects
    const handleRouteChange = (url: string) => {
      console.log('App is changing to: ', url)
    }

    router.events.on('routeChangeStart', handleRouteChange)

    // Initialize authentication listener
    const initAuth = async () => {
      if (authInitialized) return

      try {
        const { supabase } = await import('../lib/supabase')

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔐 Initial session check:', session?.user?.email || 'No session')

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state change:', event, session?.user?.email || 'No session')

            if (event === 'SIGNED_IN' && session) {
              console.log('✅ User signed in, redirecting to dashboard')
              setTimeout(() => router.push('/dashboard'), 500)
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 User signed out')
              if (router.pathname !== '/' && router.pathname !== '/marketplace') {
                router.push('/')
              }
            }
          }
        )

        setAuthInitialized(true)
        return subscription
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        return null
      }
    }

    let authSubscription: any = null
    initAuth().then(subscription => {
      authSubscription = subscription
    })

    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [router, authInitialized])

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
