import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          router.push('/')
          return
        }

        if (!session) {
          console.log('No session found, redirecting to home')
          router.push('/')
          return
        }

        setUser(session.user)
        setLoading(false)
      } catch (error) {
        console.error('Dashboard auth check error:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('../lib/supabase')
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#00C2B3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Dashboard - IndianTutors</title>
        <meta name="description" content="Your learning dashboard" />
      </Head>

      <div className="min-h-screen bg-[#FAFBFC]">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-xl font-bold text-[#00C2B3]">
                IndianTutors
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link href="/marketplace" className="text-gray-700 hover:text-[#00C2B3]">
                  Find Tutors
                </Link>
                <div className="flex items-center space-x-2">
                  <img
                    src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-gray-700">{user?.user_metadata?.full_name || user?.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-red-600 ml-2"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.full_name || 'Student'}!
              </h1>
              <p className="text-gray-600 mt-2">
                Continue your learning journey with our qualified tutors
              </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Find Tutors Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#00C2B3] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Find Tutors</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Browse our marketplace to find the perfect tutor for your learning goals
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center px-4 py-2 bg-[#00C2B3] text-white rounded-md hover:bg-[#00A693] transition-colors"
                >
                  Browse Tutors
                </Link>
              </div>

              {/* My Lessons Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">My Lessons</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  View your upcoming lessons and learning progress
                </p>
                <button className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  View Lessons
                </button>
              </div>

              {/* Profile Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">My Profile</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Manage your account settings and preferences
                </p>
                <button className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center py-8">
                  No recent activity. Start by finding a tutor!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
