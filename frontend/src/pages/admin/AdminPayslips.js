import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  DollarSign, 
  User,
  TrendingUp,
  Receipt
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function AdminPayslips() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [taxInfo, setTaxInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payouts');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [withdrawalsRes, taxRes] = await Promise.all([
        api.get('/admin/withdrawals/pending'),
        api.get('/admin/tax-info')
      ]);
      setWithdrawals(withdrawalsRes.data);
      setTaxInfo(taxRes.data);
    } catch (error) {
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (withdrawalId) => {
    setProcessing(prev => ({ ...prev, [withdrawalId]: true }));
    try {
      await api.put(`/admin/withdrawals/${withdrawalId}/approve`);
      toast.success('Withdrawal approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    } finally {
      setProcessing(prev => ({ ...prev, [withdrawalId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cormorant text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Payslips & Payouts
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage stylist earnings, payouts, and tax information
        </p>
      </div>

      <div className="flex gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'payouts' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign className="h-4 w-4 inline mr-1.5" />
          Pending Payouts
          {withdrawals.length > 0 && (
            <Badge className="ml-2 bg-yellow-500/20 text-yellow-500 text-xs">{withdrawals.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'tax' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-4 w-4 inline mr-1.5" />
          Tax Information
        </button>
      </div>

      {activeTab === 'payouts' && (
        <>
          {withdrawals.length === 0 ? (
            <Card className="luxury-card">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">No pending payouts</p>
                <p className="text-muted-foreground">All withdrawals have been processed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {withdrawals.map(w => (
                <Card key={w.withdrawal_id} className="luxury-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{w.stylist_name}</p>
                          <p className="text-sm text-muted-foreground">{w.stylist_email}</p>
                          {w.created_at && (
                            <p className="text-xs text-muted-foreground">
                              Requested: {new Date(w.created_at).toLocaleDateString('en-AU')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-bold font-cormorant text-primary">${w.amount}</p>
                        <Button 
                          onClick={() => approveWithdrawal(w.withdrawal_id)} 
                          className="btn-primary"
                          disabled={processing[w.withdrawal_id]}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-3">
          {taxInfo.length === 0 ? (
            <Card className="luxury-card">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No stylist tax information available</p>
              </CardContent>
            </Card>
          ) : (
            taxInfo.map(stylist => (
              <Card key={stylist.stylist_id} className="luxury-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{stylist.name}</p>
                        <p className="text-sm text-muted-foreground">{stylist.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Earnings</p>
                        <p className="font-bold text-primary flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          ${stylist.total_earnings}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="font-bold">{stylist.total_bookings}</p>
                      </div>
                      <Badge className={stylist.has_tax_info ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}>
                        {stylist.has_tax_info ? 'Tax Info Complete' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
