import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  displayLocation: string;
}

interface LocationResponse {
  success: boolean;
  ip: string;
  location: LocationData | null;
  error?: string;
}

export const useLocationFromIP = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('get-location-from-ip');
      
      if (functionError) {
        throw new Error(functionError.message);
      }

      const response: LocationResponse = data;
      
      if (response.success && response.location) {
        setLocation(response.location);
      } else {
        setError(response.error || 'Failed to get location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refetch: fetchLocation
  };
};