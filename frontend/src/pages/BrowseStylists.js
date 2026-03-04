import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { StylistCard } from '@/components/StylistCard';
import FeaturedArtistBanner from '@/components/FeaturedArtistBanner';
import OndaSpinner from '@/components/OndaSpinner';
import SearchFilters from '@/components/SearchFilters';
import { useLocation as useLocationContext } from '@/context/LocationContext';

export default function BrowseStylists() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const { location: userLocation } = useLocationContext();

  const fetchStylists = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.services?.length) params.services = filters.services.join(',');
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.minRating) params.min_rating = filters.minRating;
      if (filters.maxDistance && userLocation) {
        params.max_distance = filters.maxDistance;
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }
      if (filters.sortBy) params.sort_by = filters.sortBy;
      
      const response = await api.get('/search/stylists', { params });
      
      const results = Array.isArray(response.data) ? response.data : (response.data.stylists || []);
      if (results.length > 0) {
        const mapped = results.map(s => ({
          stylist_id: s.stylist_id,
          name: s.name,
          average_rating: s.average_rating || 0,
          total_ratings: s.total_ratings || 0,
          hearts: s.hearts || Math.round((s.total_ratings || 0) * (s.average_rating || 0)),
          profile: {
            skills: s.skills || [],
            portfolio_images: s.profile_image ? [s.profile_image] : [],
            bio: s.bio,
            service_area: s.starting_price ? { address: `From $${s.starting_price}` } : null,
          },
        }));
        setStylists(mapped);
      } else {
        const fallbackResponse = await api.get('/stylists/search', { params: { service: filters.services?.[0] } });
        const fallbackData = fallbackResponse.data || [];
        const fallbackMapped = Array.isArray(fallbackData) ? fallbackData.map(s => ({
          stylist_id: s.stylist_id,
          name: s.name,
          average_rating: s.average_rating || 0,
          total_ratings: s.total_ratings || 0,
          hearts: s.hearts || Math.round((s.total_ratings || 0) * (s.average_rating || 0)),
          profile: s.profile || {
            skills: s.skills || [],
            portfolio_images: s.profile_image ? [s.profile_image] : [],
            bio: s.bio,
            service_area: s.starting_price ? { address: `From $${s.starting_price}` } : null,
          },
        })) : [];
        setStylists(fallbackMapped);
      }
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
      setStylists([]);
    } finally {
      setLoading(false);
    }
  }, [filters, userLocation]);

  useEffect(() => {
    fetchStylists();
  }, [fetchStylists]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12" data-testid="browse-header">
          <h1 className="font-cormorant text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Discover Your Artist
          </h1>
          <p className="text-lg text-muted-foreground font-montserrat">
            Browse our elite network of beauty professionals
          </p>
        </div>

        <div className="mb-8">
          <FeaturedArtistBanner />
        </div>

        <SearchFilters 
          onFilterChange={handleFilterChange} 
          userLocation={userLocation}
        />

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <OndaSpinner size="lg" text="Finding the perfect stylists for you..." />
              </div>
            ) : stylists.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {stylists.length} stylist{stylists.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch" data-testid="stylists-grid">
                  {stylists.map((stylist) => (
                    <div key={stylist.stylist_id} className="flex">
                      <StylistCard stylist={stylist} showFavorite={true} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12" data-testid="no-results">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-muted-foreground mb-2">No stylists found</p>
                <p className="text-sm text-muted-foreground/70">Try adjusting your filters to discover more artists</p>
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}
