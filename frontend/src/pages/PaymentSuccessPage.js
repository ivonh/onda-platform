import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Home, Loader2 } from 'lucide-react';
import api from '@/services/api';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          const response = await api.get(`/payments/status/${sessionId}`);
          setPaymentInfo(response.data);
        } catch (error) {
          console.error('Failed to verify payment:', error);
        }
      }
      setLoading(false);
    };
    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/40">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your booking has been confirmed. You'll receive a notification with the details.
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Amount paid</p>
              <p className="text-2xl font-bold text-primary">
                ${paymentInfo.amount_total?.toFixed(2)} AUD
              </p>
            </div>
          )}

          {bookingId && (
            <p className="text-xs text-muted-foreground">
              Booking reference: {bookingId.slice(0, 8).toUpperCase()}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={() => navigate('/client/dashboard')} className="w-full btn-primary">
              <Calendar className="mr-2 h-4 w-4" />
              View My Bookings
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
