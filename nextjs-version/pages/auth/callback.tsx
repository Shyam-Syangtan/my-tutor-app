import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...')

        // Dynamic import to avoid build-time issues
        const { supabase } = await import('../../lib/supabase')

        // Handle the auth callback from URL
        const { data, error } = await supabase.auth.getSession()

        console.log('📊 Callback session:', { session: !!data.session, error })

        if (error) {
          console.error('❌ Auth callback error:', error)
          // Redirect to home with error
          router.push('/?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('✅ Authentication successful!')
          console.log('👤 User:', data.session.user.email)

          // Small delay to ensure session is fully established
          setTimeout(() => {
            console.log('🚀 Redirecting to dashboard...')
            router.push('/dashboard')
          }, 1000)
        } else {
          console.log('⚠️ No session found in callback, checking URL hash...')

          // Try to get session from URL hash (for OAuth flow)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')

          if (accessToken) {
            console.log('🔑 Found access token in URL, waiting for session...')
            // Wait a bit for Supabase to process the session
            setTimeout(async () => {
              const { data: sessionData } = await supabase.auth.getSession()
              if (sessionData.session) {
                console.log('✅ Session established after delay')
                router.push('/dashboard')
              } else {
                console.log('❌ Still no session after delay')
                router.push('/?error=session_failed')
              }
            }, 2000)
          } else {
            console.log('❌ No access token found, redirecting home')
            router.push('/')
          }
        }
      } catch (error) {
        console.error('💥 Callback processing error:', error)
        router.push('/?error=callback_failed')
      }
    }

    // Only run on client side
    if (typeof window !== 'undefined') {
      handleAuthCallback()
    }
  }, [router])

  return (
    <>
      <Head>
        <title>Authenticating... - IndianTutors</title>
        <meta name="description" content="Processing authentication" />
      </Head>
      
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#00C2B3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Completing sign in...
          </h1>
          <p className="text-gray-600">
            Please wait while we finish setting up your account.
          </p>
        </div>
      </div>
    </>
  )
}
