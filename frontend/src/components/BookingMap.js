import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Clock, DollarSign, Loader2, LocateFixed } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';

const libraries = ['places'];

// Default region settings for Australia/New Zealand
const REGION_SETTINGS = {
  region: 'AU', // Bias results to Australia
  componentRestrictions: { country: ['au', 'nz'] }, // Restrict to AU and NZ
  defaultCenter: { lat: -27.9380, lng: 153.3960 }, // Gold Coast, Australia
};

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

const TRAVEL_COST_PER_KM = 1.20; // $1.20 AUD per km
const FREE_TRAVEL_RADIUS_KM = 10; // First 10 km free

export function BookingMap({ 
  stylistLocation, 
  stylistName,
  onTravelInfoChange,
  initialClientAddress = ''
}) {
  const { location: userLocation, loading: locationLoading } = useLocation();
  const [clientAddress, setClientAddress] = useState(initialClientAddress);
  const [clientLocation, setClientLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [travelInfo, setTravelInfo] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);

  const useCurrentLocation = useCallback(() => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      setClientLocation({ lat: userLocation.lat, lng: userLocation.lng });
      setClientAddress(userLocation.address || 'Current Location');
    }
  }, [userLocation]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
    region: REGION_SETTINGS.region, // Bias API to Australia
  });

  const defaultCenter = stylistLocation || REGION_SETTINGS.defaultCenter;

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  // Geocode client address with Australia/NZ region bias
  const geocodeAddress = useCallback(async (address) => {
    if (!window.google || !address) return null;
    
    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ 
        address,
        region: REGION_SETTINGS.region,
        componentRestrictions: REGION_SETTINGS.componentRestrictions,
      }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            formattedAddress: results[0].formatted_address,
          });
        } else {
          reject(new Error('Could not find address in Australia or New Zealand'));
        }
      });
    });
  }, []);

  // Calculate route and travel info
  const calculateRoute = useCallback(async () => {
    if (!clientAddress || !stylistLocation || !window.google) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // Geocode client address
      const clientLoc = await geocodeAddress(clientAddress);
      setClientLocation(clientLoc);
      
      // Calculate directions
      const directionsService = new window.google.maps.DirectionsService();
      
      const result = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: { lat: stylistLocation.lat, lng: stylistLocation.lng },
            destination: { lat: clientLoc.lat, lng: clientLoc.lng },
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK') {
              resolve(result);
            } else {
              reject(new Error('Could not calculate route'));
            }
          }
        );
      });
      
      setDirections(result);
      
      // Extract travel info
      const route = result.routes[0].legs[0];
      const distanceKm = route.distance.value / 1000; // Convert meters to km
      const durationMinutes = Math.ceil(route.duration.value / 60);
      
      // Calculate travel cost in AUD
      let travelCost = 0;
      if (distanceKm > FREE_TRAVEL_RADIUS_KM) {
        travelCost = (distanceKm - FREE_TRAVEL_RADIUS_KM) * TRAVEL_COST_PER_KM;
      }
      
      const info = {
        distance: distanceKm.toFixed(1),
        distanceText: route.distance.text,
        duration: durationMinutes,
        durationText: route.duration.text,
        travelCost: travelCost.toFixed(2),
        clientAddress: clientLoc.formattedAddress,
        clientLocation: clientLoc,
      };
      
      setTravelInfo(info);
      
      if (onTravelInfoChange) {
        onTravelInfoChange(info);
      }
      
      // Fit map to show both markers
      if (map) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: stylistLocation.lat, lng: stylistLocation.lng });
        bounds.extend({ lat: clientLoc.lat, lng: clientLoc.lng });
        map.fitBounds(bounds, { padding: 50 });
      }
      
    } catch (err) {
      setError(err.message || 'Failed to calculate route');
      setTravelInfo(null);
      setDirections(null);
    } finally {
      setIsCalculating(false);
    }
  }, [clientAddress, stylistLocation, geocodeAddress, map, onTravelInfoChange]);


  if (loadError) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Failed to load Google Maps</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-6 flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardContent className="p-0">
        {/* Map */}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          options={{
            styles: darkMapStyles,
            disableDefaultUI: true,
            zoomControl: true,
          }}
          onLoad={onMapLoad}
        >
          {/* Stylist Marker */}
          {stylistLocation && (
            <Marker
              position={stylistLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#FFB366" stroke="#000" stroke-width="1">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3" fill="#000"></circle>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              title={`${stylistName}'s Location`}
            />
          )}
          
          {/* Client Marker */}
          {clientLocation && (
            <Marker
              position={clientLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#4CAF50" stroke="#000" stroke-width="1">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3" fill="#000"></circle>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              title="Your Location"
            />
          )}
          
          {/* Route */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#FFB366',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}
        </GoogleMap>

        {/* Address Input */}
        <div className="p-4 space-y-4 bg-card">
          <div className="space-y-2">
            <Label htmlFor="client-address">Your Address</Label>
            <div className="flex gap-2">
              <Input
                id="client-address"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Enter your address"
                className="flex-1"
                data-testid="client-address-input"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={useCurrentLocation}
                disabled={isCalculating}
                title="Use current location"
                data-testid="use-current-location-btn"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button
            onClick={calculateRoute}
            disabled={!clientAddress || isCalculating}
            className="w-full btn-primary"
            data-testid="calculate-route-btn"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Calculate Distance & Travel Cost
              </>
            )}
          </Button>
          
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          
          {/* Travel Info Display */}
          {travelInfo && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <MapPin className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">{travelInfo.distanceText}</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">{travelInfo.durationText}</p>
                <p className="text-xs text-muted-foreground">ETA</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <DollarSign className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">
                  {parseFloat(travelInfo.travelCost) > 0 ? `$${travelInfo.travelCost}` : 'FREE'}
                </p>
                <p className="text-xs text-muted-foreground">Travel Fee</p>
              </div>
            </div>
          )}
          
          {travelInfo && parseFloat(travelInfo.travelCost) === 0 && (
            <p className="text-xs text-center text-green-500">
              ✓ First {FREE_TRAVEL_RADIUS_KM} km are free!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
