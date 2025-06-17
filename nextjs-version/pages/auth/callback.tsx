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
        
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📊 Callback session:', { session: !!session, error })
        
        if (error) {
          console.error('❌ Auth callback error:', error)
          // Redirect to home with error
          router.push('/?error=auth_failed')
          return
        }

        if (session) {
          console.log('✅ Authentication successful!')
          console.log('👤 User:', session.user.email)
          
          // Redirect to dashboard
          console.log('🚀 Redirecting to dashboard...')
          router.push('/dashboard')
        } else {
          console.log('⚠️ No session found in callback')
          // Redirect to home
          router.push('/')
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
