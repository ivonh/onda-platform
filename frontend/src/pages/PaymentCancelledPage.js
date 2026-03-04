import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

export default function PaymentCancelledPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/40">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-orange-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              Your payment was not processed. Your booking is saved and you can try again anytime from your dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={() => navigate('/client/dashboard')} className="w-full btn-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to My Bookings
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
