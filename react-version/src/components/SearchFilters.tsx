import React, { useState, useEffect } from 'react';

interface FilterState {
  language: string;
  priceRange: string;
  searchTerm: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  filters, 
  onFilterChange, 
  onClearFilters 
}) => {
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ language: e.target.value });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ priceRange: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      onFilterChange({ searchTerm });
    }, 300);

    setSearchTimeout(newTimeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="search-filters">
      <div className="filters-container">
        {/* Language Filter */}
        <div className="filter-group">
          <label className="filter-label">Language</label>
          <select 
            className="filter-select"
            value={filters.language}
            onChange={handleLanguageChange}
          >
            <option value="">All Languages</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
            <option value="Bengali">Bengali</option>
            <option value="Telugu">Telugu</option>
            <option value="Marathi">Marathi</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Kannada">Kannada</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Urdu">Urdu</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="filter-group">
          <label className="filter-label">Price Range</label>
          <select 
            className="filter-select"
            value={filters.priceRange}
            onChange={handlePriceChange}
          >
            <option value="">Any Price</option>
            <option value="0-300">₹0 - ₹300</option>
            <option value="300-500">₹300 - ₹500</option>
            <option value="500-800">₹500 - ₹800</option>
            <option value="800-1200">₹800 - ₹1200</option>
            <option value="1200+">₹1200+</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="filter-group search-group">
          <label className="filter-label">Search Tutors</label>
          <input 
            type="text"
            className="filter-input"
            placeholder="Search by name..."
            defaultValue={filters.searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Clear Filters Button */}
        <div className="filter-group clear-group">
          <button 
            className="clear-filters-btn"
            onClick={onClearFilters}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
