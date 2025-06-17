'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from './AuthProvider'

interface Tutor {
  id: string
  name: string
  language: string
  rate: number
  rating: number
  photo_url?: string
  bio?: string
  specialties?: string[]
  video_url?: string
}

interface TutorCardProps {
  tutor: Tutor
}

export default function TutorCard({ tutor }: TutorCardProps) {
  const { user } = useAuth()
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const handleVideoToggle = () => {
    if (tutor.video_url) {
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const handleMouseEnter = () => {
    if (tutor.video_url) {
      setShowVideo(true)
    }
  }

  const handleMouseLeave = () => {
    setShowVideo(false)
    setIsVideoPlaying(false)
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex">
        {/* Main Content - 70% width */}
        <div className="flex-1 p-6">
          <div className="flex items-start space-x-4">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {tutor.photo_url ? (
                <img
                  src={tutor.photo_url}
                  alt={tutor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-semibold">
                  {tutor.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Tutor Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-dark-text truncate">
                  {tutor.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    ⭐ {tutor.rating}/5
                  </span>
                </div>
              </div>

              <p className="text-primary font-medium mb-2">
                {tutor.language} Tutor
              </p>

              {tutor.bio && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {tutor.bio}
                </p>
              )}

              {tutor.specialties && tutor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {tutor.specialties.slice(0, 3).map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {tutor.specialties.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{tutor.specialties.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-dark-text">
                  ${tutor.rate}/hour
                </div>
                <div className="flex space-x-2">
                  {user && (
                    <Link
                      href={`/messages?tutor=${tutor.id}`}
                      className="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
                  )}
                  <Link
                    href={`/tutor/${tutor.id}`}
                    className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Preview - 30% width */}
        {tutor.video_url && (
          <div className={`w-1/3 relative ${showVideo ? 'block' : 'hidden'}`}>
            <div className="h-full bg-gray-100 flex items-center justify-center">
              {isVideoPlaying ? (
                <video
                  src={tutor.video_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  onClick={handleVideoToggle}
                />
              ) : (
                <div
                  className="w-full h-full bg-gray-200 flex items-center justify-center cursor-pointer"
                  onClick={handleVideoToggle}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">Click to play</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
