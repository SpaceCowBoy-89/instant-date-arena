import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationPermissionStatus {
  granted: boolean;
  display: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  badge: boolean;
  alert: boolean;
  provisional: boolean;
}

export class IOSNotificationService {
  /**
   * Request notification permissions from the user
   * Shows the native iOS permission dialog with all notification styles
   */
  static async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Request local notification permissions first
        const localPermissionStatus = await LocalNotifications.requestPermissions();
        console.log('Local notifications permission:', localPermissionStatus);

        const localGranted = this.normalizePermissionState(localPermissionStatus.display) === 'granted';

        // Try to request push notification permissions
        let pushGranted = false;
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const pushPermissionStatus = await PushNotifications.requestPermissions();
          console.log('Push notifications permission:', pushPermissionStatus);
          pushGranted = this.normalizePermissionState(pushPermissionStatus.receive) === 'granted';

          // If push notifications are granted, register for them
          if (pushGranted) {
            await this.registerForPushNotifications();
          }
        } catch (pushError) {
          console.warn('Push notifications not available:', pushError);
          // Fall back to just local notifications
        }

        // Local notifications are sufficient for basic functionality
        const overallGranted = localGranted;
        const displayStatus = this.normalizePermissionState(localPermissionStatus.display);

        return {
          granted: overallGranted,
          display: displayStatus
        };
      } else {
        // Fallback for web
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          const normalizedDisplay = this.normalizePermissionState(permission);
          return {
            granted: normalizedDisplay === 'granted',
            display: normalizedDisplay
          };
        }

        return {
          granted: false,
          display: 'denied'
        };
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        granted: false,
        display: 'unknown'
      };
    }
  }

  /**
   * Check current notification permission status
   */
  static async checkPermissions(): Promise<NotificationPermissionStatus> {
    try {
      console.log('IOSNotificationService: Checking permissions on platform:', Capacitor.getPlatform());

      if (Capacitor.isNativePlatform()) {
        // Check local notification permissions first
        const localPermissionStatus = await LocalNotifications.checkPermissions();
        console.log('Local notification permission status:', localPermissionStatus);

        const localGranted = this.normalizePermissionState(localPermissionStatus.display) === 'granted';

        // Try to check push notification permissions
        let pushGranted = false;
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const pushPermissionStatus = await PushNotifications.checkPermissions();
          console.log('Push notification permission status:', pushPermissionStatus);
          pushGranted = this.normalizePermissionState(pushPermissionStatus.receive) === 'granted';
        } catch (pushError) {
          console.warn('Push notifications not available for checking:', pushError);
        }

        // Local notifications are primary, push is enhancement
        const overallGranted = localGranted;
        const displayStatus = this.normalizePermissionState(localPermissionStatus.display);

        console.log('Overall permission status:', { localGranted, pushGranted, overallGranted, displayStatus });

        return {
          granted: overallGranted,
          display: displayStatus
        };
      } else {
        // Fallback for web
        if ('Notification' in window) {
          const webPermission = Notification.permission;
          console.log('Web notification permission:', webPermission);
          const normalizedDisplay = this.normalizePermissionState(webPermission);
          return {
            granted: normalizedDisplay === 'granted',
            display: normalizedDisplay
          };
        }

        console.log('Notifications not supported in this browser');
        return {
          granted: false,
          display: 'denied'
        };
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return {
        granted: false,
        display: 'unknown'
      };
    }
  }

  /**
   * Normalize permission state to handle all possible values
   */
  private static normalizePermissionState(state: any): 'granted' | 'denied' | 'prompt' | 'unknown' {
    if (typeof state !== 'string') {
      console.warn('Unexpected permission state type:', typeof state, state);
      return 'unknown';
    }

    switch (state.toLowerCase()) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      case 'prompt':
      case 'prompt-with-rationale':
      case 'default': // Some browsers use 'default' instead of 'prompt'
        return 'prompt';
      default:
        console.warn('Unknown permission state:', state);
        return 'unknown';
    }
  }

  /**
   * Get current notification settings (iOS specific)
   * This shows what notification styles the user has selected
   */
  static async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // For now, we'll return a basic structure
        // In a more advanced implementation, you could use a custom plugin
        // to get detailed iOS notification settings
        const permissions = await this.checkPermissions();

        if (permissions.granted) {
          return {
            enabled: true,
            sound: true,  // Assume all are enabled if permission granted
            badge: true,
            alert: true,
            provisional: false
          };
        }

        return {
          enabled: false,
          sound: false,
          badge: false,
          alert: false,
          provisional: false
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  /**
   * Schedule a test notification to verify permissions work
   */
  static async scheduleTestNotification(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await this.checkPermissions();

        if (!permissions.granted) {
          throw new Error('Notification permissions not granted');
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'SpeedHeart',
              body: 'Notifications are working! 🎉',
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
              sound: 'default',
              attachments: undefined,
              actionTypeId: '',
              extra: {}
            }
          ]
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      return false;
    }
  }

  /**
   * Open device settings for the app (iOS)
   * Useful when user needs to change notification settings manually
   */
  static async openAppSettings(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        // This would require a custom plugin to open app-specific settings
        // For now, we'll just log a message
        console.log('Opening app settings would require a custom plugin');

        // Alternative: You could implement a custom Capacitor plugin
        // or use an existing one like @capacitor/app to open app settings
      }
    } catch (error) {
      console.error('Error opening app settings:', error);
    }
  }

  /**
   * Register device for push notifications
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('Registering for push notifications...');

        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');

          // Register with APNs to get device token
          await PushNotifications.register();

          // Set up event listeners for push notifications
          PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token:', token.value);
            // Here you would typically send the token to your backend
            // to register this device for push notifications
            this.savePushToken(token.value);
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on push registration:', error);
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received:', notification);
          });

          PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push notification action performed:', notification);
          });

          // Return a placeholder for now - the actual token comes via the listener
          return 'registration_initiated';
        } catch (importError) {
          console.warn('Push notifications module not available:', importError);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save push token to localStorage and potentially send to backend
   */
  private static async savePushToken(token: string): Promise<void> {
    try {
      localStorage.setItem('push_notification_token', token);
      console.log('Push token saved:', token);

      // TODO: Send token to backend for registration
      // await this.sendTokenToBackend(token);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  /**
   * Get stored push token
   */
  static getPushToken(): string | null {
    return localStorage.getItem('push_notification_token');
  }
}

export default IOSNotificationService;