import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scissors, Sparkles, Star, Search, TrendingUp, MapPin, DollarSign } from 'lucide-react';
import { SERVICE_ICONS, SERVICE_LABELS } from '@/data/mockStylists';
import api from '@/services/api';

export default function ServiceSelectionPage() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userBookings, setUserBookings] = useState(0);
  const [discountTier, setDiscountTier] = useState(0);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      const completed = response.data.filter(b => b.payment_status === 'completed').length;
      setUserBookings(completed);
      
      if (completed >= 10) setDiscountTier(3);
      else if (completed >= 5) setDiscountTier(2);
      else if (completed >= 2) setDiscountTier(1);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  }, []);

  const filterStylists = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedService) params.services = selectedService;
      if (priceRange === 'budget') { params.min_price = 0; params.max_price = 80; }
      else if (priceRange === 'mid') { params.min_price = 80; params.max_price = 150; }
      else if (priceRange === 'luxury') { params.min_price = 150; }

      const response = await api.get('/search/stylists', { params });
      const results = Array.isArray(response.data) ? response.data : (response.data.stylists || []);
      if (results.length > 0) {
        setStylists(results);
      } else {
        const fallback = await api.get('/stylists/search', { params: { service: selectedService || undefined } });
        setStylists(fallback.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
      setStylists([]);
    } finally {
      setLoading(false);
    }
  }, [selectedService, priceRange]);

  useEffect(() => {
    fetchUserData();
    filterStylists();
  }, [fetchUserData, filterStylists]);

  const getDiscountText = () => {
    if (discountTier === 3) return '30% OFF Travel';
    if (discountTier === 2) return '20% OFF Travel';
    if (discountTier === 1) return '10% OFF Travel';
    return null;
  };

  const getNextTierText = () => {
    if (userBookings < 2) return `${2 - userBookings} more bookings to unlock 10% travel discount`;
    if (userBookings < 5) return `${5 - userBookings} more bookings to unlock 20% travel discount`;
    if (userBookings < 10) return `${10 - userBookings} more bookings to unlock 30% travel discount`;
    return 'Maximum discount tier unlocked!';
  };

  const getStylistPrice = (stylist) => {
    if (!selectedService) return null;
    const pricing = stylist.pricing?.find(p => p.service === selectedService);
    return pricing;
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header with Gamification */}
        <div className="mb-8">
          <h1 className="font-cormorant text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Select Your Service</h1>
          
          {/* Discount Tier Display */}
          <div className="flex items-center gap-4 flex-wrap">
            {getDiscountText() && (
              <div className="discount-badge flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {getDiscountText()}
              </div>
            )}
            <p className="text-sm text-muted-foreground font-montserrat">
              {getNextTierText()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="luxury-card mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Service Type</label>
                <Select value={selectedService} onValueChange={(val) => setSelectedService(val === 'all' ? '' : val)}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="haircut">Haircut</SelectItem>
                    <SelectItem value="coloring">Coloring</SelectItem>
                    <SelectItem value="styling">Styling</SelectItem>
                    <SelectItem value="nails">Nails & Manicure</SelectItem>
                    <SelectItem value="facial">Facial</SelectItem>
                    <SelectItem value="threading">Threading</SelectItem>
                    <SelectItem value="waxing">Waxing</SelectItem>
                    <SelectItem value="cosmetic_tattoo">Cosmetic Tattoo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="budget">Budget ($50-80)</SelectItem>
                    <SelectItem value="mid">Mid-Range ($80-150)</SelectItem>
                    <SelectItem value="luxury">Luxury ($150+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="btn-primary w-full" onClick={filterStylists}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid md:grid-cols-3 gap-6">
          {stylists.length === 0 ? (
            <div className="col-span-3 text-center py-20">
              <Scissors className="h-20 w-20 text-muted mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground font-montserrat">No stylists found matching your criteria</p>
            </div>
          ) : (
            stylists.map(stylist => {
              const pricing = getStylistPrice(stylist);
              return (
                <Card 
                  key={stylist.stylist_id} 
                  className="luxury-card card-hover cursor-pointer group"
                  onClick={() => navigate(`/booking/${stylist.stylist_id}`, { state: { selectedService, discountTier } })}
                >
                  <CardContent className="p-0">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={stylist.profile?.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80'}
                        alt={stylist.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      
                      {/* Service Icon */}
                      {selectedService && (
                        <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm rounded-full p-3">
                          <span className="text-2xl">{SERVICE_ICONS[selectedService]}</span>
                        </div>
                      )}

                      {/* Gold Badge */}
                      {stylist.hearts >= 2500 && (
                        <div className="absolute top-4 right-4 gold-badge px-3 py-1.5 rounded-full text-xs">
                          GOLD
                        </div>
                      )}

                      {/* Bottom Info */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-cormorant text-2xl font-bold text-white mb-1">{stylist.name}</h3>
                        <div className="flex items-center gap-3 text-white/80 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span>{stylist.average_rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{stylist.profile?.service_area?.address?.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      {pricing && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Service Price</p>
                            <p className="text-2xl font-bold font-cormorant text-primary">
                              ${pricing.price_min} - ${pricing.price_max}
                            </p>
                            <p className="text-xs text-muted-foreground">{pricing.duration_minutes} minutes</p>
                          </div>
                          {discountTier > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-green-500 font-semibold">Travel Discount</p>
                              <p className="text-lg font-bold text-green-500">-{discountTier * 10}%</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">+ Travel cost calculated at booking</span>
                      </div>

                      <Button className="w-full btn-primary">
                        Book {stylist.name}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
