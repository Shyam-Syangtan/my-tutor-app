'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingSpinner from '@/components/LoadingSpinner'
import { db } from '@/lib/supabase'

interface Tutor {
  id: string
  name: string
  language: string
  rate: number
  rating: number
  photo_url?: string
}

interface Lesson {
  id: string
  tutor_id: string
  requested_date: string
  requested_start: string
  status: string
  tutor_name?: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [topTutors, setTopTutors] = useState<Tutor[]>([])
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch top tutors
        const { data: tutors } = await db.getTutors()
        if (tutors) {
          setTopTutors(tutors.slice(0, 3))
        }

        // Fetch upcoming lessons for the user
        // This would need to be implemented based on your lessons table structure
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white-mist py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-text mb-2">
              Welcome back, {user?.user_metadata?.name || user?.email}!
            </h1>
            <p className="text-gray-600">
              Here&apos;s what&apos;s happening with your language learning journey
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/marketplace"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-text">Find Tutors</h3>
                  <p className="text-sm text-gray-600">Browse available tutors</p>
                </div>
              </div>
            </Link>

            <Link
              href="/messages"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-text">Messages</h3>
                  <p className="text-sm text-gray-600">Chat with your tutors</p>
                </div>
              </div>
            </Link>

            <Link
              href="/my-lessons"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-text">My Lessons</h3>
                  <p className="text-sm text-gray-600">View your scheduled lessons</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Top Tutors Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-dark-text">Top Rated Tutors</h2>
              <Link href="/marketplace" className="text-primary hover:underline">
                View All
              </Link>
            </div>
            
            {topTutors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topTutors.map((tutor) => (
                  <div key={tutor.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                        {tutor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-text">{tutor.name}</h3>
                        <p className="text-sm text-gray-600">{tutor.language}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        ⭐ {tutor.rating}/5
                      </span>
                      <span className="font-semibold text-primary">
                        ${tutor.rate}/hr
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No tutors available at the moment</p>
                <Link
                  href="/marketplace"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Browse Tutors
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Lessons Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-dark-text">Upcoming Lessons</h2>
              <Link href="/my-lessons" className="text-primary hover:underline">
                View All
              </Link>
            </div>
            
            {upcomingLessons.length > 0 ? (
              <div className="space-y-4">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-dark-text">
                          Lesson with {lesson.tutor_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lesson.requested_date} at {lesson.requested_start}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lesson.status === 'approved' 
                          ? 'bg-success-green/10 text-success-green'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming lessons scheduled</p>
                <Link
                  href="/marketplace"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Book a Lesson
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
