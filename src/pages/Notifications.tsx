import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, MessageCircle, Heart, UserPlus, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Notifications = () => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [messagesNotifications, setMessagesNotifications] = useState(true);
  const [matchesNotifications, setMatchesNotifications] = useState(true);
  const [mentionsNotifications, setMentionsNotifications] = useState(true);
  const [arenaNotifications, setArenaNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load existing notification settings on component mount
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
        console.error("Error loading notification settings:", error);
        return;
      }

      if (userData?.preferences) {
        const prefs = userData.preferences as any;
        setPushNotifications(prefs.notifications?.push ?? true);
        setEmailNotifications(prefs.notifications?.email ?? false);
        setInAppNotifications(prefs.notifications?.inApp ?? true);
        setMessagesNotifications(prefs.notifications?.messages ?? true);
        setMatchesNotifications(prefs.notifications?.matches ?? true);
        setMentionsNotifications(prefs.notifications?.mentions ?? true);
        setArenaNotifications(prefs.notifications?.arena ?? true);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
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

  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setPushNotifications(false);
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings to receive push notifications.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Push notifications enabled",
        description: "You'll now receive push notifications for matches and messages.",
      });
    } else {
      toast({
        title: "Push notifications disabled",
        description: "You will no longer receive push notifications.",
      });
    }

    setPushNotifications(checked);
    await saveSettings({
      push: checked,
      email: emailNotifications,
      inApp: inAppNotifications,
      messages: messagesNotifications,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: arenaNotifications
    });
    showSaved();
  };

  const handleEmailToggle = async (checked: boolean) => {
    setEmailNotifications(checked);
    toast({
      title: `Email notifications ${checked ? 'enabled' : 'disabled'}`,
      description: `You will ${checked ? 'now' : 'no longer'} receive email notifications.`,
    });
    await saveSettings({
      push: pushNotifications,
      email: checked,
      inApp: inAppNotifications,
      messages: messagesNotifications,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: arenaNotifications
    });
    showSaved();
  };

  const handleInAppToggle = async (checked: boolean) => {
    setInAppNotifications(checked);
    toast({
      title: `In-app notifications ${checked ? 'enabled' : 'disabled'}`,
      description: `In-app notifications are ${checked ? 'now active' : 'disabled'}.`,
    });
    await saveSettings({
      push: pushNotifications,
      email: emailNotifications,
      inApp: checked,
      messages: messagesNotifications,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: arenaNotifications
    });
    showSaved();
  };

  const handleMessagesToggle = async (checked: boolean) => {
    setMessagesNotifications(checked);
    toast({
      title: `Message notifications ${checked ? 'enabled' : 'disabled'}`,
      description: `You will ${checked ? 'now' : 'no longer'} receive message notifications.`,
    });
    await saveSettings({
      push: pushNotifications,
      email: emailNotifications,
      inApp: inAppNotifications,
      messages: checked,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: arenaNotifications
    });
    showSaved();
  };

  const handleMatchesToggle = async (checked: boolean) => {
    setMatchesNotifications(checked);
    toast({
      title: `Match notifications ${checked ? 'enabled' : 'disabled'}`,
      description: `You will ${checked ? 'now' : 'no longer'} receive match notifications.`,
    });
    await saveSettings({
      push: pushNotifications,
      email: emailNotifications,
      inApp: inAppNotifications,
      messages: messagesNotifications,
      matches: checked,
      mentions: mentionsNotifications,
      arena: arenaNotifications
    });
    showSaved();
  };

  const handleMentionsToggle = async (checked: boolean) => {
    setMentionsNotifications(checked);
    toast({
      title: `Mention notifications ${checked ? 'enabled' : 'disabled'}`,
      description: `You will ${checked ? 'now' : 'no longer'} receive mention notifications.`,
    });
    await saveSettings({
      push: pushNotifications,
      email: emailNotifications,
      inApp: inAppNotifications,
      messages: messagesNotifications,
      matches: matchesNotifications,
      mentions: checked,
      arena: arenaNotifications
    });
    showSaved();
  };

  const handleArenaToggle = async (checked: boolean) => {
    setArenaNotifications(checked);
    toast({
      title: `Arena notifications ${checked ? 'enabled' : 'disabled'}`,
      description: `You will ${checked ? 'now' : 'no longer'} receive arena event notifications.`,
    });
    await saveSettings({
      push: pushNotifications,
      email: emailNotifications,
      inApp: inAppNotifications,
      messages: messagesNotifications,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: checked
    });
    showSaved();
  };

  const saveSettings = async (settings: { push: boolean; email: boolean; inApp: boolean; messages: boolean; matches: boolean; mentions: boolean; arena: boolean }) => {
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
        notifications: {
          ...currentPrefs.notifications,
          push: settings.push,
          email: settings.email,
          inApp: settings.inApp,
          messages: settings.messages,
          matches: settings.matches,
          mentions: settings.mentions,
          arena: settings.arena,
        },
      };

      const { error } = await supabase
        .from("users")
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving notification settings:", error);
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Notification settings updated:', {
        user_id: user.id,
        updated_fields: Object.keys(settings),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleResetDefaults = async () => {
    setPushNotifications(true);
    setEmailNotifications(false);
    setInAppNotifications(true);
    setMessagesNotifications(true);
    setMatchesNotifications(true);
    setMentionsNotifications(true);
    setArenaNotifications(true);
    await saveSettings({
      push: true,
      email: false,
      inApp: true,
      messages: true,
      matches: true,
      mentions: true,
      arena: true
    });
    toast({
      title: "Reset complete",
      description: "Notification settings reset to default values.",
    });
    showSaved();
  };


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
          <h1 className="text-2xl font-bold text-foreground truncate">Notifications</h1>
          <p className="text-muted-foreground text-sm">Manage how you get alerted about matches, messages, and more</p>
        </div>
      </div>
      
      <div className="p-4 pb-32 md:pb-20 lg:max-w-3xl lg:mx-auto">
        {showSavedIndicator && (
          <Alert className="mb-4">
            <AlertDescription>Saved!</AlertDescription>
          </Alert>
        )}


        <div className="space-y-6">
          {
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-romance" />
                  Global Settings
                </CardTitle>
                <CardDescription>
                  Control your overall notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant alerts for matches, messages, and mentions
                    </p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={handlePushToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email for important activities
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={handleEmailToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>In App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications within the app interface when available
                    </p>
                  </div>
                  <Switch checked={inAppNotifications} onCheckedChange={handleInAppToggle} />
                </div>
              </CardContent>
            </Card>
          }

          {
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-romance" />
                  Notification Categories
                </CardTitle>
                <CardDescription>
                  Fine-tune notifications for specific activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-romance" />
                    <span>Messages</span>
                  </div>
                  <Switch checked={messagesNotifications} onCheckedChange={handleMessagesToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-romance" />
                    <span>Matches</span>
                  </div>
                  <Switch checked={matchesNotifications} onCheckedChange={handleMatchesToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-romance" />
                    <span>Mentions</span>
                  </div>
                  <Switch checked={mentionsNotifications} onCheckedChange={handleMentionsToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-romance" />
                    <span>Arena</span>
                  </div>
                  <Switch checked={arenaNotifications} onCheckedChange={handleArenaToggle} />
                </div>
              </CardContent>
            </Card>
          }

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleResetDefaults} className="w-full max-w-md">
              Reset to Defaults
            </Button>
          </div>

        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Notifications;