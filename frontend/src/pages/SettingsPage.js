import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Bell, 
  User, 
  Loader2,
  Gift,
  LifeBuoy,
  Ticket
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    bookingUpdates: true,
    promotions: false,
    messages: true,
  });
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('general');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketBookingId, setTicketBookingId] = useState('');
  const [myTickets, setMyTickets] = useState([]);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    setIsLoading(false);
    fetchMyTickets();
  }, [navigate]);

  const fetchMyTickets = async () => {
    try {
      const response = await api.get('/tickets/my');
      setMyTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      toast.error('Please fill in the subject and description');
      return;
    }
    setSubmittingTicket(true);
    try {
      const payload = {
        subject: ticketSubject,
        description: ticketDescription,
        category: ticketCategory,
      };
      if (ticketBookingId.trim()) {
        payload.booking_id = ticketBookingId.trim();
      }
      await api.post('/tickets/', payload);
      toast.success('Support ticket submitted successfully');
      setTicketSubject('');
      setTicketCategory('general');
      setTicketDescription('');
      setTicketBookingId('');
      fetchMyTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 hero-gradient">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-cormorant text-4xl font-bold text-primary">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and security</p>
        </div>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="security" className="flex items-center gap-2" data-testid="security-tab">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="notifications-tab">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2" data-testid="rewards-tab">
              <Gift className="h-4 w-4" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2" data-testid="account-tab">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2" data-testid="support-tab" onClick={() => fetchMyTickets()}>
              <LifeBuoy className="h-4 w-4" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your password and account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Password</h3>
                  <Button variant="outline" className="w-full" data-testid="change-password-button">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you'd like to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="booking-updates">Booking Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about booking confirmations and changes
                    </p>
                  </div>
                  <Switch 
                    id="booking-updates"
                    checked={notifications.bookingUpdates}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, bookingUpdates: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="messages">Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new messages from stylists
                    </p>
                  </div>
                  <Switch 
                    id="messages"
                    checked={notifications.messages}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, messages: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="promotions">Promotions & Offers</Label>
                    <p className="text-sm text-muted-foreground">
                      Get updates about special offers and discounts
                    </p>
                  </div>
                  <Switch 
                    id="promotions"
                    checked={notifications.promotions}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, promotions: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Loyalty Rewards</CardTitle>
                <CardDescription>
                  Earn points on every booking and unlock exclusive benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm opacity-80">Onda Rewards</p>
                      <p className="text-2xl font-bold">Earn & Save</p>
                    </div>
                    <Gift className="h-12 w-12 opacity-80" />
                  </div>
                  <p className="text-sm opacity-90 mb-4">
                    Earn 10 points for every $1 spent. Redeem 100 points for $1 off your next booking!
                  </p>
                  <Button 
                    onClick={() => navigate('/loyalty')}
                    className="w-full bg-white text-purple-600 hover:bg-gray-100"
                  >
                    View My Rewards
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border/40 text-center">
                    <p className="text-2xl font-bold text-amber-500">🥉</p>
                    <p className="font-medium">Bronze</p>
                    <p className="text-sm text-muted-foreground">0 points</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/40 text-center">
                    <p className="text-2xl font-bold text-gray-400">🥈</p>
                    <p className="font-medium">Silver</p>
                    <p className="text-sm text-muted-foreground">1,000+ points</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/40 text-center">
                    <p className="text-2xl font-bold text-yellow-500">🥇</p>
                    <p className="font-medium">Gold</p>
                    <p className="text-sm text-muted-foreground">5,000+ points</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/40 text-center">
                    <p className="text-2xl font-bold text-purple-500">💎</p>
                    <p className="font-medium">Platinum</p>
                    <p className="text-sm text-muted-foreground">15,000+ points</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Tier Benefits</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Silver: 5% discount on all bookings</li>
                    <li>• Gold: 10% discount + priority booking</li>
                    <li>• Platinum: 15% discount + exclusive perks</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View and manage your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="text-lg">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-lg">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Account Type</Label>
                    <p className="text-lg capitalize">{user?.role}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button variant="outline" className="w-full" data-testid="edit-profile-button">
                    Edit Profile
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      localStorage.removeItem('access_token');
                      localStorage.removeItem('user');
                      navigate('/');
                      toast.success('Logged out successfully');
                    }}
                    data-testid="logout-button"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <div className="space-y-6">
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-primary" />
                    Submit a Ticket
                  </CardTitle>
                  <CardDescription>
                    Need help? Submit a support ticket and we'll get back to you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <Label htmlFor="ticket-subject">Subject</Label>
                      <input
                        id="ticket-subject"
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Brief summary of your issue"
                        className="w-full mt-1 bg-card border border-border text-foreground rounded-md p-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket-category">Category</Label>
                      <select
                        id="ticket-category"
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full mt-1 bg-card border border-border text-foreground rounded-md p-2"
                      >
                        <option value="general">General</option>
                        <option value="payment_dispute">Payment Dispute</option>
                        <option value="complaint">Complaint</option>
                        <option value="service_issue">Service Issue</option>
                        <option value="account_issue">Account Issue</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ticket-description">Description</Label>
                      <textarea
                        id="ticket-description"
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder="Describe your issue in detail"
                        rows={4}
                        className="w-full mt-1 bg-card border border-border text-foreground rounded-md p-2 resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket-booking-id">Booking ID (optional)</Label>
                      <input
                        id="ticket-booking-id"
                        type="text"
                        value={ticketBookingId}
                        onChange={(e) => setTicketBookingId(e.target.value)}
                        placeholder="e.g. BK-12345"
                        className="w-full mt-1 bg-card border border-border text-foreground rounded-md p-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        If this relates to a specific booking, enter the booking ID
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={submittingTicket}>
                      {submittingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Ticket'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    My Tickets
                  </CardTitle>
                  <CardDescription>
                    View your support ticket history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">No support tickets yet</p>
                  ) : (
                    <div className="space-y-4">
                      {myTickets.map((ticket) => {
                        const statusColors = {
                          open: 'bg-amber-500/20 text-amber-500',
                          in_progress: 'bg-blue-500/20 text-blue-500',
                          resolved: 'bg-green-500/20 text-green-500',
                          closed: 'bg-gray-500/20 text-gray-500',
                        };
                        const statusColor = statusColors[ticket.status] || 'bg-gray-500/20 text-gray-500';
                        return (
                          <div key={ticket.ticket_id} className="p-4 rounded-lg border border-border/40 space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{ticket.subject}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                                {ticket.status?.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                {ticket.category?.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
