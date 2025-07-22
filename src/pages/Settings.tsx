
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings as SettingsIcon, Bell, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load existing settings on component mount
  useEffect(() => {
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
        setNotifications(prefs.notifications ?? true);
        setShowAge(prefs.showAge ?? true);
        setShowDistance(prefs.showDistance ?? true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        // Reset the toggle to off since permission was denied
        setNotifications(false);
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings to receive push notifications.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Notifications enabled",
        description: "You'll now receive push notifications for matches and messages.",
      });
    } else {
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive push notifications.",
      });
    }
    
    setNotifications(checked);
    await saveSettings({ notifications: checked, showAge, showDistance });
  };

  const handleShowAgeToggle = async (checked: boolean) => {
    setShowAge(checked);
    await saveSettings({ notifications, showAge: checked, showDistance });
  };

  const handleShowDistanceToggle = async (checked: boolean) => {
    setShowDistance(checked);
    await saveSettings({ notifications, showAge, showDistance: checked });
  };

  const saveSettings = async (settings?: { notifications: boolean; showAge: boolean; showDistance: boolean }) => {
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

      const settingsToSave = settings || { notifications, showAge, showDistance };

      // Get current preferences first
      const { data: currentUser, error: fetchError } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Error fetching current preferences:", fetchError);
      }

      // Merge new settings with existing preferences
      const currentPrefs = (currentUser?.preferences as any) || {};
      const updatedPreferences = {
        ...currentPrefs,
        notifications: settingsToSave.notifications,
        showAge: settingsToSave.showAge,
        showDistance: settingsToSave.showDistance,
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

      if (!settings) {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
        });
        navigate("/profile");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving settings.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    saveSettings();
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      
      // Redirect to the index/login page
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Customize your dating preferences</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-romance" />
                  Privacy
                </CardTitle>
                <CardDescription>
                  Control what others can see about you
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

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-romance" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Stay updated on your matches and messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new matches and messages
                    </p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={handleNotificationToggle} />
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-romance" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="soft" 
                  className="w-full justify-start"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Change Password
                </Button>
                
                <Button 
                  variant="soft" 
                  className="w-full justify-start"
                  onClick={() => navigate("/privacy")}
                >
                  Privacy Policy
                </Button>
                
                <Button 
                  variant="soft" 
                  className="w-full justify-start"
                  onClick={() => navigate("/terms")}
                >
                  Terms of Service
                </Button>
                
                <Button variant="soft" className="w-full justify-start" onClick={handleSignOut}>
                  Sign Out
                </Button>
                
                <Button 
                  variant="soft" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-4">
              <Button variant="soft" onClick={() => navigate("/profile")} className="flex-1">
                Cancel
              </Button>
              <Button variant="romance" onClick={handleSave} className="flex-1">
                Save Settings
              </Button>
            </div>
            
            {/* Version Info */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">v1.0.7.22.25</p>
            </div>
          </div>
        </div>
      </div>
      
      <ChangePasswordDialog
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
      />
      
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      
      <Navbar />
    </div>
  );
};

export default Settings;
