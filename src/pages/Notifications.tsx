import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, MessageCircle, Heart, UserPlus, Swords, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NotificationSettings from "@/components/NotificationSettings";
import NotificationHistory from "@/components/NotificationHistory";
import { Capacitor } from "@capacitor/core";
import IOSNotificationService from "@/services/iosNotificationService";
import { notificationService } from "@/services/notificationService";

const Notifications = () => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [messagesNotifications, setMessagesNotifications] = useState(true);
  const [groupChatNotifications, setGroupChatNotifications] = useState(true);
  const [matchesNotifications, setMatchesNotifications] = useState(true);
  const [mentionsNotifications, setMentionsNotifications] = useState(true);
  const [arenaNotifications, setArenaNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load existing notification settings on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    loadSettings();
    checkNotificationPermissions();
  }, []);

  // Check permissions when user returns to page/tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check permissions again in case user changed them in settings
        setTimeout(() => {
          checkNotificationPermissions();
        }, 500); // Small delay to ensure app is fully active
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      console.log('Checking notification permissions...');
      const permissions = await IOSNotificationService.checkPermissions();
      console.log('Permission check result:', permissions);

      setPermissionStatus(permissions.display);

      // Only auto-disable if user had notifications enabled but permissions were revoked
      // Don't auto-disable during initial load or if user manually disabled them
      if (!permissions.granted && pushNotifications && permissionStatus === 'granted') {
        console.log('Permissions were revoked - disabling push notifications');
        setPushNotifications(false);

        // Save the updated state
        try {
          await saveSettings({
            push: false,
            email: emailNotifications,
            inApp: inAppNotifications,
            messages: messagesNotifications,
            groupChat: groupChatNotifications,
            matches: matchesNotifications,
            mentions: mentionsNotifications,
            arena: arenaNotifications
          });

          toast({
            title: "Notifications Disabled",
            description: "Push notifications were disabled because permissions were revoked in device settings.",
            variant: "destructive",
          });
        } catch (saveError) {
          console.error('Failed to save permission revocation update:', saveError);
        }
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setPermissionStatus('unknown');

      // Don't show error toast during initial load
      if (permissionStatus !== 'unknown') {
        toast({
          title: "Permission Check Failed",
          description: "Unable to check notification permissions. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

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
        setGroupChatNotifications(prefs.notifications?.groupChat ?? true);
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
    try {
      if (Capacitor.isNativePlatform()) {
        // Use iOS notification service for native platforms
        const permissionStatus = await IOSNotificationService.requestPermissions();

        if (permissionStatus.granted) {
          toast({
            title: "Notifications enabled! 🔔",
            description: "You'll receive alerts for matches, messages, and activity updates.",
          });
        } else {
          toast({
            title: "Notification permissions required",
            description: "Please enable notifications in Settings to stay updated with matches and messages.",
            variant: "destructive",
          });
        }

        return permissionStatus.granted;
      } else {
        // Fallback for web
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
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permissions. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const showSaved = () => {
    setShowSavedIndicator(true);
    setTimeout(() => setShowSavedIndicator(false), 3000);
  };

  const sendTestNotification = async () => {
    try {
      const success = await IOSNotificationService.scheduleTestNotification();

      if (success) {
        toast({
          title: "Test notification sent! 🎉",
          description: "Check your notification center to verify it's working.",
        });
      } else {
        toast({
          title: "Test failed",
          description: "Please ensure notifications are enabled first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      // Request permission before enabling
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        // Don't change the state - keep toggle off
        toast({
          title: "Permission Required",
          description: "Please enable notifications in your device settings to receive push notifications.",
          variant: "destructive",
        });
        return;
      }

      // Permission granted - enable the toggle
      setPushNotifications(true);

      try {
        await saveSettings({
          push: true,
          email: emailNotifications,
          inApp: inAppNotifications,
          messages: messagesNotifications,
          groupChat: groupChatNotifications,
          matches: matchesNotifications,
          mentions: mentionsNotifications,
          arena: arenaNotifications
        });

        // Sync with arena notification service
        notificationService.updatePreferences({ pushEnabled: true });

        toast({
          title: "Push notifications enabled",
          description: "You'll now receive push notifications for matches and messages.",
        });
        showSaved();
      } catch (error) {
        console.error('Error saving push notification setting:', error);
        setPushNotifications(false); // Revert on save error
        toast({
          title: "Error",
          description: "Failed to save notification setting. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Disabling notifications - always allow this
      setPushNotifications(false);

      try {
        await saveSettings({
          push: false,
          email: emailNotifications,
          inApp: inAppNotifications,
          messages: messagesNotifications,
          groupChat: groupChatNotifications,
          matches: matchesNotifications,
          mentions: mentionsNotifications,
          arena: arenaNotifications
        });

        // Sync with arena notification service
        notificationService.updatePreferences({ pushEnabled: false });

        toast({
          title: "Push notifications disabled",
          description: "You will no longer receive push notifications.",
        });
        showSaved();
      } catch (error) {
        console.error('Error saving push notification setting:', error);
        setPushNotifications(true); // Revert on save error
        toast({
          title: "Error",
          description: "Failed to save notification setting. Please try again.",
          variant: "destructive",
        });
      }
    }

    // Always refresh permission status after any toggle attempt
    setTimeout(() => {
      checkNotificationPermissions();
    }, 500);
  };

  // Update all other toggle handlers to use the improved saveSettings function
  const handleEmailToggle = async (checked: boolean) => {
    setEmailNotifications(checked);
    const success = await saveSettings({
      push: pushNotifications,
      email: checked,
      inApp: inAppNotifications,
      messages: messagesNotifications,
      groupChat: groupChatNotifications,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: arenaNotifications
    });
    
    if (success) {
      toast({
        title: `Email notifications ${checked ? 'enabled' : 'disabled'}`,
        description: `You will ${checked ? 'now' : 'no longer'} receive email notifications.`,
      });
      showSaved();
    } else {
      // Revert on failure
      setEmailNotifications(!checked);
    }
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
      groupChat: groupChatNotifications,
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
      groupChat: groupChatNotifications,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: arenaNotifications
    });
    showSaved();
  };

  const handleGroupChatToggle = async (checked: boolean) => {
    setGroupChatNotifications(checked);
    toast({
      title: `Group chat notifications ${checked ? 'enabled' : 'disabled'}`,
      description: `You will ${checked ? 'now' : 'no longer'} receive group chat notifications.`,
    });
    await saveSettings({
      push: pushNotifications,
      email: emailNotifications,
      inApp: inAppNotifications,
      messages: messagesNotifications,
      groupChat: checked,
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
      groupChat: groupChatNotifications,
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
      groupChat: groupChatNotifications,
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
      groupChat: groupChatNotifications,
      matches: matchesNotifications,
      mentions: mentionsNotifications,
      arena: checked
    });
    showSaved();
  };

  const saveSettings = async (settings: { push: boolean; email: boolean; inApp: boolean; messages: boolean; groupChat: boolean; matches: boolean; mentions: boolean; arena: boolean }) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to save settings.",
          variant: "destructive",
        });
        return false;
      }

      // Simple client-side rate limiting
      const lastUpdate = localStorage.getItem('lastSettingsUpdate');
      const now = Date.now();
      if (lastUpdate && now - parseInt(lastUpdate) < 2000) { // Reduced to 2 seconds
        toast({
          title: "Please wait",
          description: "Please wait before updating your settings again.",
          variant: "destructive",
        });
        return false;
      }
      localStorage.setItem('lastSettingsUpdate', now.toString());

      // Get current preferences
      const { data: currentUser, error: fetchError } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching current preferences:", fetchError);
        toast({
          title: "Error",
          description: "Failed to load current settings. Please try again.",
          variant: "destructive",
        });
        return false;
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
          groupChat: settings.groupChat,
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
        return false;
      }

      console.log('Notification settings updated:', {
        user_id: user.id,
        updated_fields: Object.keys(settings),
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving settings.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleResetDefaults = async () => {
    setPushNotifications(true);
    setEmailNotifications(false);
    setInAppNotifications(true);
    setMessagesNotifications(true);
    setGroupChatNotifications(true);
    setMatchesNotifications(true);
    setMentionsNotifications(true);
    setArenaNotifications(true);
    await saveSettings({
      push: true,
      email: false,
      inApp: true,
      messages: true,
      groupChat: true,
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
          <h1 className="text-2xl font-bold text-foreground truncate">Notifications</h1>
          <p className="text-muted-foreground text-sm">Manage how you get alerted about matches, messages, and more</p>
        </div>
      </div>
      
      <div className="p-4 lg:max-w-3xl lg:mx-auto" style={{ paddingBottom: '8rem' }}>
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
                <div className="flex items-center justify-between py-3 min-h-[60px]">
                  <div className="space-y-0.5 flex-1 pr-4">
                    <Label className="text-base font-medium">Push notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant alerts for matches, messages, and mentions
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={pushNotifications} onCheckedChange={handlePushToggle} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 min-h-[60px]">
                  <div className="space-y-0.5 flex-1 pr-4">
                    <Label className="text-base font-medium">Email notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email for important activities
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={emailNotifications} onCheckedChange={handleEmailToggle} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 min-h-[60px]">
                  <div className="space-y-0.5 flex-1 pr-4">
                    <Label className="text-base font-medium">In App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications within the app interface when available
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={inAppNotifications} onCheckedChange={handleInAppToggle} />
                  </div>
                </div>

                {/* Permission Status and Test for Native Platforms */}
                {Capacitor.isNativePlatform() && (
                  <>
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Permission Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Current notification permission: <span className="font-medium capitalize">{permissionStatus}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={checkNotificationPermissions}
                            className="h-10 px-4 min-w-[80px] pointer-events-auto touch-target"
                          >
                            Refresh
                          </Button>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            permissionStatus === 'granted'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : permissionStatus === 'denied'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {permissionStatus === 'granted' ? '✓ Enabled' : 
                             permissionStatus === 'denied' ? '✗ Denied' : 
                             permissionStatus === 'prompt' ? '? Needs Permission' : 
                             '? Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {permissionStatus === 'granted' && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Test Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Send a test notification to verify everything is working
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={sendTestNotification}>
                          Send Test
                        </Button>
                      </div>
                    )}
                  </>
                )}
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
                <div className="flex items-center justify-between py-3 min-h-[52px]">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-romance shrink-0" />
                    <span className="text-base font-medium">Direct Messages</span>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={messagesNotifications} onCheckedChange={handleMessagesToggle} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 min-h-[52px]">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-romance shrink-0" />
                    <span className="text-base font-medium">Group Chat</span>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={groupChatNotifications} onCheckedChange={handleGroupChatToggle} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 min-h-[52px]">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-romance shrink-0" />
                    <span className="text-base font-medium">Matches</span>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={matchesNotifications} onCheckedChange={handleMatchesToggle} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 min-h-[52px]">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-romance shrink-0" />
                    <span className="text-base font-medium">Mentions</span>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={mentionsNotifications} onCheckedChange={handleMentionsToggle} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 min-h-[52px]">
                  <div className="flex items-center gap-3">
                    <Swords className="h-5 w-5 text-romance shrink-0" />
                    <span className="text-base font-medium">Arena</span>
                  </div>
                  <div className="shrink-0">
                    <Switch checked={arenaNotifications} onCheckedChange={handleArenaToggle} />
                  </div>
                </div>
              </CardContent>
            </Card>
          }

          {/* Recent Notifications */}
          <NotificationHistory />

          {/* Arena Notification Settings */}
          <div className="flex justify-center">
            <NotificationSettings />
          </div>

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