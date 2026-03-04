import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Star, Heart, User, Image, CalendarDays, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { toast } from 'sonner';

export default function StylistDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, profileRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/stylists/profile/me')
      ]);
      setBookings(bookingsRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = bookings
    .filter(b => b.payment_status === 'completed')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const stats = [
    {
      title: 'Total Bookings',
      value: profile?.total_bookings || 0,
      icon: <Calendar className="h-8 w-8 text-secondary" />,
    },
    {
      title: 'Hearts',
      value: profile?.hearts || 0,
      icon: <Heart className="h-8 w-8 text-secondary fill-secondary" />,
    },
    {
      title: 'Earnings',
      value: `$${totalEarnings.toFixed(2)}`,
      icon: <DollarSign className="h-8 w-8 text-secondary" />,
    },
    {
      title: 'Rating',
      value: profile?.average_rating?.toFixed(1) || '0.0',
      icon: <Star className="h-8 w-8 text-secondary fill-secondary" />,
    },
  ];

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12" data-testid="stylist-dashboard-header">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-playfair text-5xl font-bold text-primary mb-2">Welcome, {user?.first_name || user?.name}</h1>
              <p className="text-lg text-muted-foreground">Manage your bookings and grow your business</p>
              {profile?.hearts >= 1000 && (
                <Badge className="mt-4 bg-secondary text-white px-4 py-2 text-lg" data-testid="executive-tier-badge">
                  🏆 Executive Tier Stylist
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => navigate('/stylist/analytics')}
                variant="outline"
                className="flex items-center gap-2 border-primary/30"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button 
                onClick={() => navigate('/stylist/calendar')}
                variant="outline"
                className="flex items-center gap-2 border-primary/30"
              >
                <CalendarDays className="h-4 w-4" />
                Calendar & Availability
              </Button>
              <Button 
                onClick={() => navigate('/stylist/profile')}
                className="btn-primary flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Edit Profile & Style Book
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12" data-testid="stats-grid">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold font-playfair">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border/40" data-testid="bookings-card">
          <CardHeader>
            <CardTitle className="font-playfair text-2xl">Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading bookings...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.booking_id} className="flex items-center justify-between p-4 border border-border/40 rounded-sm" data-testid={`booking-item-${booking.booking_id}`}>
                    <div>
                      <p className="font-semibold">{booking.client_name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(booking.scheduled_datetime).toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        {booking.services?.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="capitalize">
                            {service.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${booking.total_price?.toFixed(2)}</p>
                      <Badge
                        className={`mt-2 ${
                          booking.status === 'completed' ? 'bg-green-500' :
                          booking.status === 'confirmed' ? 'bg-blue-500' :
                          booking.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}
                        data-testid={`booking-status-${booking.booking_id}`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No bookings yet. Your clients will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
