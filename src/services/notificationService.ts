import { toast } from '@/hooks/use-toast';
import type { ArenaData } from '@/data/arenas';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import IOSNotificationService from './iosNotificationService';

export interface NotificationPreferences {
  toastEnabled: boolean;
  pushEnabled: boolean;
  arenaAlerts: boolean;
  reminderMinutes: number; // Minutes before arena starts
}

class NotificationService {
  private preferences: NotificationPreferences = {
    toastEnabled: true,
    pushEnabled: false,
    arenaAlerts: true,
    reminderMinutes: 5
  };

  private notificationPermission: NotificationPermission = 'default';
  private registeredNotifications = new Map<string, number>(); // arenaId -> timeoutId

  constructor() {
    this.loadPreferences();
    this.checkNotificationPermission();
    this.syncWithSupabaseSettings();
  }

  // Load preferences from localStorage
  private loadPreferences() {
    try {
      const saved = localStorage.getItem('arena_notification_preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
    }
  }

  // Save preferences to localStorage
  private savePreferences() {
    try {
      localStorage.setItem('arena_notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save notification preferences:', error);
    }
  }

  // Check current notification permission
  private async checkNotificationPermission() {
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await IOSNotificationService.checkPermissions();
        this.notificationPermission = permissions.granted ? 'granted' : permissions.display === 'denied' ? 'denied' : 'default';
      } catch (error) {
        console.error('Error checking iOS notification permissions:', error);
        this.notificationPermission = 'default';
      }
    } else if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  // Sync with Supabase global notification settings
  private async syncWithSupabaseSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData, error } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !userData?.preferences) return;

      const globalPrefs = userData.preferences as any;
      const notifications = globalPrefs.notifications || {};

      // Sync push notification setting with global settings
      if (typeof notifications.push === 'boolean') {
        this.preferences.pushEnabled = notifications.push;
        this.savePreferences();
      }
    } catch (error) {
      console.warn('Failed to sync with Supabase notification settings:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      // Use iOS notification service for native platforms
      try {
        const permissions = await IOSNotificationService.requestPermissions();
        this.notificationPermission = permissions.granted ? 'granted' : permissions.display === 'denied' ? 'denied' : 'default';

        if (permissions.granted) {
          this.preferences.pushEnabled = true;
          this.savePreferences();

          // Show confirmation toast
          if (this.preferences.toastEnabled) {
            toast({
              title: "Notifications Enabled! 🔔",
              description: "You'll receive alerts when arenas become available.",
              duration: 4000,
            });
          }

          return true;
        } else {
          if (this.preferences.toastEnabled) {
            toast({
              title: "Notifications Required",
              description: "Enable notifications in Settings > SpeedHeart to get arena alerts.",
              variant: "destructive",
              duration: 6000,
            });
          }
          return false;
        }
      } catch (error) {
        console.error('Error requesting iOS notification permission:', error);
        return false;
      }
    } else {
      // Web fallback
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      if (this.notificationPermission === 'granted') {
        return true;
      }

      try {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;

        if (permission === 'granted') {
          this.preferences.pushEnabled = true;
          this.savePreferences();

          // Show confirmation toast
          if (this.preferences.toastEnabled) {
            toast({
              title: "Notifications Enabled! 🔔",
              description: "You'll receive alerts when arenas become available.",
              duration: 4000,
            });
          }

          return true;
        } else {
          if (this.preferences.toastEnabled) {
            toast({
              title: "Notifications Blocked",
              description: "Enable notifications in your browser settings to get arena alerts.",
              variant: "destructive",
              duration: 6000,
            });
          }
          return false;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
  }

  // Update notification preferences
  updatePreferences(newPreferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();

    // Sync push notifications setting with global Supabase settings
    if ('pushEnabled' in newPreferences) {
      this.syncPushSettingToSupabase(newPreferences.pushEnabled!);
    }
  }

  // Sync push notification setting to Supabase
  private async syncPushSettingToSupabase(pushEnabled: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current preferences
      const { data: currentUser, error: fetchError } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching current preferences:", fetchError);
        return;
      }

      // Merge with existing preferences
      const currentPrefs = (currentUser?.preferences as any) || {};
      const updatedPreferences = {
        ...currentPrefs,
        notifications: {
          ...currentPrefs.notifications,
          push: pushEnabled,
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
        console.error("Error syncing arena push setting to Supabase:", error);
      } else {
        console.log('Synced arena push setting to global Supabase preferences:', pushEnabled);
      }
    } catch (error) {
      console.error("Error syncing push setting to Supabase:", error);
    }
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Schedule notification for arena start with database persistence
  async scheduleArenaNotification(arena: ArenaData, nextStartTime: Date): Promise<boolean> {
    if (!this.preferences.arenaAlerts) return false;

    const arenaId = arena.id;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Save to database for persistence
      const { data, error } = await supabase.rpc('schedule_arena_notification', {
        p_user_id: user.id,
        p_arena_id: arenaId,
        p_scheduled_for: nextStartTime.toISOString()
      });

      if (error) {
        console.error('Error saving notification request to database:', error);
        // Continue with local scheduling even if database save fails
      }

      // Check if notification is already scheduled locally to prevent duplicates
      if (this.isArenaNotificationScheduled(arenaId)) {
        return true;
      }

      // Clear existing notification for this arena
      this.clearArenaNotification(arenaId);

      const now = new Date();
      const reminderTime = new Date(nextStartTime.getTime() - this.preferences.reminderMinutes * 60000);
      const startTime = nextStartTime;

      // Schedule reminder notification
      if (reminderTime > now) {
        const reminderDelay = reminderTime.getTime() - now.getTime();
        const reminderTimeoutId = setTimeout(() => {
          this.sendArenaReminder(arena, this.preferences.reminderMinutes);
        }, reminderDelay);

        this.registeredNotifications.set(`${arenaId}_reminder`, reminderTimeoutId as any);
      }

      // Schedule start notification
      if (startTime > now) {
        const startDelay = startTime.getTime() - now.getTime();
        const startTimeoutId = setTimeout(() => {
          this.sendArenaStartNotification(arena);
        }, startDelay);

        this.registeredNotifications.set(`${arenaId}_start`, startTimeoutId as any);
      }

      return true;
    } catch (error) {
      console.error('Error scheduling arena notification:', error);
      return false;
    }
  }

  // Clear scheduled notifications for an arena with database update
  async clearArenaNotification(arenaId: string): Promise<void> {
    const reminderKey = `${arenaId}_reminder`;
    const startKey = `${arenaId}_start`;

    // Clear local timeouts
    if (this.registeredNotifications.has(reminderKey)) {
      clearTimeout(this.registeredNotifications.get(reminderKey));
      this.registeredNotifications.delete(reminderKey);
    }

    if (this.registeredNotifications.has(startKey)) {
      clearTimeout(this.registeredNotifications.get(startKey));
      this.registeredNotifications.delete(startKey);
    }

    // Update database to mark notification as inactive
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('cancel_arena_notification', {
          p_user_id: user.id,
          p_arena_id: arenaId
        });
      }
    } catch (error) {
      console.error('Error cancelling arena notification in database:', error);
    }
  }

  // Check if notifications are already scheduled for an arena (with database check)
  async isArenaNotificationScheduled(arenaId: string): Promise<boolean> {
    // Check local scheduling first
    const reminderKey = `${arenaId}_reminder`;
    const startKey = `${arenaId}_start`;
    const hasLocalNotifications = this.registeredNotifications.has(reminderKey) || this.registeredNotifications.has(startKey);

    if (hasLocalNotifications) return true;

    // Check database for persistence
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('arena_notification_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('arena_id', arenaId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking arena notification status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking arena notification status:', error);
      return false;
    }
  }

  // Synchronous version for backward compatibility
  isArenaNotificationScheduledSync(arenaId: string): boolean {
    const reminderKey = `${arenaId}_reminder`;
    const startKey = `${arenaId}_start`;
    return this.registeredNotifications.has(reminderKey) || this.registeredNotifications.has(startKey);
  }

  // Send arena reminder notification
  private sendArenaReminder(arena: ArenaData, minutes: number) {
    const message = `${arena.name} starts in ${minutes} minute${minutes !== 1 ? 's' : ''}! Get ready to join.`;

    // Toast notification
    if (this.preferences.toastEnabled) {
      toast({
        title: `⏰ ${arena.name} Starting Soon`,
        description: message,
        duration: 8000,
      });
    }

    // Push notification
    if (this.preferences.pushEnabled && this.notificationPermission === 'granted') {
      new Notification(`⏰ ${arena.name} Starting Soon`, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `arena_reminder_${arena.id}`,
        requireInteraction: false,
        silent: false
      });
    }
  }

  // Send arena start notification
  private sendArenaStartNotification(arena: ArenaData) {
    const message = `${arena.name} is now live! Join the ${arena.schedule.sessionDurationMinutes}-minute session now.`;

    // Toast notification
    if (this.preferences.toastEnabled) {
      toast({
        title: `🚀 ${arena.name} is Live!`,
        description: message,
        duration: 10000,
      });
    }

    // Push notification
    if (this.preferences.pushEnabled && this.notificationPermission === 'granted') {
      new Notification(`🚀 ${arena.name} is Live!`, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `arena_start_${arena.id}`,
        requireInteraction: true,
        silent: false
      });
    }
  }

  // Send notification when user requests to be notified
  async sendNotifyMeConfirmation(arena: ArenaData): Promise<void> {
    if (this.preferences.toastEnabled) {
      toast({
        title: "Notification Set! 🔔",
        description: `We'll alert you when ${arena.name} becomes available.`,
        duration: 5000,
      });
    }
  }

  // Clear all scheduled notifications
  clearAllNotifications() {
    for (const timeoutId of this.registeredNotifications.values()) {
      clearTimeout(timeoutId);
    }
    this.registeredNotifications.clear();
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true; // Always supported on native platforms via Capacitor
    }
    return 'Notification' in window;
  }

  // Get notification permission status
  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission;
  }

  // Send a general notification (for verification, matches, etc.)
  sendNotification(title: string, message: string, options: {
    showToast?: boolean;
    showPush?: boolean;
    duration?: number;
    variant?: 'default' | 'destructive';
    tag?: string;
    icon?: string;
  } = {}) {
    const {
      showToast = true,
      showPush = true,
      duration = 5000,
      variant = 'default',
      tag = 'general',
      icon = '/favicon.ico'
    } = options;

    // Toast notification
    if (showToast && this.preferences.toastEnabled) {
      toast({
        title,
        description: message,
        duration,
        variant
      });
    }

    // Push notification
    if (showPush && this.preferences.pushEnabled && this.notificationPermission === 'granted') {
      new Notification(title, {
        body: message,
        icon,
        badge: icon,
        tag,
        requireInteraction: false,
        silent: false
      });
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

export default notificationService;