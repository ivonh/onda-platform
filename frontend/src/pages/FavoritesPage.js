import { useEffect, useState } from 'react';
import { StylistCard } from '@/components/StylistCard';
import { Heart } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/favorites/my-favorites');
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 flex items-center gap-4" data-testid="favorites-header">
          <Heart className="h-12 w-12 text-primary fill-primary" />
          <div>
            <h1 className="font-cormorant text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Your Favorites</h1>
            <p className="text-lg text-muted-foreground font-montserrat mt-2">Quick access to your preferred stylists</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8" data-testid="favorites-grid">
            {favorites.map(stylist => (
              <StylistCard 
                key={stylist.stylist_id} 
                stylist={stylist} 
                showFavorite={true}
                onFavoriteChange={fetchFavorites}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20" data-testid="no-favorites">
            <Heart className="h-20 w-20 text-muted mx-auto mb-6 opacity-30" />
            <h3 className="font-cormorant text-3xl font-bold text-foreground mb-4">No Favorites Yet</h3>
            <p className="text-muted-foreground font-montserrat mb-8">Start adding stylists to your favorites for quick access</p>
            <a href="/browse" className="btn-primary inline-block">Discover Stylists</a>
          </div>
        )}
      </div>
    </div>
  );
}
