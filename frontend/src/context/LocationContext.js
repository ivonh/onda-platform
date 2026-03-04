import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  lat: -27.9380,
  lng: 153.3960,
  address: 'Gold Coast, QLD, Australia',
  country: 'AU',
};

const SUPPORTED_COUNTRIES = ['AU', 'NZ'];

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      const newLocation = {
        lat: latitude,
        lng: longitude,
        address: '',
        country: 'AU',
      };

      if (window.google?.maps?.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await new Promise((resolve) => {
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === 'OK' && results[0]) {
                  resolve(results[0]);
                } else {
                  resolve(null);
                }
              }
            );
          });

          if (result) {
            newLocation.address = result.formatted_address;
            const countryComponent = result.address_components?.find(
              (c) => c.types.includes('country')
            );
            if (countryComponent) {
              newLocation.country = countryComponent.short_name;
            }
          }
        } catch (geocodeError) {
          console.warn('Geocoding failed:', geocodeError);
        }
      }

      if (!SUPPORTED_COUNTRIES.includes(newLocation.country)) {
        console.log('Location outside supported region, using default');
        setLocation(DEFAULT_LOCATION);
      } else {
        setLocation(newLocation);
      }
    } catch (err) {
      if (err.code === 1) {
        setPermissionDenied(true);
      }
      setError(err.message);
      console.log('Using default location:', DEFAULT_LOCATION.address);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = () => {
    setPermissionDenied(false);
    setError(null);
    setLoading(true);
    detectLocation();
  };

  const setManualLocation = (newLocation) => {
    setLocation({
      ...DEFAULT_LOCATION,
      ...newLocation,
    });
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        permissionDenied,
        requestLocationPermission,
        setManualLocation,
        isAustralia: location.country === 'AU',
        isNewZealand: location.country === 'NZ',
        isSupported: SUPPORTED_COUNTRIES.includes(location.country),
        defaultLocation: DEFAULT_LOCATION,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export { DEFAULT_LOCATION, SUPPORTED_COUNTRIES };
