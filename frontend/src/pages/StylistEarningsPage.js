import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlideToConfirm } from '@/components/SlideToConfirm';
import { DollarSign, TrendingUp, Download } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function StylistEarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showSlider, setShowSlider] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/stylist/earnings');
      setEarnings(response.data);
    } catch (error) {
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 10) {
      toast.error('Minimum withdrawal is $10');
      return;
    }
    if (amount > earnings?.available_balance) {
      toast.error('Insufficient balance');
      return;
    }
    setShowSlider(true);
  };

  const confirmWithdrawal = async () => {
    try {
      await api.post('/stylist/withdraw', { amount: parseFloat(withdrawAmount) });
      toast.success('Withdrawal requested! Funds will arrive by Tuesday.');
      setWithdrawAmount('');
      setShowSlider(false);
      fetchEarnings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Withdrawal failed');
      setShowSlider(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <h1 className="font-cormorant text-6xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Earnings</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <p className="text-4xl font-bold font-cormorant">${earnings?.total_earnings || 0}</p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-4xl font-bold font-cormorant text-green-500">${earnings?.available_balance || 0}</p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Withdrawn</p>
                <Download className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-4xl font-bold font-cormorant">${earnings?.withdrawn || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="font-cormorant text-3xl">Request Withdrawal</CardTitle>
            <p className="text-sm text-muted-foreground">Funds arrive every Tuesday</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showSlider ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Amount ($)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="10"
                    max={earnings?.available_balance || 0}
                    step="0.01"
                    className="w-full bg-card border-2 border-border rounded-lg px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Minimum: $10 | Available: ${earnings?.available_balance || 0}</p>
                </div>
                <Button onClick={handleWithdrawRequest} className="btn-primary w-full text-lg py-6" disabled={!withdrawAmount}>
                  Continue to Confirmation
                </Button>
              </>
            ) : (
              <div>
                <p className="text-lg mb-6 text-center">
                  Withdrawing <span className="font-bold text-primary">${withdrawAmount}</span>
                </p>
                <SlideToConfirm 
                  onConfirm={confirmWithdrawal}
                  text="Slide to Confirm Withdrawal"
                />
                <Button
                  onClick={() => setShowSlider(false)}
                  variant="ghost"
                  className="w-full mt-4"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
