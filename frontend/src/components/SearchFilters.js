import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function SearchFilters({ onFilterChange, userLocation }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [services, setServices] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [filters, setFilters] = useState({
    services: [],
    minPrice: null,
    maxPrice: null,
    minRating: null,
    maxDistance: null,
    sortBy: 'rating'
  });

  useEffect(() => {
    fetchServiceOptions();
    fetchPriceRange();
  }, []);

  const fetchServiceOptions = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/search/services`);
      setServices(res.data.all_services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchPriceRange = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/search/price-range`);
      setPriceRange({ min: res.data.min_price, max: res.data.max_price });
    } catch (error) {
      console.error('Error fetching price range:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleService = (service) => {
    const current = filters.services || [];
    const newServices = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service];
    handleFilterChange('services', newServices);
  };

  const clearFilters = () => {
    const cleared = {
      services: [],
      minPrice: null,
      maxPrice: null,
      minRating: null,
      maxDistance: null,
      sortBy: 'rating'
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = filters.services.length > 0 || 
    filters.minPrice || filters.maxPrice || 
    filters.minRating || filters.maxDistance;

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear All
            </button>
          )}
          
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="rating">Highest Rated</option>
            <option value="distance">Nearest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="experience">Most Experienced</option>
          </select>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Services</label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {services.slice(0, 10).map((service) => (
                  <label key={service} className="flex items-center gap-2 text-sm cursor-pointer hover:text-purple-300">
                    <input
                      type="checkbox"
                      checked={filters.services.includes(service)}
                      onChange={() => toggleService(service)}
                      className="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="capitalize">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`Min ($${priceRange.min})`}
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400"
                />
                <input
                  type="number"
                  placeholder={`Max ($${priceRange.max})`}
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Minimum Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleFilterChange('minRating', filters.minRating === rating ? null : rating)}
                    className={`flex-1 py-2 rounded-lg text-lg ${
                      filters.minRating && rating <= filters.minRating
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Distance</label>
              <select
                value={filters.maxDistance || ''}
                onChange={(e) => handleFilterChange('maxDistance', e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                disabled={!userLocation}
              >
                <option value="">Any Distance</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
              </select>
              {!userLocation && (
                <p className="text-xs text-gray-500 mt-1">Enable location to filter by distance</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
