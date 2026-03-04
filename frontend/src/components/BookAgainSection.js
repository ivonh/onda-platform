import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Star, Heart, MapPin, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { SERVICE_LABELS } from '@/data/mockStylists';

export const BookAgainSection = ({ limit = 5, showTitle = true }) => {
  const [bookingHistory, setBookingHistory] = useState([]);
  const [favoriteStylists, setFavoriteStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, favoritesRes] = await Promise.all([
        api.get(`/quick-rebook/history?limit=${limit}`),
        api.get('/quick-rebook/favorites-stylists')
      ]);
      setBookingHistory(historyRes.data);
      setFavoriteStylists(favoritesRes.data);
    } catch (error) {
      console.error('Failed to load booking history:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickRebook = (booking) => {
    navigate(`/booking/${booking.stylist_id}`, {
      state: {
        prefillData: {
          services: booking.services,
          address: booking.client_location.address,
          lat: booking.client_location.latitude,
          lng: booking.client_location.longitude,
          notes: booking.notes
        },
        isRebooking: true,
        previousBookingId: booking.booking_id
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Rebook from History */}
      {bookingHistory.length > 0 && (
        <div>
          {showTitle && (
            <div className="flex items-center gap-3 mb-6">
              <Repeat className="h-7 w-7 text-primary" />
              <h2 className="font-cormorant text-4xl font-bold">Book Again</h2>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {bookingHistory.slice(0, limit).map((booking) => (
              <Card key={booking.booking_id} className="luxury-card group hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Stylist Image */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={booking.stylist_photo || 'https://images.unsplash.com/photo-1616723355486-eac8780bfcb9?w=200&q=80'}
                        alt={booking.stylist_name}
                        className="w-full h-full object-cover"
                      />
                      {booking.stylist_hearts >= 2500 && (
                        <div className="absolute top-1 right-1 gold-badge px-2 py-0.5 text-xs rounded-full">
                          GOLD
                        </div>
                      )}
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-cormorant text-xl font-bold">{booking.stylist_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span>{booking.stylist_rating.toFixed(1)}</span>
                          <span>•</span>
                          <Heart className="h-3 w-3 fill-primary text-primary" />
                          <span>{booking.stylist_hearts}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {booking.services.slice(0, 2).map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs capitalize border-primary/30">
                            {SERVICE_LABELS[service] || service}
                          </Badge>
                        ))}
                        {booking.services.length > 2 && (
                          <Badge variant="outline" className="text-xs border-primary/30">
                            +{booking.services.length - 2}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Last booking</p>
                          <p className="font-semibold text-primary">${booking.total_price.toFixed(2)}</p>
                        </div>
                        <Button 
                          onClick={() => handleQuickRebook(booking)}
                          className="btn-primary px-6"
                          size="sm"
                        >
                          <Repeat className="h-4 w-4 mr-2" />
                          Book Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Stylists */}
      {favoriteStylists.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-7 w-7 text-primary" />
            <h2 className="font-cormorant text-4xl font-bold">Your Go-To Artists</h2>
            <Badge className="bg-primary/20 text-primary border-primary/30">Most Booked</Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {favoriteStylists.map((stylist) => (
              <Card key={stylist.stylist_id} className="luxury-card group hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate(`/booking/${stylist.stylist_id}`)}>
                <CardContent className="p-0">
                  <div className="relative h-40 overflow-hidden rounded-t-sm">
                    <img
                      src={stylist.stylist_photo || 'https://images.unsplash.com/photo-1616723355486-eac8780bfcb9?w=400&q=80'}
                      alt={stylist.stylist_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    {stylist.stylist_hearts >= 2500 && (
                      <div className="absolute top-3 right-3 gold-badge px-2 py-1 text-xs rounded-full">
                        GOLD
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-cormorant text-xl font-bold text-white">{stylist.stylist_name}</h3>
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span>{stylist.stylist_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="font-bold text-primary">{stylist.booking_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="font-bold text-primary">${stylist.total_spent.toFixed(0)}</p>
                      </div>
                    </div>
                    <Button className="w-full btn-primary" size="sm">
                      <Repeat className="h-4 w-4 mr-2" />
                      Book Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {bookingHistory.length === 0 && favoriteStylists.length === 0 && (
        <Card className="luxury-card">
          <CardContent className="p-12 text-center">
            <Repeat className="h-16 w-16 text-muted mx-auto mb-4 opacity-30" />
            <h3 className="font-cormorant text-2xl font-bold mb-2">No Booking History Yet</h3>
            <p className="text-muted-foreground mb-6">Complete your first booking to see quick rebook options here</p>
            <Button onClick={() => navigate('/services')} className="btn-primary">
              Book Your First Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
