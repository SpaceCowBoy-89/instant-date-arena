import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Check, X, Sparkles } from 'lucide-react';
import { useLocationFromIP } from '@/hooks/useLocationFromIP';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LocationDetectorProps {
  onLocationSelect: (location: string) => void;
  currentLocation: string;
}

export const LocationDetector = ({ onLocationSelect, currentLocation }: LocationDetectorProps) => {
  const { location, loading, error, refetch } = useLocationFromIP();
  const [accepted, setAccepted] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Log the current state for debugging
  console.log('LocationDetector render:', { 
    currentLocation, 
    detectedLocation: location?.displayLocation,
    accepted, 
    loading 
  });

  const handleAcceptLocation = async () => {
    if (!location?.displayLocation || updating) {
      console.warn('LocationDetector: No location available or already updating');
      return;
    }

    setUpdating(true);
    console.log('LocationDetector: Starting location save process', location.displayLocation);
    
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('LocationDetector: Auth error:', authError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        console.error('LocationDetector: No authenticated user found');
        throw new Error('User not authenticated');
      }

      console.log('LocationDetector: Updating database for user:', user.id);
      
      // Update user's location in database
      const { error: updateError, data } = await supabase
        .from('users')
        .update({ 
          location: location.displayLocation,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('location');
        
      if (updateError) {
        console.error('LocationDetector: Database update error:', updateError);
        toast({
          title: "Error",
          description: "Failed to save location. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('LocationDetector: Database updated successfully:', data);
      
      // Call the callback to update local state FIRST
      onLocationSelect(location.displayLocation);
      
      // Then set accepted state to hide the component
      setAccepted(true);
      
      toast({
        title: "Location saved",
        description: `Location set to ${location.displayLocation}`,
      });
      
    } catch (error) {
      console.error('LocationDetector: Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to save location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectLocation = () => {
    console.log('LocationDetector: User rejected location detection');
    setAccepted(true);
    toast({
      title: "Location detection skipped",
      description: "You can manually enter your location below",
    });
  };

  // Don't show if user already has a location saved or if they just accepted one
  if (accepted || (currentLocation && currentLocation.trim() !== '')) {
    console.log('LocationDetector: Not showing because', { accepted, currentLocation });
    return null;
  }

  // Don't show if detected location matches current location
  if (location?.displayLocation && currentLocation && currentLocation === location.displayLocation) {
    console.log('LocationDetector: Not showing because locations match', { 
      detected: location.displayLocation, 
      current: currentLocation 
    });
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Auto-Detect Location
        </CardTitle>
        <CardDescription>
          We can automatically detect your location to help you find nearby matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <Sparkles className="h-4 w-4 animate-spin" />
            Detecting your location...
          </div>
        )}
        
        {error && (
          <div className="space-y-3">
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
        
        {location && !loading && (
          <div className="space-y-3">
            <div className="bg-background p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Detected Location:</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>{location.displayLocation}</div>
                <div className="text-xs mt-1">
                  {location.city}, {location.state} • {location.country}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleAcceptLocation}
                size="sm"
                className="flex-1"
                disabled={updating}
              >
                {updating ? (
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {updating ? "Saving..." : "Use This Location"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRejectLocation}
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Enter Manually
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};