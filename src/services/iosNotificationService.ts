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
        // Use Capacitor's LocalNotifications plugin for native platforms
        const permissionStatus = await LocalNotifications.requestPermissions();

        // Handle all possible PermissionState values
        const normalizedDisplay = this.normalizePermissionState(permissionStatus.display);

        return {
          granted: normalizedDisplay === 'granted',
          display: normalizedDisplay
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
        const permissionStatus = await LocalNotifications.checkPermissions();
        console.log('Native permission status:', permissionStatus);

        // Handle all possible PermissionState values
        const normalizedDisplay = this.normalizePermissionState(permissionStatus.display);
        console.log('Normalized permission state:', normalizedDisplay);

        return {
          granted: normalizedDisplay === 'granted',
          display: normalizedDisplay
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
   * Register device for push notifications (for future use)
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // This would typically involve registering with APNs
        // and getting a device token, then sending it to your backend

        // For now, return a placeholder
        // In a real implementation, you'd use something like:
        // const registration = await PushNotifications.register();
        // return registration.value; // device token

        console.log('Push notification registration would be implemented here');
        return null;
      }

      return null;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }
}

export default IOSNotificationService;