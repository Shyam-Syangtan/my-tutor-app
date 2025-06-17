'use client'

import { useState, useEffect } from 'react'

interface SearchFiltersProps {
  languages: string[]
  onFiltersChange: (filters: {
    searchTerm: string
    selectedLanguage: string
    priceRange: [number, number]
    sortBy: string
  }) => void
  initialFilters: {
    searchTerm: string
    selectedLanguage: string
    priceRange: [number, number]
    sortBy: string
  }
}

export default function SearchFilters({ 
  languages, 
  onFiltersChange, 
  initialFilters 
}: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm)
  const [selectedLanguage, setSelectedLanguage] = useState(initialFilters.selectedLanguage)
  const [priceRange, setPriceRange] = useState<[number, number]>(initialFilters.priceRange)
  const [sortBy, setSortBy] = useState(initialFilters.sortBy)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    onFiltersChange({
      searchTerm,
      selectedLanguage,
      priceRange,
      sortBy
    })
  }, [searchTerm, selectedLanguage, priceRange, sortBy, onFiltersChange])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedLanguage('')
    setPriceRange([0, 100])
    setSortBy('rating')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tutors by name, language, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Filters
        </button>
      </div>

      {/* Filters */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Languages</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range ($/hour)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100])}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
