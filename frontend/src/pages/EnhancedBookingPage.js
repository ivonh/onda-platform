import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, Star, Calendar, DollarSign, TrendingDown, Clock, Navigation as NavIcon, Award, CheckCircle2 } from 'lucide-react';
import { BookingMap } from '@/components/BookingMap';
import { TravelPreferenceSelector, TRAVEL_MODES } from '@/components/TravelPreferenceSelector';
import SwipeToPayButton from '@/components/SwipeToPayButton';
import api from '@/services/api';
import { toast } from 'sonner';
import { SERVICE_LABELS } from '@/data/mockStylists';

const bookingSchema = z.object({
  services: z.array(z.string()).min(1, 'Select at least one service'),
  preferred_datetime: z.string().min(1, 'Please select a date and time'),
  client_address: z.string().optional(),
  client_lat: z.string().optional(),
  client_lng: z.string().optional(),
  travel_mode: z.string().default('stylist_travels'),
  meeting_address: z.string().optional(),
  meeting_lat: z.string().optional(),
  meeting_lng: z.string().optional(),
  notes: z.string().optional(),
});

export default function EnhancedBookingPage() {
  const { stylistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [stylist, setStylist] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [booking, setBooking] = useState(false);
  const [discountTier, setDiscountTier] = useState(location.state?.discountTier || 0);
  const [selectedServiceFromPrev, setSelectedServiceFromPrev] = useState(location.state?.selectedService || '');
  const [travelInfo, setTravelInfo] = useState(null);
  const [travelMode, setTravelMode] = useState(TRAVEL_MODES.STYLIST_TRAVELS);
  
  // Get stylist location from profile or use default NYC location
  const getStylistLocation = () => {
    if (stylist?.profile?.service_area) {
      return {
        lat: stylist.profile.service_area.latitude || -27.9380,
        lng: stylist.profile.service_area.longitude || 153.3960,
      };
    }
    return { lat: -27.9380, lng: 153.3960 }; // Gold Coast, Australia
  };

  // Handle travel info from map component
  const handleTravelInfoChange = (info) => {
    setTravelInfo(info);
    if (info?.clientAddress) {
      form.setValue('client_address', info.clientAddress);
    }
    if (info?.clientLocation) {
      form.setValue('client_lat', info.clientLocation.lat.toString());
      form.setValue('client_lng', info.clientLocation.lng.toString());
    }
  };

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      services: selectedServiceFromPrev ? [selectedServiceFromPrev] : (location.state?.prefillData?.services || []),
      preferred_datetime: '',
      client_address: location.state?.prefillData?.address || '',
      client_lat: location.state?.prefillData?.lat?.toString() || '-27.9380',
      client_lng: location.state?.prefillData?.lng?.toString() || '153.3960',
      travel_mode: 'stylist_travels',
      meeting_address: '',
      meeting_lat: '',
      meeting_lng: '',
      notes: location.state?.prefillData?.notes || '',
    },
  });

  const handleTravelModeChange = (mode) => {
    setTravelMode(mode);
    form.setValue('travel_mode', mode);
    setTravelInfo(null);
    setEstimate(null);
  };

  const getStylistAddress = () => {
    if (stylist?.profile?.service_area?.address) {
      return stylist.profile.service_area.address;
    }
    return 'Stylist\'s workplace';
  };

  const fetchStylist = useCallback(async () => {
    try {
      const response = await api.get(`/stylists/${stylistId}`);
      setStylist(response.data);
    } catch (error) {
      toast.error('Stylist not found');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  }, [stylistId, navigate]);

  useEffect(() => {
    fetchStylist();
  }, [fetchStylist]);

  const calculateDiscount = (travelCost) => {
    const discountPercent = discountTier * 10;
    return (travelCost * discountPercent) / 100;
  };

  const getEstimate = async () => {
    const values = form.getValues();
    if (values.services.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    
    if (travelMode === TRAVEL_MODES.STYLIST_TRAVELS && !values.client_address) {
      toast.error('Please enter your address for stylist travel');
      return;
    }
    
    if (travelMode === TRAVEL_MODES.OWN_ARRANGEMENT && !values.meeting_address) {
      toast.error('Please enter the meeting location when arranging your own travel');
      return;
    }

    setEstimating(true);
    try {
      const requestPayload = {
        stylist_id: stylistId,
        services: values.services,
        travel_mode: travelMode,
      };
      
      if (travelMode === TRAVEL_MODES.STYLIST_TRAVELS && values.client_address) {
        const clientLat = parseFloat(values.client_lat) || getStylistLocation().lat;
        const clientLng = parseFloat(values.client_lng) || getStylistLocation().lng;
        requestPayload.client_location = {
          latitude: clientLat,
          longitude: clientLng,
          address: values.client_address,
        };
      }
      
      const response = await api.post('/bookings/estimate', requestPayload);
      
      const travelDiscount = calculateDiscount(response.data.travel_cost);
      const discountedTravel = response.data.travel_cost - travelDiscount;
      
      setEstimate({
        ...response.data,
        travel_discount: travelDiscount,
        discounted_travel_cost: discountedTravel,
        final_total: response.data.service_price + discountedTravel
      });
      
      toast.success('Estimate calculated with your travel discount!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get estimate');
    } finally {
      setEstimating(false);
    }
  };

  const onSubmit = async (values) => {
    if (!estimate) {
      toast.error('Please get an estimate first');
      return;
    }

    setBooking(true);
    try {
      let meetingLocation = null;
      if (travelMode === TRAVEL_MODES.CLIENT_TRAVELS) {
        meetingLocation = {
          latitude: getStylistLocation().lat,
          longitude: getStylistLocation().lng,
          address: getStylistAddress(),
        };
      } else if (travelMode === TRAVEL_MODES.OWN_ARRANGEMENT && values.meeting_address) {
        meetingLocation = {
          latitude: 0,
          longitude: 0,
          address: values.meeting_address,
        };
      }
      
      const requestPayload = {
        stylist_id: stylistId,
        services: values.services,
        preferred_datetime: new Date(values.preferred_datetime).toISOString(),
        notes: values.notes,
        travel_mode: travelMode,
        meeting_location: meetingLocation,
      };
      
      if (travelMode === TRAVEL_MODES.STYLIST_TRAVELS && values.client_address) {
        const clientLat = parseFloat(values.client_lat) || getStylistLocation().lat;
        const clientLng = parseFloat(values.client_lng) || getStylistLocation().lng;
        requestPayload.client_location = {
          latitude: clientLat,
          longitude: clientLng,
          address: values.client_address,
        };
      }
      
      const bookingResponse = await api.post('/bookings/create', requestPayload);

      const checkoutResponse = await api.post(
        `/payments/create-checkout?booking_id=${bookingResponse.data.booking_id}`
      );

      window.location.href = checkoutResponse.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Stylist Info */}
          <div>
            <Card className="luxury-card mb-6">
              <CardContent className="p-0">
                <div className="relative h-64 w-full overflow-hidden rounded-t-sm">
                  <img
                    src={stylist.profile?.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1616723355486-eac8780bfcb9?crop=entropy&cs=srgb&fm=jpg&q=85'}
                    alt={stylist.name}
                    className="w-full h-full object-cover"
                  />
                  {stylist.hearts >= 2500 && (
                    <Badge className="absolute top-4 right-4 gold-badge">
                      GOLD STANDARD
                    </Badge>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <h2 className="font-cormorant text-3xl font-bold">{stylist.name}</h2>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-primary fill-primary" />
                      <span className="font-semibold">{stylist.hearts || 0} hearts</span>
                    </div>
                    {stylist.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="font-semibold">{stylist.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {stylist.profile?.service_area && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {stylist.profile.service_area.address}
                    </p>
                  )}

                  {/* Verified Credentials */}
                  {stylist.verified_credentials?.length > 0 && (
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-500" />
                        Verified Credentials
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {stylist.verified_credentials.map((cred, idx) => (
                          <Badge 
                            key={idx} 
                            className="bg-green-500/10 text-green-600 border-green-500/30 text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {cred.credential_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services & Pricing */}
                  <div>
                    <p className="text-sm font-semibold mb-3">Available Services:</p>
                    <div className="space-y-2">
                      {stylist.pricing?.map((pricing, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-card/50 rounded-lg border border-border/30">
                          <div>
                            <p className="font-medium capitalize">{SERVICE_LABELS[pricing.service] || pricing.service}</p>
                            <p className="text-xs text-muted-foreground">{pricing.duration_minutes} min</p>
                          </div>
                          <p className="font-bold text-primary">${pricing.price_min}-${pricing.price_max}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount Tier Display */}
            {discountTier > 0 && (
              <Card className="luxury-card border-2 border-green-500/30 bg-green-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingDown className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-bold text-green-500 text-lg">Travel Discount Active!</p>
                      <p className="text-sm text-muted-foreground">You've earned {discountTier * 10}% off travel costs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Price Estimate from Map - only for stylist travels */}
            {travelInfo && travelMode === TRAVEL_MODES.STYLIST_TRAVELS && (
              <Card className="luxury-card mt-6 border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="font-cormorant text-2xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Travel Cost Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Distance</span>
                    <span className="font-semibold">{travelInfo.distanceText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Travel Time</span>
                    <span className="font-semibold">{travelInfo.durationText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel Fee</span>
                    <span className={`font-semibold ${parseFloat(travelInfo.travelCost) === 0 ? 'text-green-500' : 'text-primary'}`}>
                      {parseFloat(travelInfo.travelCost) > 0 ? `$${travelInfo.travelCost}` : 'FREE'}
                    </span>
                  </div>
                  {discountTier > 0 && parseFloat(travelInfo.travelCost) > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Your Discount ({discountTier * 10}%)</span>
                      <span>-${(parseFloat(travelInfo.travelCost) * discountTier * 0.1).toFixed(2)}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    First 10 km are free! Travel cost calculated at $1.20/km after.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* No travel fee message for other modes */}
            {(travelMode === TRAVEL_MODES.CLIENT_TRAVELS || travelMode === TRAVEL_MODES.OWN_ARRANGEMENT) && (
              <Card className="luxury-card mt-6 border-2 border-green-500/30 bg-green-500/5">
                <CardContent className="p-6 text-center">
                  <p className="text-green-500 font-semibold text-lg">No Travel Fee</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {travelMode === TRAVEL_MODES.CLIENT_TRAVELS 
                      ? "You're visiting the stylist's location" 
                      : "You're arranging your own travel"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Full Price Estimate */}
            {estimate && (
              <Card className="luxury-card mt-6 border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="font-cormorant text-2xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Price Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Services</span>
                    <span className="font-semibold">${estimate.service_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Travel ({estimate.distance_km?.toFixed(1) || estimate.distance_miles?.toFixed(1)} km)</span>
                    <span className="line-through text-muted-foreground">${estimate.travel_cost.toFixed(2)}</span>
                  </div>
                  {estimate.travel_discount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Travel Discount ({discountTier * 10}%)</span>
                      <span>-${estimate.travel_discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Discounted Travel</span>
                    <span className="font-semibold text-green-500">${estimate.discounted_travel_cost.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/30 pt-3 flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">${estimate.final_total.toFixed(2)} AUD</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    You saved ${estimate.travel_discount.toFixed(2)} with your discount tier!
                  </p>

                  {estimate.platform_fee && (
                    <div className="border-t border-border/30 pt-3 mt-4">
                      <p className="text-xs text-center text-muted-foreground mb-2">Payment Distribution</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Stylist receives</span>
                        <span className="text-foreground">${estimate.stylist_earnings?.toFixed(2) || (estimate.final_total - estimate.platform_fee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Platform fee ({estimate.platform_fee_percent || 15}%)</span>
                        <span className="text-foreground">${estimate.platform_fee.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Form */}
          <div>
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="font-cormorant text-3xl">Book Your Service</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="services"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base">Select Services</FormLabel>
                          <div className="space-y-3">
                            {stylist.pricing?.map((pricing, idx) => (
                              <div key={idx} className="flex items-start space-x-3">
                                <Checkbox
                                  checked={form.watch('services').includes(pricing.service)}
                                  onCheckedChange={(checked) => {
                                    const current = form.getValues('services');
                                    if (checked) {
                                      form.setValue('services', [...current, pricing.service]);
                                    } else {
                                      form.setValue('services', current.filter(s => s !== pricing.service));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <label className="text-sm font-medium capitalize cursor-pointer">
                                    {SERVICE_LABELS[pricing.service] || pricing.service}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    ${pricing.price_min}-${pricing.price_max} • {pricing.duration_minutes}min
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferred_datetime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" className="bg-card border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Travel Preference Selector */}
                    <div className="space-y-4">
                      <TravelPreferenceSelector
                        value={travelMode}
                        onChange={handleTravelModeChange}
                        stylistLocation={{
                          lat: getStylistLocation().lat,
                          lng: getStylistLocation().lng,
                          address: getStylistAddress(),
                        }}
                        stylistName={stylist.name}
                      />
                      
                      {/* Map Component - only show for stylist travels */}
                      {travelMode === TRAVEL_MODES.STYLIST_TRAVELS && (
                        <div className="space-y-4">
                          <FormLabel>Your Location & Travel Info</FormLabel>
                          <BookingMap
                            stylistLocation={getStylistLocation()}
                            stylistName={stylist.name}
                            onTravelInfoChange={handleTravelInfoChange}
                            initialClientAddress={form.getValues('client_address')}
                          />
                          {travelInfo && (
                            <input type="hidden" {...form.register('client_address')} />
                          )}
                          
                          {/* Manual address fallback if map doesn't load */}
                          {!travelInfo && (
                            <FormField
                              control={form.control}
                              name="client_address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Or enter your address manually</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your full address..." 
                                      className="bg-card border-border" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">
                                    Travel fee will be calculated based on distance.
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      )}
                      
                      {/* Stylist location display - for client travels */}
                      {travelMode === TRAVEL_MODES.CLIENT_TRAVELS && (
                        <Card className="border-border/40 bg-green-500/5 border-green-500/30">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-medium">Meet at {stylist.name}'s location</p>
                                <p className="text-sm text-muted-foreground">{getStylistAddress()}</p>
                                <p className="text-xs text-green-500 mt-1">No travel fee - you're coming to them!</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Meeting location input - for own arrangement */}
                      {travelMode === TRAVEL_MODES.OWN_ARRANGEMENT && (
                        <FormField
                          control={form.control}
                          name="meeting_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meeting Location <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter where you'll meet..." 
                                  className="bg-card border-border" 
                                  {...field} 
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                No travel fee - you're arranging your own transportation. Please specify where you'll meet.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any special requests..." className="bg-card border-border resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <Button
                        type="button"
                        onClick={getEstimate}
                        className="w-full btn-secondary"
                        disabled={estimating}
                      >
                        {estimating ? 'Calculating...' : 'Get Price Estimate'}
                      </Button>

                      {estimate && (
                        <div className="space-y-3">
                          <p className="text-sm text-center text-muted-foreground">
                            Slide to confirm payment of <span className="text-primary font-semibold">${estimate.final_total.toFixed(2)} AUD</span>
                          </p>
                          <SwipeToPayButton
                            amount={estimate.final_total}
                            onConfirm={form.handleSubmit(onSubmit)}
                            disabled={!estimate || booking}
                            isLoading={booking}
                          />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Swipe right to prevent accidental payments
                          </p>
                        </div>
                      )}

                      {!estimate && (
                        <Button
                          type="submit"
                          className="w-full btn-primary text-lg py-6"
                          disabled={true}
                        >
                          Get Estimate First
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
