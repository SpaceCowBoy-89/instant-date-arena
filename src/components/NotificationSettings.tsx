import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Bell, Smartphone, Clock, Settings } from 'lucide-react';
import { notificationService, type NotificationPreferences } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    setIsSupported(notificationService.isNotificationSupported());
    setPermission(notificationService.getNotificationPermission());
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationService.updatePreferences(newPreferences);

    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved.",
      duration: 3000,
    });
  };

  const handleEnablePushNotifications = async () => {
    const granted = await notificationService.requestNotificationPermission();
    setPermission(notificationService.getNotificationPermission());

    if (granted) {
      handlePreferenceChange('pushEnabled', true);
    }
  };

  const reminderOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' }
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toast Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="toast-notifications" className="text-sm font-medium">
              Toast Notifications
            </Label>
          </div>
          <Switch
            id="toast-notifications"
            checked={preferences.toastEnabled}
            onCheckedChange={(checked) => handlePreferenceChange('toastEnabled', checked)}
          />
        </div>
        <p className="text-xs text-muted-foreground ml-6">
          Show notification banners in the app
        </p>

        {/* Push Notifications */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="push-notifications" className="text-sm font-medium">
                Push Notifications
              </Label>
            </div>
            {permission === 'granted' ? (
              <Switch
                id="push-notifications"
                checked={preferences.pushEnabled}
                onCheckedChange={(checked) => handlePreferenceChange('pushEnabled', checked)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnablePushNotifications}
                disabled={!isSupported || permission === 'denied'}
              >
                Enable
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {!isSupported && "Not supported in this browser"}
            {isSupported && permission === 'denied' && "Blocked by browser settings"}
            {isSupported && permission === 'default' && "Send notifications even when app is closed"}
            {isSupported && permission === 'granted' && "Notifications enabled"}
          </p>
        </div>

        {/* Arena Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="arena-alerts" className="text-sm font-medium">
              Arena Alerts
            </Label>
          </div>
          <Switch
            id="arena-alerts"
            checked={preferences.arenaAlerts}
            onCheckedChange={(checked) => handlePreferenceChange('arenaAlerts', checked)}
          />
        </div>
        <p className="text-xs text-muted-foreground ml-6">
          Get notified when arenas become available
        </p>

        {/* Reminder Timing */}
        {preferences.arenaAlerts && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reminder Timing</Label>
            <Select
              value={preferences.reminderMinutes.toString()}
              onValueChange={(value) => handlePreferenceChange('reminderMinutes', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label} before
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How early to remind you before an arena starts
            </p>
          </div>
        )}

        {/* Test Notification */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            if (preferences.toastEnabled) {
              toast({
                title: "🔔 Test Notification",
                description: "This is how arena notifications will appear!",
                duration: 4000,
              });
            }

            if (preferences.pushEnabled && permission === 'granted') {
              new Notification("🔔 Test Notification", {
                body: "This is how arena notifications will appear!",
                icon: '/favicon.ico',
                tag: 'test_notification'
              });
            }
          }}
        >
          Test Notifications
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;