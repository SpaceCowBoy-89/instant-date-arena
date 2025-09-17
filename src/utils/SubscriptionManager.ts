import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { PresenceState } from '@/types';

interface SubscriptionConfig<T = unknown> {
  channelName: string;
  table?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: T) => void;
  errorCallback?: (error: Error) => void;
  presenceEnabled?: boolean;
  presenceState?: PresenceState;
  debounceMs?: number;
  throttleMs?: number;
  priority?: 'high' | 'medium' | 'low';
  retryAttempts?: number;
  retryDelay?: number;
}

interface ActiveSubscription<T = unknown> {
  channel: RealtimeChannel;
  config: SubscriptionConfig<T>;
  subscribers: number;
  lastActivity: number;
  retryCount: number;
  debounceTimer?: NodeJS.Timeout;
  throttleTimer?: NodeJS.Timeout;
  lastThrottleTime: number;
}

class SubscriptionManager {
  private subscriptions = new Map<string, ActiveSubscription<unknown>>();
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private healthCheckInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private readonly MAX_IDLE_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds
  private readonly CLEANUP_INTERVAL = 2 * 60 * 1000; // 2 minutes
  private readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000;

  constructor() {
    this.startHealthCheck();
    this.startCleanup();
    this.setupGlobalErrorHandling();
  }

  /**
   * Subscribe to a channel with optimizations
   */
  async subscribe<T = unknown>(config: SubscriptionConfig<T>): Promise<string> {
    try {
      const key = this.generateKey(config);
      const existing = this.subscriptions.get(key);

      if (existing) {
        // Reuse existing subscription
        existing.subscribers++;
        existing.lastActivity = Date.now();
        logger.info(`📡 Reusing subscription: ${key} (${existing.subscribers} subscribers)`);
        return key;
      }

      // Create new subscription
      const subscription = await this.createSubscription(config);
      this.subscriptions.set(key, subscription);
      
      logger.info(`📡 Created new subscription: ${key}`);
      return key;
    } catch (error) {
      logger.error('❌ Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(key: string): Promise<void> {
    const subscription = this.subscriptions.get(key);
    if (!subscription) return;

    subscription.subscribers--;
    subscription.lastActivity = Date.now();

    if (subscription.subscribers <= 0) {
      // Mark for cleanup instead of immediate removal
      logger.info(`📡 Marked subscription for cleanup: ${key}`);
    } else {
      logger.info(`📡 Decreased subscribers: ${key} (${subscription.subscribers} remaining)`);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: 0,
      idleSubscriptions: 0,
      totalSubscribers: 0,
      connectionState: this.connectionState,
      byPriority: { high: 0, medium: 0, low: 0 }
    };

    const now = Date.now();
    for (const [key, sub] of this.subscriptions) {
      stats.totalSubscribers += sub.subscribers;
      
      if (sub.subscribers > 0) {
        stats.activeSubscriptions++;
      } else if (now - sub.lastActivity > this.MAX_IDLE_TIME) {
        stats.idleSubscriptions++;
      }

      const priority = sub.config.priority || 'medium';
      stats.byPriority[priority]++;
    }

    return stats;
  }

  /**
   * Force cleanup of idle subscriptions
   */
  async forceCleanup(): Promise<number> {
    const cleaned = await this.cleanupIdleSubscriptions();
    logger.info(`🧹 Force cleanup completed: ${cleaned} subscriptions removed`);
    return cleaned;
  }

  /**
   * Update presence state for a subscription
   */
  async updatePresence(key: string, state: PresenceState): Promise<RealtimeChannelSendResponse | null> {
    const subscription = this.subscriptions.get(key);
    if (!subscription?.config.presenceEnabled) {
      logger.warn(`⚠️ Presence not enabled for subscription: ${key}`);
      return null;
    }

    try {
      const response = await subscription.channel.track(state);
      logger.info(`👥 Updated presence for ${key}:`, state);
      return response;
    } catch (error) {
      logger.error(`❌ Failed to update presence for ${key}:`, error);
      return null;
    }
  }

  /**
   * Get presence state for a subscription
   */
  getPresence(key: string): Record<string, unknown> | null {
    const subscription = this.subscriptions.get(key);
    if (!subscription?.config.presenceEnabled) {
      return null;
    }

    return subscription.channel.presenceState();
  }

  /**
   * Destroy the manager and cleanup all subscriptions
   */
  async destroy(): Promise<void> {
    logger.info('🛑 Destroying SubscriptionManager...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Cleanup all subscriptions
    const cleanupPromises = Array.from(this.subscriptions.entries()).map(
      ([key, sub]) => this.removeSubscription(key, sub)
    );
    
    await Promise.all(cleanupPromises);
    this.subscriptions.clear();
    
    logger.info('✅ SubscriptionManager destroyed');
  }

  private generateKey<T>(config: SubscriptionConfig<T>): string {
    const parts = [
      config.channelName,
      config.table || '',
      config.event || '',
      config.filter || ''
    ];
    return parts.join(':');
  }

  private async createSubscription<T>(config: SubscriptionConfig<T>): Promise<ActiveSubscription<T>> {
    const channel = supabase.channel(config.channelName);
    
    // Setup database changes listener
    if (config.table) {
      const changeConfig = {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
        ...(config.filter && { filter: config.filter })
      };

      channel.on(
        'postgres_changes' as any,
        changeConfig,
        (payload) => {
          this.handleCallback(config, payload as T);
        }
      );
    }

    // Setup presence if enabled
    if (config.presenceEnabled) {
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          this.handleCallback(config, { type: 'presence_sync', state } as T);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          this.handleCallback(config, { type: 'presence_join', key, newPresences } as T);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          this.handleCallback(config, { type: 'presence_leave', key, leftPresences } as T);
        });

      // Subscribe and track presence
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.connectionState = 'connected';
          if (config.presenceState) {
            await channel.track(config.presenceState);
          }
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionState = 'error';
          if (config.errorCallback) {
            config.errorCallback(new Error('Channel subscription failed'));
          }
        } else if (status === 'TIMED_OUT') {
          this.connectionState = 'error';
          if (config.errorCallback) {
            config.errorCallback(new Error('Channel subscription timed out'));
          }
        }
      });
    } else {
      // Subscribe without presence
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connectionState = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionState = 'error';
          if (config.errorCallback) {
            config.errorCallback(new Error('Channel subscription failed'));
          }
        } else if (status === 'TIMED_OUT') {
          this.connectionState = 'error';
          if (config.errorCallback) {
            config.errorCallback(new Error('Channel subscription timed out'));
          }
        }
      });
    }

    return {
      channel,
      config,
      subscribers: 1,
      lastActivity: Date.now(),
      retryCount: 0,
      lastThrottleTime: 0
    };
  }

  private handleCallback<T>(config: SubscriptionConfig<T>, payload: T): void {
    try {
      // Apply debouncing if configured
      if (config.debounceMs) {
        const key = this.generateKey(config);
        const subscription = this.subscriptions.get(key);
        
        if (subscription?.debounceTimer) {
          clearTimeout(subscription.debounceTimer);
        }

        const timer = setTimeout(() => {
          config.callback(payload);
        }, config.debounceMs);

        if (subscription) {
          subscription.debounceTimer = timer;
        }
        return;
      }

      // Apply throttling if configured
      if (config.throttleMs) {
        const key = this.generateKey(config);
        const subscription = this.subscriptions.get(key);
        const now = Date.now();

        if (subscription && now - subscription.lastThrottleTime < config.throttleMs) {
          // Skip this call due to throttling
          return;
        }

        if (subscription) {
          subscription.lastThrottleTime = now;
        }
      }

      // Execute callback
      config.callback(payload);
    } catch (error) {
      logger.error('❌ Error in subscription callback:', error);
      if (config.errorCallback) {
        config.errorCallback(error);
      }
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleSubscriptions();
    }, this.CLEANUP_INTERVAL);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const stats = this.getStats();
      logger.debug('📊 Subscription stats:', stats);

      // Check for failed subscriptions and retry
      for (const [key, subscription] of this.subscriptions) {
        if (subscription.channel.state === 'closed' && subscription.retryCount < (subscription.config.retryAttempts || this.DEFAULT_RETRY_ATTEMPTS)) {
          await this.retrySubscription(key, subscription);
        }
      }
    } catch (error) {
      logger.error('❌ Health check failed:', error);
    }
  }

  private async cleanupIdleSubscriptions(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, subscription] of this.subscriptions) {
      if (subscription.subscribers <= 0 && now - subscription.lastActivity > this.MAX_IDLE_TIME) {
        await this.removeSubscription(key, subscription);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`🧹 Cleaned up ${cleanedCount} idle subscriptions`);
    }

    return cleanedCount;
  }

  private async retrySubscription<T>(key: string, subscription: ActiveSubscription<T>): Promise<void> {
    try {
      subscription.retryCount++;
      const delay = (subscription.config.retryDelay || this.DEFAULT_RETRY_DELAY) * Math.pow(2, subscription.retryCount - 1);
      
      logger.info(`🔄 Retrying subscription ${key} (attempt ${subscription.retryCount}) in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Remove old subscription
      await subscription.channel.unsubscribe();
      
      // Create new subscription
      const newSubscription = await this.createSubscription(subscription.config);
      newSubscription.subscribers = subscription.subscribers;
      newSubscription.retryCount = subscription.retryCount;
      
      this.subscriptions.set(key, newSubscription);
      
      logger.info(`✅ Successfully retried subscription: ${key}`);
    } catch (error) {
      logger.error(`❌ Failed to retry subscription ${key}:`, error);
      if (subscription.config.errorCallback) {
        subscription.config.errorCallback(error);
      }
    }
  }

  private async removeSubscription<T>(key: string, subscription: ActiveSubscription<T>): Promise<void> {
    try {
      // Clear any pending timers
      if (subscription.debounceTimer) {
        clearTimeout(subscription.debounceTimer);
      }
      if (subscription.throttleTimer) {
        clearTimeout(subscription.throttleTimer);
      }

      // Unsubscribe from channel
      await subscription.channel.unsubscribe();
      this.subscriptions.delete(key);
      
      logger.info(`🗑️ Removed subscription: ${key}`);
    } catch (error) {
      logger.error(`❌ Error removing subscription ${key}:`, error);
    }
  }

  private setupGlobalErrorHandling(): void {
    // Monitor connection state changes
    this.connectionState = 'connected';
    logger.info('🟢 SubscriptionManager initialized');
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    subscriptionManager.destroy();
  });
}