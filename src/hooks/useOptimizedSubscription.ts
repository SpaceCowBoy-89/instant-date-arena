import { useEffect, useRef, useCallback, useState } from 'react';
import { subscriptionManager } from '@/utils/SubscriptionManager';
import { logger } from '@/utils/logger';
import { PresenceState } from '@/types';

interface UseOptimizedSubscriptionConfig {
  channelName: string;
  table?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  enabled?: boolean;
  presenceEnabled?: boolean;
  presenceState?: PresenceState;
  debounceMs?: number;
  throttleMs?: number;
  priority?: 'high' | 'medium' | 'low';
  retryAttempts?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

interface UseOptimizedSubscriptionReturn {
  isConnected: boolean;
  error: Error | null;
  updatePresence: (state: PresenceState) => Promise<void>;
  getPresence: () => Record<string, unknown> | null;
  reconnect: () => Promise<void>;
  stats: {
    subscriptionKey: string | null;
    lastActivity: number | null;
    subscribers: number | null;
  };
}

export function useOptimizedSubscription<T = unknown>(
  config: UseOptimizedSubscriptionConfig,
  callback: (payload: T) => void
): UseOptimizedSubscriptionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionKeyRef = useRef<string | null>(null);
  const enabledRef = useRef(config.enabled ?? true);
  const callbackRef = useRef(callback);

  // Update refs when props change
  useEffect(() => {
    callbackRef.current = callback;
    enabledRef.current = config.enabled ?? true;
  }, [callback, config.enabled]);

  // Memoized subscription config
  const subscriptionConfig = useRef({
    ...config,
    callback: (payload: T) => {
      try {
        callbackRef.current(payload);
        setError(null);
        setIsConnected(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown callback error');
        setError(error);
        logger.error('Subscription callback error:', error);
        config.onError?.(error);
      }
    },
    errorCallback: (err: Error) => {
      const error = err instanceof Error ? err : new Error('Subscription error');
      setError(error);
      setIsConnected(false);
      config.onError?.(error);
    }
  });

  // Subscribe effect
  useEffect(() => {
    if (!enabledRef.current) {
      return;
    }

    let mounted = true;

    const subscribe = async () => {
      try {
        setError(null);
        const key = await subscriptionManager.subscribe(subscriptionConfig.current);
        
        if (mounted) {
          subscriptionKeyRef.current = key;
          setIsConnected(true);
          logger.info(`✅ Subscription active: ${key}`);
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error('Failed to subscribe');
          setError(error);
          setIsConnected(false);
          logger.error('Subscription failed:', error);
        }
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (subscriptionKeyRef.current) {
        subscriptionManager.unsubscribe(subscriptionKeyRef.current);
        subscriptionKeyRef.current = null;
        setIsConnected(false);
      }
    };
  }, [
    config.channelName,
    config.table,
    config.event,
    config.filter,
    config.presenceEnabled,
    JSON.stringify(config.presenceState), // Stable dependency for object
    config.debounceMs,
    config.throttleMs,
    config.priority,
    config.retryAttempts,
    config.retryDelay
  ]);

  // Update presence
  const updatePresence = useCallback(async (state: PresenceState) => {
    if (!subscriptionKeyRef.current) {
      throw new Error('No active subscription to update presence');
    }

    try {
      await subscriptionManager.updatePresence(subscriptionKeyRef.current, state);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update presence');
      setError(error);
      throw error;
    }
  }, []);

  // Get presence
  const getPresence = useCallback(() => {
    if (!subscriptionKeyRef.current) {
      return null;
    }
    return subscriptionManager.getPresence(subscriptionKeyRef.current);
  }, []);

  // Reconnect
  const reconnect = useCallback(async () => {
    if (subscriptionKeyRef.current) {
      await subscriptionManager.unsubscribe(subscriptionKeyRef.current);
      subscriptionKeyRef.current = null;
    }

    try {
      setError(null);
      const key = await subscriptionManager.subscribe(subscriptionConfig.current);
      subscriptionKeyRef.current = key;
      setIsConnected(true);
      logger.info(`🔄 Reconnected subscription: ${key}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reconnect');
      setError(error);
      setIsConnected(false);
      throw error;
    }
  }, []);

  // Get stats
  const stats = {
    subscriptionKey: subscriptionKeyRef.current,
    lastActivity: null as number | null,
    subscribers: null as number | null
  };

  return {
    isConnected,
    error,
    updatePresence,
    getPresence,
    reconnect,
    stats
  };
}

// Batch subscription hook for multiple subscriptions
export function useBatchSubscriptions<T = unknown>(
  configs: UseOptimizedSubscriptionConfig[],
  callbacks: ((payload: T) => void)[]
): {
  subscriptions: UseOptimizedSubscriptionReturn[];
  globalStats: {
    totalSubscriptions: number;
    connectedCount: number;
    errorCount: number;
  };
  reconnectAll: () => Promise<void>;
} {
  const subscriptions = configs.map((config, index) =>
    useOptimizedSubscription(config, callbacks[index])
  );

  const globalStats = {
    totalSubscriptions: subscriptions.length,
    connectedCount: subscriptions.filter(sub => sub.isConnected).length,
    errorCount: subscriptions.filter(sub => sub.error).length
  };

  const reconnectAll = useCallback(async () => {
    const reconnectPromises = subscriptions.map(sub => 
      sub.reconnect().catch(err => logger.error('Batch reconnect failed:', err))
    );
    await Promise.all(reconnectPromises);
  }, [subscriptions]);

  return {
    subscriptions,
    globalStats,
    reconnectAll
  };
}

// Hook for conditional subscriptions based on user state
export function useConditionalSubscription<T = unknown>(
  baseConfig: UseOptimizedSubscriptionConfig,
  callback: (payload: T) => void,
  conditions: {
    userOnline?: boolean;
    userActive?: boolean;
    pageVisible?: boolean;
    networkOnline?: boolean;
    customCondition?: () => boolean;
  } = {}
): UseOptimizedSubscriptionReturn {
  const [shouldEnable, setShouldEnable] = useState(false);

  // Check all conditions
  useEffect(() => {
    const checkConditions = () => {
      const checks = [
        conditions.userOnline !== false,
        conditions.userActive !== false,
        conditions.pageVisible !== false,
        conditions.networkOnline !== false,
        conditions.customCondition?.() !== false
      ];

      setShouldEnable(checks.every(Boolean));
    };

    checkConditions();

    // Listen for visibility changes
    if (conditions.pageVisible !== undefined) {
      const handleVisibilityChange = () => {
        checkConditions();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [
    conditions.userOnline,
    conditions.userActive,
    conditions.pageVisible,
    conditions.networkOnline,
    conditions.customCondition
  ]);

  return useOptimizedSubscription(
    {
      ...baseConfig,
      enabled: shouldEnable && (baseConfig.enabled ?? true)
    },
    callback
  );
}