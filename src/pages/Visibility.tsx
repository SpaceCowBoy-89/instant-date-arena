import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Capacitor } from "@capacitor/core";

const Visibility = () => {
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load existing settings on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate("/");
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading settings:", error);
        return;
      }

      if (userData?.preferences) {
        const prefs = userData.preferences as any;
        setShowAge(prefs.showAge ?? true);
        setShowDistance(prefs.showDistance ?? true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const showSaved = () => {
    setShowSavedIndicator(true);
    setTimeout(() => setShowSavedIndicator(false), 3000);
  };

  const handleShowAgeToggle = async (checked: boolean) => {
    setShowAge(checked);
    await saveSettings({ showAge: checked, showDistance });
    showSaved();
  };

  const handleShowDistanceToggle = async (checked: boolean) => {
    setShowDistance(checked);
    await saveSettings({ showAge, showDistance: checked });
    showSaved();
  };

  const saveSettings = async (settings: { showAge: boolean; showDistance: boolean }) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to save settings.",
          variant: "destructive",
        });
        return;
      }

      // Simple client-side rate limiting
      const lastUpdate = localStorage.getItem('lastSettingsUpdate');
      const now = Date.now();
      if (lastUpdate && now - parseInt(lastUpdate) < 5000) {
        toast({
          title: "Too Many Updates",
          description: "Please wait before updating your settings again.",
          variant: "destructive",
        });
        return;
      }
      localStorage.setItem('lastSettingsUpdate', now.toString());

      // Get current preferences
      const { data: currentUser, error: fetchError } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Error fetching current preferences:", fetchError);
      }

      // Merge new settings
      const currentPrefs = (currentUser?.preferences as any) || {};
      const updatedPreferences = {
        ...currentPrefs,
        showAge: settings.showAge,
        showDistance: settings.showDistance,
      };

      const { error } = await supabase
        .from("users")
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving settings:", error);
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Settings updated:', {
        user_id: user.id,
        updated_fields: Object.keys(settings),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background mobile-container">
      <div className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground truncate">Visibility</h1>
          <p className="text-muted-foreground text-sm">Manage your profile visibility</p>
        </div>
      </div>
      
      <div className="p-4 lg:max-w-3xl lg:mx-auto" style={{ paddingBottom: '8rem' }}>
        {showSavedIndicator && (
          <Alert className="mb-4">
            <AlertDescription>Saved!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-romance" />
                Visibility Settings
              </CardTitle>
              <CardDescription>
                Control how your profile appears to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show my age</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see your age on your profile
                  </p>
                </div>
                <Switch checked={showAge} onCheckedChange={handleShowAgeToggle} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show distance</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see how far away you are
                  </p>
                </div>
                <Switch checked={showDistance} onCheckedChange={handleShowDistanceToggle} />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Visibility;