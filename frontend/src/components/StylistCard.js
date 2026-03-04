import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, Star, Award, Crown, Diamond, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SERVICE_ICONS, SERVICE_LABELS } from '@/data/mockStylists';
import { useState } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

const ZeldaHearts = ({ hearts }) => {
  const filled = Math.max(3, Math.min(hearts / 500, 5));
  const heartContainers = [];

  for (let i = 0; i < 5; i++) {
    let fillAmount = 0;
    if (filled >= i + 1) {
      fillAmount = 1;
    } else if (filled > i) {
      fillAmount = filled - i;
    }

    const isFull = fillAmount >= 1;
    const isHalf = !isFull && fillAmount >= 0.25;
    const isEmpty = fillAmount < 0.25;

    const className = `zelda-heart ${isFull ? 'filled' : isHalf ? 'half' : ''}`;
    const gradientId = `heart-grad-${i}`;
    const stopOffset = isFull ? '100%' : isHalf ? '50%' : '0%';

    heartContainers.push(
      <svg
        key={i}
        className={className}
        width="20"
        height="18"
        viewBox="0 0 24 22"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
            {isEmpty ? (
              <>
                <stop offset="0%" stopColor="#666" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#666" stopOpacity="0.3" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#d4a017" />
                <stop offset={stopOffset} stopColor="#ffb366" />
                <stop offset={stopOffset} stopColor="#666" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#666" stopOpacity="0.3" />
              </>
            )}
          </linearGradient>
        </defs>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={`url(#${gradientId})`}
          stroke={isEmpty ? '#666' : '#ffb366'}
          strokeWidth="1"
          strokeOpacity={isEmpty ? '0.5' : '0.8'}
        />
      </svg>
    );
  }

  return (
    <div className="heart-container" data-testid="stylist-hearts">
      {heartContainers}
      <span className="ml-1 font-semibold text-primary text-xs">{hearts || 0}</span>
    </div>
  );
};

export const StylistCard = ({ stylist, showFavorite = false, onFavoriteChange }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  const isGoldStandard = stylist.hearts >= 2500;
  const isExecutive = stylist.hearts >= 1000;
  const isRisingStar = stylist.hearts >= 250;

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    setFavoriting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please login to favorite stylists');
        navigate('/login');
        return;
      }

      if (isFavorite) {
        await api.delete(`/favorites/remove/${stylist.stylist_id}`);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/favorites/add/${stylist.stylist_id}`);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
      
      if (onFavoriteChange) onFavoriteChange();
    } catch (error) {
      console.error('Favorite error:', error);
    } finally {
      setFavoriting(false);
    }
  };

  const cardGlowClass = isGoldStandard
    ? 'gold-standard-card'
    : isExecutive
    ? 'executive-card'
    : '';

  return (
    <Card className={`luxury-card card-hover cursor-pointer group overflow-hidden w-full h-full flex flex-col ${cardGlowClass}`} onClick={() => navigate(`/stylist/${stylist.stylist_id}`)} data-testid={`stylist-card-${stylist.stylist_id}`}>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
          <img
            src={stylist.profile?.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1616723355486-eac8780bfcb9?crop=entropy&cs=srgb&fm=jpg&q=85'}
            alt={stylist.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            {isGoldStandard && (
              <div className="gold-badge px-3 py-1.5 rounded-full flex items-center gap-2 text-sm btn-shimmer" data-testid="gold-standard-badge">
                <Crown className="h-4 w-4" />
                <span className="font-bold tracking-wide">GOLD STANDARD</span>
                <Sparkles className="h-3 w-3 animate-pulse" />
              </div>
            )}
            
            {isExecutive && !isGoldStandard && (
              <Badge className="bg-gradient-to-r from-gray-300 via-slate-200 to-gray-400 text-gray-900 border-none shadow-lg shadow-slate-400/20 flex items-center gap-1.5 px-3 py-1.5" data-testid="executive-badge">
                <Diamond className="h-3.5 w-3.5" />
                <span className="font-bold tracking-wide">Executive</span>
              </Badge>
            )}

            {isRisingStar && !isExecutive && (
              <Badge className="bg-gradient-to-r from-teal-500/90 to-teal-600/90 text-white border-none shadow-lg shadow-teal-500/20 flex items-center gap-1.5 px-3 py-1.5" data-testid="rising-star-badge">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="font-semibold tracking-wide text-xs">Rising Star</span>
              </Badge>
            )}
          </div>

          {showFavorite && (
            <button
              onClick={handleFavoriteClick}
              disabled={favoriting}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isFavorite 
                  ? 'bg-primary text-black' 
                  : 'bg-black/60 backdrop-blur-sm text-primary border border-primary/40 hover:bg-primary/20'
              }`}
              data-testid="favorite-button"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {stylist.profile?.skills?.slice(0, 4).map((skill, idx) => (
              <div
                key={idx}
                className="service-icon"
                title={SERVICE_LABELS[skill] || skill}
                data-testid={`service-icon-${idx}`}
              >
                <span className="text-lg">{SERVICE_ICONS[skill] || '✨'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4 flex flex-col flex-grow">
          <div>
            <h3 className="font-cormorant text-2xl font-bold mb-2 text-foreground" data-testid="stylist-name">{stylist.name}</h3>
            {stylist.profile?.service_area && (
              <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid="stylist-location">
                <MapPin className="h-4 w-4" />
                {stylist.profile.service_area.address}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm border-t border-b border-border/30 py-3">
            <ZeldaHearts hearts={stylist.hearts || 0} />
          </div>

          <div className="flex flex-wrap gap-2 flex-grow">
            {stylist.profile?.skills?.slice(0, 3).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="capitalize border-primary/30 text-primary/90 bg-primary/5 h-fit" data-testid={`skill-badge-${idx}`}>
                {SERVICE_LABELS[skill] || skill.replace('_', ' ')}
              </Badge>
            ))}
            {stylist.profile?.skills?.length > 3 && (
              <Badge variant="outline" className="border-primary/30 text-primary/90 bg-primary/5 h-fit">
                +{stylist.profile.skills.length - 3}
              </Badge>
            )}
          </div>

          <Button 
            className="w-full btn-primary" 
            onClick={(e) => { 
              e.stopPropagation(); 
              navigate(`/booking/${stylist.stylist_id}`); 
            }} 
            data-testid="book-now-button"
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
