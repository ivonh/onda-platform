import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp,
  UserCheck,
  Award,
  Image,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Stylists', 
      value: stats?.total_stylists || 0, 
      sub: `${stats?.approved_stylists || 0} approved`,
      icon: Users, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'Total Clients', 
      value: stats?.total_clients || 0, 
      icon: Users, 
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    { 
      label: 'Platform Revenue', 
      value: `$${(stats?.platform_commission || 0).toLocaleString()}`, 
      sub: `$${(stats?.total_revenue || 0).toLocaleString()} total`,
      icon: DollarSign, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'Total Bookings', 
      value: stats?.total_bookings || 0, 
      icon: Calendar, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
  ];

  const actionCards = [
    { 
      label: 'Pending Stylists', 
      count: stats?.pending_stylists || 0, 
      icon: UserCheck, 
      color: 'text-yellow-500',
      path: '/admin/onboarding'
    },
    { 
      label: 'Pending Credentials', 
      count: stats?.pending_credentials || 0, 
      icon: Award, 
      color: 'text-orange-500',
      path: '/admin/credentials'
    },
    { 
      label: 'Pending Photos', 
      count: stats?.pending_photos || 0, 
      icon: Image, 
      color: 'text-purple-500',
      path: '/admin/photos'
    },
    { 
      label: 'Pending Payouts', 
      count: stats?.pending_withdrawals || 0, 
      icon: DollarSign, 
      color: 'text-green-500',
      path: '/admin/payslips'
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cormorant text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Platform overview and quick actions</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="luxury-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold font-cormorant">{card.value}</p>
              {card.sub && (
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-cormorant text-2xl font-semibold mb-4">Requires Attention</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionCards.map((card, i) => (
            <Card 
              key={i} 
              className="luxury-card cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => navigate(card.path)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                    <span className="text-sm">{card.label}</span>
                  </div>
                  {card.count > 0 ? (
                    <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                      {card.count}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      Clear
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-5">
            <h3 className="font-cormorant text-xl font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">${(stats?.total_revenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Platform Commission</span>
                <span className="font-semibold text-primary">${(stats?.platform_commission || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stylist Earnings</span>
                <span className="font-semibold">${(stats?.stylist_earnings || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-5">
            <h3 className="font-cormorant text-xl font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/admin/onboarding')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 text-sm transition-colors flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Review pending stylists
              </button>
              <button 
                onClick={() => navigate('/admin/credentials')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 text-sm transition-colors flex items-center gap-2"
              >
                <Award className="h-4 w-4 text-muted-foreground" />
                Verify credentials
              </button>
              <button 
                onClick={() => navigate('/admin/communications')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 text-sm transition-colors flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                Send communications
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
