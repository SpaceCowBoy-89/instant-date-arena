import { toast } from '@/hooks/use-toast';
import type { ArenaData } from '@/data/arenas';

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
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
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

  // Update notification preferences
  updatePreferences(newPreferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Schedule notification for arena start
  scheduleArenaNotification(arena: ArenaData, nextStartTime: Date) {
    if (!this.preferences.arenaAlerts) return;

    const arenaId = arena.id;

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
  }

  // Clear scheduled notifications for an arena
  clearArenaNotification(arenaId: string) {
    const reminderKey = `${arenaId}_reminder`;
    const startKey = `${arenaId}_start`;

    if (this.registeredNotifications.has(reminderKey)) {
      clearTimeout(this.registeredNotifications.get(reminderKey));
      this.registeredNotifications.delete(reminderKey);
    }

    if (this.registeredNotifications.has(startKey)) {
      clearTimeout(this.registeredNotifications.get(startKey));
      this.registeredNotifications.delete(startKey);
    }
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
  sendNotifyMeConfirmation(arena: ArenaData) {
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