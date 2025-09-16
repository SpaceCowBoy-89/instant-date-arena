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

  const handleAcceptLocation = async () => {
    if (location?.displayLocation && !updating) {
      setUpdating(true);
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Update user's location in database
          const { error } = await supabase
            .from('users')
            .update({ location: location.displayLocation })
            .eq('id', user.id);
            
          if (error) {
            console.error('Error updating location:', error);
            toast({
              title: "Error",
              description: "Failed to save location. Please try again.",
              variant: "destructive",
            });
            return;
          }
          
          // Call the callback to update local state
          onLocationSelect(location.displayLocation);
          setAccepted(true);
          
          toast({
            title: "Location saved",
            description: `Location set to ${location.displayLocation}`,
          });
        }
      } catch (error) {
        console.error('Error saving location:', error);
        toast({
          title: "Error",
          description: "Failed to save location. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleRejectLocation = () => {
    setAccepted(true);
    toast({
      title: "Location detection skipped",
      description: "You can manually enter your location below",
    });
  };

  // Don't show if already accepted, if there's already a current location, or if current location matches detected
  if (accepted || currentLocation || (location?.displayLocation && currentLocation === location.displayLocation)) {
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