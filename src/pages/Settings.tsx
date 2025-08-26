import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings as SettingsIcon, Bell, Eye, Shield, CheckCircle, Share2, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const showSaved = () => {
    setShowSavedIndicator(true);
    setTimeout(() => setShowSavedIndicator(false), 3000);
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
    showSaved();
  };

  const handleShowAgeToggle = async (checked: boolean) => {
    setShowAge(checked);
    await saveSettings({ notifications, showAge: checked, showDistance });
    showSaved();
  };

  const handleShowDistanceToggle = async (checked: boolean) => {
    setShowDistance(checked);
    await saveSettings({ notifications, showAge, showDistance: checked });
    showSaved();
  };

  const handleResetDefaults = async () => {
    setNotifications(true);
    setShowAge(true);
    setShowDistance(true);
    await saveSettings({ notifications: true, showAge: true, showDistance: true });
    toast({
      title: "Reset complete",
      description: "Settings reset to default values.",
    });
    showSaved();
  };

  const saveSettings = async (settings: { notifications: boolean; showAge: boolean; showDistance: boolean }) => {
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

      // Simple client-side rate limiting (fallback)
      const lastUpdate = localStorage.getItem('lastSettingsUpdate');
      const now = Date.now();
      if (lastUpdate && now - parseInt(lastUpdate) < 5000) { // 5 second cooldown
        toast({
          title: "Too Many Updates",
          description: "Please wait before updating your settings again.",
          variant: "destructive",
        });
        return;
      }
      localStorage.setItem('lastSettingsUpdate', now.toString());

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
        notifications: settings.notifications,
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

      // Log settings update (simple logging)
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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

  const filteredSections = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return {
      preferences: lowerQuery === '' || ['preferences', 'visibility', 'notifications', 'age', 'distance', 'messages', 'matches', 'mentions'].some(term => term.includes(lowerQuery)),
      verification: lowerQuery === '' || ['verification', 'selfie', 'phone', 'email', 'social'].some(term => term.includes(lowerQuery)),
      account: lowerQuery === '' || ['account', 'legal', 'privacy', 'terms'].some(term => term.includes(lowerQuery)),
      help: lowerQuery === '' || ['help', 'safety', 'support', 'faq'].some(term => term.includes(lowerQuery)),
      share: lowerQuery === '' || ['share', 'facebook', 'x', 'twitter', 'instagram', 'whatsapp', 'copy'].some(term => term.includes(lowerQuery)),
    };
  };

  const filters = filteredSections(searchQuery);

  return (
    <div className="min-h-screen bg-background mobile-container header-safe">
      <div className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground truncate">Settings</h1>
          <p className="text-muted-foreground text-sm">Customize your dating preferences</p>
        </div>
      </div>
      
      <div className="p-4 pb-32 md:pb-20 lg:max-w-3xl lg:mx-auto">
        {showSavedIndicator && (
          <Alert className="mb-4">
            <AlertDescription>Saved!</AlertDescription>
          </Alert>
        )}

        <Input
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-6"
        />

        <div className="space-y-6">
          {filters.preferences && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-romance" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Manage visibility and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/visibility')}>
                    <h3 className="font-semibold">Visibility</h3>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                  <div className="space-y-4 mt-4">
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
                  </div>
                </div>

                <div>
                  <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/notifications')}>
                    <h3 className="font-semibold">Notifications</h3>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                  <div className="space-y-4 mt-4">
                    <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/notifications/messages')}>
                      messages
                    </Button>
                    <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/notifications/matches')}>
                      matches
                    </Button>
                    <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/notifications/mentions')}>
                      mentions
                    </Button>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about new matches and messages
                        </p>
                      </div>
                      <Switch checked={notifications} onCheckedChange={handleNotificationToggle} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {filters.verification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-romance" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/verification')}>
                  <span>Verification</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/verification/selfie')}>
                  Selfie verification
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/verification/phone')}>
                  Phone number
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/verification/email')}>
                  Email
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/verification/social')}>
                  Social Media Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {filters.account && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-romance" />
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
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Legal</h3>
                  <Button 
                    variant="link" 
                    className="w-full justify-start p-0"
                    onClick={() => navigate("/privacy-policy")}
                  >
                    Privacy Policy →
                  </Button>
                  <Button 
                    variant="link" 
                    className="w-full justify-start p-0"
                    onClick={() => navigate("/terms")}
                  >
                    Terms of Service →
                  </Button>
                </div>

                <Button variant="soft" className="w-full justify-start" onClick={handleSignOut}>
                  Sign Out
                </Button>
                
                <Button 
                  variant="soft" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => navigate("/account-deletion-request")}
                >
                  Request Account Deletion
                </Button>
              </CardContent>
            </Card>
          )}

          {filters.help && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-romance" />
                  Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="link" 
                  className="w-full justify-start p-0"
                  onClick={() => navigate("/safety-center")}
                >
                  Safety Center →
                </Button>
                <Button 
                  variant="link" 
                  className="w-full justify-start p-0"
                  onClick={() => navigate("/support")}
                >
                  Support →
                </Button>
                <Button 
                  variant="link" 
                  className="w-full justify-start p-0"
                  onClick={() => navigate("/faq")}
                >
                  FAQ →
                </Button>
              </CardContent>
            </Card>
          )}

          {filters.share && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-romance" />
                  Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/share')}>
                  <span>Share</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/share/app')}>
                  Share App
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/share/facebook')}>
                  Facebook
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/share/x')}>
                  X(twitter)
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/share/instagram')}>
                  Instagram
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/share/whatsapp')}>
                  Whatsapp
                </Button>
                <Button variant="link" className="w-full justify-start p-0" onClick={() => navigate('/share/copy')}>
                  Copy Link
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reset Button */}
          <div className="flex gap-4">
            <Button variant="soft" onClick={() => navigate("/profile")} className="flex-1">
              Cancel
            </Button>
            <Button variant="outline" onClick={handleResetDefaults} className="flex-1">
              Reset to Defaults
            </Button>
          </div>
          
          {/* Version Info */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">v1.0.7.22.25</p>
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