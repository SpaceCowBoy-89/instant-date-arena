import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Check, X } from 'lucide-react';
import { useLocationFromIP } from '@/hooks/useLocationFromIP';
import { useToast } from '@/hooks/use-toast';

interface LocationDetectorProps {
  onLocationSelect: (location: string) => void;
  currentLocation: string;
}

export const LocationDetector = ({ onLocationSelect, currentLocation }: LocationDetectorProps) => {
  const { location, loading, error, refetch } = useLocationFromIP();
  const [accepted, setAccepted] = useState(false);
  const { toast } = useToast();

  const handleAcceptLocation = () => {
    if (location?.displayLocation) {
      onLocationSelect(location.displayLocation);
      setAccepted(true);
      toast({
        title: "Location updated",
        description: `Set location to ${location.displayLocation}`,
      });
    }
  };

  const handleRejectLocation = () => {
    toast({
      title: "Location detection skipped",
      description: "You can manually enter your location below",
    });
  };

  // Don't show if already accepted or if current location matches detected
  if (accepted || (location?.displayLocation && currentLocation === location.displayLocation)) {
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
          We can automatically detect your city and state to help you find nearby matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
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
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAcceptLocation}
                size="sm"
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Use This Location
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