import React, { useState } from 'react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  showSuccessMessage: (message: string) => void
  showErrorMessage: (message: string) => void
}

export default function LoginModal({ 
  isOpen, 
  onClose, 
  showSuccessMessage, 
  showErrorMessage 
}: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    console.log('🚀 Initiating Google OAuth login...')

    try {
      // Dynamic import to avoid build-time issues
      const { supabase } = await import('../lib/supabase')

      console.log('📡 Calling Supabase OAuth with redirect:', `${window.location.origin}/dashboard`)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      console.log('📊 OAuth response:', { data, error })

      if (error) {
        console.error('❌ Supabase OAuth error:', error)
        showErrorMessage('Login failed: ' + error.message)
        setIsLoading(false)
      } else {
        console.log('✅ Google OAuth initiated successfully!')
        console.log('🔗 OAuth URL:', data?.url)

        // Close modal and show success message
        onClose()
        showSuccessMessage('Opening Google login...')

        // The browser should automatically redirect to Google
        // Don't set loading to false here as we're redirecting
      }
    } catch (error) {
      console.error('💥 Login error:', error)
      showErrorMessage('Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Sign in to IndianTutors
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">
            Connect with qualified tutors and start your learning journey
          </p>

          {/* Social Login Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-12 h-12 rounded-full border border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Continue with Google"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Google Login Instruction */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 text-center">
              <strong>Click the Google button above</strong> to sign in with your Google account
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
