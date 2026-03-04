import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Car, Navigation } from 'lucide-react';

export const TRAVEL_MODES = {
  STYLIST_TRAVELS: 'stylist_travels',
  CLIENT_TRAVELS: 'client_travels',
  OWN_ARRANGEMENT: 'own_arrangement',
};

export function TravelPreferenceSelector({ value, onChange, stylistLocation, stylistName }) {
  return (
    <Card className="border-border/40">
      <CardContent className="p-4">
        <Label className="text-base font-semibold mb-4 block">How would you like to meet?</Label>
        <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
          <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${value === TRAVEL_MODES.STYLIST_TRAVELS ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-border'}`}>
            <RadioGroupItem value={TRAVEL_MODES.STYLIST_TRAVELS} id="stylist-travels" className="mt-0.5" />
            <div className="flex-1">
              <label htmlFor="stylist-travels" className="flex items-center gap-2 font-medium cursor-pointer">
                <Car className="h-4 w-4 text-primary" />
                {stylistName} comes to me
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                The stylist will travel to your location. Travel fee applies based on distance (first 10km free, then $1.20/km).
              </p>
            </div>
          </div>

          <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${value === TRAVEL_MODES.CLIENT_TRAVELS ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-border'}`}>
            <RadioGroupItem value={TRAVEL_MODES.CLIENT_TRAVELS} id="client-travels" className="mt-0.5" />
            <div className="flex-1">
              <label htmlFor="client-travels" className="flex items-center gap-2 font-medium cursor-pointer">
                <MapPin className="h-4 w-4 text-primary" />
                I'll go to {stylistName}
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Visit the stylist's workplace. No travel fee charged.
                {stylistLocation?.address && (
                  <span className="block mt-1 text-xs">
                    Location: {stylistLocation.address}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${value === TRAVEL_MODES.OWN_ARRANGEMENT ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-border'}`}>
            <RadioGroupItem value={TRAVEL_MODES.OWN_ARRANGEMENT} id="own-arrangement" className="mt-0.5" />
            <div className="flex-1">
              <label htmlFor="own-arrangement" className="flex items-center gap-2 font-medium cursor-pointer">
                <Navigation className="h-4 w-4 text-primary" />
                I'll arrange my own travel
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                You handle transportation arrangements. No travel fee charged. Enter the meeting location below.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
