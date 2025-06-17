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

  console.log('🔥 LoginModal render - isOpen:', isOpen)

  if (!isOpen) {
    console.log('🔥 LoginModal not open, returning null')
    return null
  }

  console.log('🔥 LoginModal is open, rendering modal')

  // Add a test to make sure we're actually rendering
  console.log('🔥 About to render modal JSX')

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: '28rem',
        width: '100%',
        margin: '0 1rem',
        border: '5px solid red' // Temporary debug border
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Sign in to IndianTutors
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#9ca3af',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#6b7280'}
            onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '1.5rem',
            margin: '0 0 1.5rem 0'
          }}>
            Connect with qualified tutors and start your learning journey
          </p>

          {/* Google Login Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#3367d6'
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#4285F4'
                }
              }}
              title="Continue with Google"
            >
              {isLoading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>

          {/* Google Login Instruction */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '6px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#1e40af',
              textAlign: 'center',
              margin: 0
            }}>
              <strong>Click the button above</strong> to sign in with your Google account
            </p>
          </div>
        </div>
      </div>

      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
