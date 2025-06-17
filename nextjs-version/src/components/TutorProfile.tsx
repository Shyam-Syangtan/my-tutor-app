'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import BookingModal from './BookingModal'

interface TutorProfileProps {
  tutor: {
    id: string
    name: string
    language: string
    rate: number
    rating: number
    photo_url?: string
    bio?: string
    specialties?: string[]
    video_url?: string
    experience?: string
    education?: string
    certifications?: string[]
    availability?: string[]
  }
}

export default function TutorProfile({ tutor }: TutorProfileProps) {
  const { user } = useAuth()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-white-mist py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-primary hover:underline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
              {/* Left Column - Profile Info */}
              <div className="flex-1">
                <div className="flex items-start space-x-6 mb-6">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {tutor.photo_url ? (
                      <img
                        src={tutor.photo_url}
                        alt={tutor.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-semibold">
                        {tutor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-dark-text mb-2">
                      {tutor.name}
                    </h1>
                    <p className="text-xl text-primary font-medium mb-2">
                      {tutor.language} Tutor
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="flex items-center text-gray-600">
                        ⭐ {tutor.rating}/5
                      </span>
                      <span className="text-2xl font-bold text-dark-text">
                        ${tutor.rate}/hour
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    {user && (
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setShowBookingModal(true)}
                          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Book Lesson
                        </button>
                        <Link
                          href={`/messages?tutor=${tutor.id}`}
                          className="border border-primary text-primary px-6 py-2 rounded-md hover:bg-primary hover:text-white transition-colors"
                        >
                          Send Message
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialties */}
                {tutor.specialties && tutor.specialties.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-dark-text mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {tutor.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {tutor.bio && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-dark-text mb-3">About Me</h3>
                    <p className="text-gray-600 leading-relaxed">{tutor.bio}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Video */}
              {tutor.video_url && (
                <div className="lg:w-80 mt-6 lg:mt-0">
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    {isVideoPlaying ? (
                      <video
                        src={tutor.video_url}
                        className="w-full h-48 object-cover"
                        controls
                        autoPlay
                      />
                    ) : (
                      <div
                        className="w-full h-48 bg-gray-200 flex items-center justify-center cursor-pointer"
                        onClick={() => setIsVideoPlaying(true)}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                          <p className="text-gray-600">Watch Introduction Video</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info Sections */}
          <div className="border-t border-gray-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Experience & Education */}
              <div>
                <h3 className="text-lg font-semibold text-dark-text mb-4">Experience & Education</h3>
                <div className="space-y-3">
                  {tutor.experience && (
                    <div>
                      <span className="font-medium text-gray-700">Experience:</span>
                      <span className="ml-2 text-gray-600">{tutor.experience}</span>
                    </div>
                  )}
                  {tutor.education && (
                    <div>
                      <span className="font-medium text-gray-700">Education:</span>
                      <span className="ml-2 text-gray-600">{tutor.education}</span>
                    </div>
                  )}
                  {tutor.certifications && tutor.certifications.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Certifications:</span>
                      <ul className="ml-2 mt-1">
                        {tutor.certifications.map((cert, index) => (
                          <li key={index} className="text-gray-600">• {cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability */}
              {tutor.availability && tutor.availability.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-4">Availability</h3>
                  <div className="space-y-2">
                    {tutor.availability.map((slot, index) => (
                      <div key={index} className="text-gray-600">
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <BookingModal
            tutor={tutor}
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
          />
        )}
      </div>
    </div>
  )
}
