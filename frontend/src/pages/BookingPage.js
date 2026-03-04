import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { MapPin, Heart, Star, Calendar, DollarSign } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const bookingSchema = z.object({
  services: z.array(z.string()).min(1, 'Select at least one service'),
  preferred_datetime: z.string().min(1, 'Please select a date and time'),
  client_address: z.string().min(5, 'Please enter your address'),
  client_lat: z.string(),
  client_lng: z.string(),
  notes: z.string().optional(),
});

export default function BookingPage() {
  const { stylistId } = useParams();
  const navigate = useNavigate();
  const [stylist, setStylist] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [booking, setBooking] = useState(false);

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      services: [],
      preferred_datetime: '',
      client_address: '',
      client_lat: '-27.9380',
      client_lng: '153.3960',
      notes: '',
    },
  });

  useEffect(() => {
    fetchStylist();
  }, [stylistId]);

  const fetchStylist = async () => {
    try {
      const response = await api.get(`/stylists/${stylistId}`);
      setStylist(response.data);
    } catch (error) {
      toast.error('Failed to load stylist details');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const getEstimate = async () => {
    const values = form.getValues();
    if (values.services.length === 0 || !values.client_address) {
      toast.error('Please select services and enter your address');
      return;
    }

    setEstimating(true);
    try {
      const response = await api.post('/bookings/estimate', {
        stylist_id: stylistId,
        services: values.services,
        client_location: {
          latitude: parseFloat(values.client_lat),
          longitude: parseFloat(values.client_lng),
          address: values.client_address,
        },
      });
      setEstimate(response.data);
      toast.success('Estimate calculated!');
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
      const bookingResponse = await api.post('/bookings/create', {
        stylist_id: stylistId,
        services: values.services,
        preferred_datetime: new Date(values.preferred_datetime).toISOString(),
        client_location: {
          latitude: parseFloat(values.client_lat),
          longitude: parseFloat(values.client_lng),
          address: values.client_address,
        },
        notes: values.notes,
      });

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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8">
          <div data-testid="stylist-info">
            <Card className="border border-border/40 mb-6">
              <CardContent className="p-0">
                <div className="relative h-64 w-full overflow-hidden rounded-t-sm">
                  <img
                    src={stylist.profile?.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1616723355486-eac8780bfcb9?crop=entropy&cs=srgb&fm=jpg&q=85'}
                    alt={stylist.name}
                    className="w-full h-full object-cover"
                  />
                  {stylist.hearts >= 1000 && (
                    <Badge className="absolute top-4 right-4 bg-secondary text-white">
                      Executive
                    </Badge>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <h2 className="font-playfair text-3xl font-bold" data-testid="stylist-name">{stylist.name}</h2>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-secondary fill-secondary" />
                      <span className="font-semibold">{stylist.hearts || 0} hearts</span>
                    </div>
                    {stylist.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-secondary fill-secondary" />
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

                  <div>
                    <p className="text-sm font-semibold mb-2">Services Offered:</p>
                    <div className="flex flex-wrap gap-2">
                      {stylist.profile?.skills?.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="capitalize">
                          {skill.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {estimate && (
              <Card className="border-2 border-secondary/20 bg-secondary/5" data-testid="estimate-card">
                <CardHeader>
                  <CardTitle className="font-playfair text-xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Price Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Services</span>
                    <span className="font-semibold">${estimate.service_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Travel ({estimate.distance_miles.toFixed(1)} mi)</span>
                    <span>${estimate.travel_cost.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-secondary">${estimate.total_price.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="border border-border/40" data-testid="booking-form">
              <CardHeader>
                <CardTitle className="font-playfair text-2xl">Book Your Service</CardTitle>
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
                                  data-testid={`service-checkbox-${pricing.service}`}
                                />
                                <div className="flex-1">
                                  <label className="text-sm font-medium capitalize">
                                    {pricing.service.replace('_', ' ')}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    ${pricing.price_min} - ${pricing.price_max} • {pricing.duration_minutes}min
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
                            <Input type="datetime-local" className="input-flushed" {...field} data-testid="datetime-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="client_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Address</FormLabel>
                          <FormControl>
                            <Input className="input-flushed" placeholder="123 Main St, City, State" {...field} data-testid="address-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any special requests or notes..." className="resize-none" {...field} data-testid="notes-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={getEstimate}
                        className="w-full btn-secondary"
                        disabled={estimating}
                        data-testid="get-estimate-button"
                      >
                        {estimating ? 'Calculating...' : 'Get Price Estimate'}
                      </Button>

                      <Button
                        type="submit"
                        className="w-full btn-primary"
                        disabled={!estimate || booking}
                        data-testid="confirm-booking-button"
                      >
                        {booking ? 'Processing...' : 'Confirm & Pay'}
                      </Button>
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
