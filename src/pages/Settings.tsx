
import { useState } from "react";
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

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = () => {
    // TODO: Save to Supabase database
    console.log("Saving settings:", {
      notifications,
      showAge,
      showDistance,
    });
    navigate("/profile");
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
                  <Switch checked={showAge} onCheckedChange={setShowAge} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show distance</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see how far away you are
                    </p>
                  </div>
                  <Switch checked={showDistance} onCheckedChange={setShowDistance} />
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
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
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
                
                <Button variant="soft" className="w-full justify-start">
                  Privacy Policy
                </Button>
                
                <Button variant="soft" className="w-full justify-start">
                  Terms of Service
                </Button>
                
                <Button variant="soft" className="w-full justify-start" onClick={handleSignOut}>
                  Sign Out
                </Button>
                
                <Button variant="soft" className="w-full justify-start">
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
          </div>
        </div>
      </div>
      
      <ChangePasswordDialog 
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
      />
      
      <Navbar />
    </div>
  );
};

export default Settings;
