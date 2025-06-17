'use client'

import { useState, useEffect } from 'react'
import TutorCard from './TutorCard'
import SearchFilters from './SearchFilters'
import LoadingSpinner from './LoadingSpinner'

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

interface TutorMarketplaceProps {
  initialTutors: Tutor[]
}

export default function TutorMarketplace({ initialTutors }: TutorMarketplaceProps) {
  const [tutors, setTutors] = useState<Tutor[]>(initialTutors)
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>(initialTutors)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [sortBy, setSortBy] = useState('rating')

  // Get unique languages for filter
  const languages = Array.from(new Set(tutors.map(tutor => tutor.language)))

  useEffect(() => {
    filterTutors()
  }, [searchTerm, selectedLanguage, priceRange, sortBy, tutors])

  const filterTutors = () => {
    let filtered = [...tutors]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tutor =>
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Language filter
    if (selectedLanguage) {
      filtered = filtered.filter(tutor => tutor.language === selectedLanguage)
    }

    // Price range filter
    filtered = filtered.filter(tutor => 
      tutor.rate >= priceRange[0] && tutor.rate <= priceRange[1]
    )

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'price-low':
          return a.rate - b.rate
        case 'price-high':
          return b.rate - a.rate
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredTutors(filtered)
  }

  const handleFiltersChange = (filters: {
    searchTerm: string
    selectedLanguage: string
    priceRange: [number, number]
    sortBy: string
  }) => {
    setSearchTerm(filters.searchTerm)
    setSelectedLanguage(filters.selectedLanguage)
    setPriceRange(filters.priceRange)
    setSortBy(filters.sortBy)
  }

  return (
    <div className="min-h-screen bg-white-mist py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-text mb-2">
            Find Your Perfect Tutor
          </h1>
          <p className="text-gray-600">
            Browse our qualified tutors and book your next lesson
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          languages={languages}
          onFiltersChange={handleFiltersChange}
          initialFilters={{
            searchTerm,
            selectedLanguage,
            priceRange,
            sortBy
          }}
        />

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredTutors.length} of {tutors.length} tutors
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Tutors Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTutors.length > 0 ? (
              filteredTutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tutors found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedLanguage('')
                    setPriceRange([0, 100])
                    setSortBy('rating')
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
