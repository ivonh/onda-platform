import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Star, TrendingUp } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { BookAgainSection } from '@/components/BookAgainSection';

export default function ClientDashboard() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchBookings();
    fetchPendingFeedback();
  }, []);

  const fetchPendingFeedback = async () => {
    try {
      const res = await api.get('/feedback/pending');
      setPendingFeedback(res.data.pending_feedback || []);
    } catch {}
  };

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Bookings',
      value: bookings.length,
      icon: <Calendar className="h-8 w-8 text-secondary" />,
    },
    {
      title: 'Upcoming',
      value: bookings.filter(b => ['pending', 'confirmed', 'accepted'].includes(b.status)).length,
      icon: <TrendingUp className="h-8 w-8 text-secondary" />,
    },
    {
      title: 'Completed',
      value: bookings.filter(b => b.status === 'completed').length,
      icon: <Star className="h-8 w-8 text-secondary" />,
    },
  ];

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12" data-testid="client-dashboard-header">
          <h1 className="font-cormorant text-6xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Welcome back, {user?.first_name || user?.name}</h1>
          <p className="text-lg text-muted-foreground font-montserrat">Manage your bookings and discover new stylists</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12" data-testid="stats-grid">
          {stats.map((stat, idx) => (
            <Card key={idx} className="luxury-card border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-4xl font-bold font-cormorant text-primary">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Feedback Banner */}
        {pendingFeedback.length > 0 && (
          <div className="mb-8 space-y-3">
            {pendingFeedback.map(fb => (
              <div key={fb.feedback_id} className="bg-gradient-to-r from-primary/15 to-amber-500/10 border border-primary/30 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">✨</div>
                  <div>
                    <p className="text-foreground font-semibold">Rate your experience with {fb.stylist_name}</p>
                    <p className="text-sm text-gray-400">Share your feedback and earn a 15% discount coupon!</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/rate/${fb.booking_id}`)}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition whitespace-nowrap"
                >
                  Rate Now
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Book Again Section */}
        <div className="mb-12">
          <BookAgainSection limit={4} showTitle={true} />
        </div>

        <Card className="luxury-card border-border/40" data-testid="bookings-card">
          <CardHeader>
            <CardTitle className="font-cormorant text-3xl">All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading bookings...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.booking_id} className="flex items-center justify-between p-4 border border-border/40 rounded-lg hover:border-primary/30 transition-colors" data-testid={`booking-item-${booking.booking_id}`}>
                    <div>
                      <p className="font-semibold text-lg">{booking.stylist_name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(booking.scheduled_datetime).toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        {booking.services?.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="capitalize border-primary/30">
                            {service.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-2xl font-bold text-primary">${booking.total_price?.toFixed(2)}</p>
                      <Badge
                        className={`${
                          booking.status === 'completed' ? 'bg-green-500' :
                          booking.status === 'confirmed' ? 'bg-blue-500' :
                          booking.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}
                        data-testid={`booking-status-${booking.booking_id}`}
                      >
                        {booking.status}
                      </Badge>
                      {booking.status === 'completed' && pendingFeedback.some(f => f.booking_id === booking.booking_id) && (
                        <button
                          onClick={() => navigate(`/rate/${booking.booking_id}`)}
                          className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition font-medium"
                        >
                          Rate Experience ✨
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <a href="/services" className="text-primary font-semibold hover:underline">Browse services to get started</a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
