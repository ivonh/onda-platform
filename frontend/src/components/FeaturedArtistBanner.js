import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SERVICE_LABELS } from '@/data/mockStylists';
import api from '@/services/api';

export default function FeaturedArtistBanner() {
  const [featured, setFeatured] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/search/stylists', {
          params: { sort_by: 'rating', limit: 1 }
        });
        const results = Array.isArray(response.data) ? response.data : (response.data.stylists || []);
        if (results.length > 0) {
          setFeatured(results[0]);
        }
      } catch (error) {
        console.error('Failed to fetch featured stylist:', error);
      }
    };
    fetchFeatured();
  }, []);

  if (!featured) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/90 to-background cursor-pointer group"
      onClick={() => navigate(`/stylist/${featured.stylist_id}`)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex flex-col md:flex-row items-stretch">
        <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative">
          <img
            src={featured.profile_image || 'https://images.unsplash.com/photo-1616723355486-eac8780bfcb9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600'}
            alt={featured.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/60 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent md:hidden" />
        </div>

        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-xs font-montserrat font-semibold tracking-[0.2em] text-primary uppercase">
              Featured Artist
            </span>
          </div>

          <h3 className="font-cormorant text-3xl md:text-4xl font-bold text-foreground mb-2">
            {featured.name}
          </h3>

          <div className="flex items-center gap-4 mb-3">
            {featured.average_rating > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => {
                    const heartsVal = featured.hearts || Math.round((featured.total_ratings || 0) * (featured.average_rating || 0));
                    const filled = Math.max(3, Math.min(heartsVal / 500, 5));
                    const isFull = filled >= i + 1;
                    const isPartial = !isFull && filled > i;
                    const isEmpty = !isFull && !isPartial;
                    return (
                      <svg key={i} width="18" height="16" viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          fill={isEmpty ? 'rgba(102,102,102,0.3)' : '#ffb366'}
                          stroke={isEmpty ? '#666' : '#ffb366'}
                          strokeWidth="1"
                          strokeOpacity={isEmpty ? '0.5' : '0.8'}
                        />
                      </svg>
                    );
                  })}
                </div>
                <span className="text-sm font-semibold text-foreground ml-1">
                  {featured.hearts || Math.round((featured.total_ratings || 0) * (featured.average_rating || 0))}
                </span>
              </div>
            )}
            {featured.total_ratings > 0 && (
              <span className="text-sm text-muted-foreground">
                {featured.total_ratings} review{featured.total_ratings !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {featured.bio && (
            <p className="text-sm text-muted-foreground font-montserrat mb-4 line-clamp-2 max-w-lg">
              {featured.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            {featured.skills?.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-xs font-montserrat rounded-full border border-primary/30 text-primary/90 bg-primary/5 capitalize"
              >
                {SERVICE_LABELS[skill] || skill.replace('_', ' ')}
              </span>
            ))}
          </div>

          <Button
            className="btn-primary w-fit group/btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/booking/${featured.stylist_id}`);
            }}
          >
            Book Now
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
