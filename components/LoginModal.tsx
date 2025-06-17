import { useState, useEffect } from 'react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

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

  const showSuccessMessage = (message: string) => {
    const successDiv = document.createElement('div')
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #38B000;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: Inter, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    successDiv.textContent = message
    document.body.appendChild(successDiv)

    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv)
      }
    }, 3000)
  }

  const showErrorMessage = (message: string) => {
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #DC2626;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: Inter, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    errorDiv.textContent = message
    document.body.appendChild(errorDiv)

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv)
      }
    }, 5000)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to IndianTutors!</h2>
          <p className="text-sm text-gray-600">
            By logging in or creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="px-8 pb-6">
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

            {/* Disabled social buttons for visual consistency */}
            <button
              disabled
              className="flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 opacity-30 cursor-not-allowed"
              title="Facebook (Coming Soon)"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            <button
              disabled
              className="flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 opacity-30 cursor-not-allowed"
              title="Apple (Coming Soon)"
            >
              <svg className="w-5 h-5" fill="#000" viewBox="0 0 24 24">
                <path d="M12.017 0C8.396 0 8.025.044 6.979.207 5.934.37 5.226.648 4.61 1.014c-.616.366-1.138.854-1.504 1.47C2.74 3.1 2.462 3.808 2.299 4.854 2.136 5.9 2.092 6.271 2.092 9.892s.044 3.992.207 5.038c.163 1.046.441 1.754.807 2.37.366.616.854 1.138 1.47 1.504.616.366 1.324.644 2.37.807 1.046.163 1.417.207 5.038.207s3.992-.044 5.038-.207c1.046-.163 1.754-.441 2.37-.807.616-.366 1.138-.854 1.504-1.47.366-.616.644-1.324.807-2.37.163-1.046.207-1.417.207-5.038s-.044-3.992-.207-5.038c-.163-1.046-.441-1.754-.807-2.37-.366-.616-.854-1.138-1.47-1.504C18.754 2.74 18.046 2.462 17 2.299 15.954 2.136 15.583 2.092 11.962 2.092H12.017z"/>
              </svg>
            </button>

            <button
              disabled
              className="flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 opacity-30 cursor-not-allowed"
              title="VK (Coming Soon)"
            >
              <svg className="w-5 h-5" fill="#4C75A3" viewBox="0 0 24 24">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0z"/>
              </svg>
            </button>

            <button
              disabled
              className="flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 opacity-30 cursor-not-allowed"
              title="Line (Coming Soon)"
            >
              <svg className="w-5 h-5" fill="#00C300" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771z"/>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Email/Phone Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button className="flex-1 py-2 px-4 text-sm font-medium text-red-500 border-b-2 border-red-500">
              Email
            </button>
            <button className="flex-1 py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
              Phone
            </button>
          </div>

          {/* Email Form (Disabled) */}
          <div className="space-y-4 opacity-50">
            <input
              type="email"
              placeholder="Email"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" disabled className="mr-2 disabled:cursor-not-allowed" />
                <span className="text-gray-500">Keep me logged in</span>
              </label>
              <a href="#" className="text-gray-400 hover:text-gray-600">Forgot password?</a>
            </div>

            <button
              disabled
              className="w-full bg-red-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Log in
            </button>

            <div className="text-center text-sm text-gray-500">
              No account yet?{' '}
              <button disabled className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed">
                Sign up
              </button>
            </div>
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
