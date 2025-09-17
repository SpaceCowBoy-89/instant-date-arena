import { useEffect, useState, useCallback, useRef } from 'react';
import { useOptimizedSubscription } from './useOptimizedSubscription';
import { logger } from '@/utils/logger';
import { PresenceState } from '@/types';

interface UserPresence extends PresenceState {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  page?: string;
  activity?: string;
  metadata?: Record<string, unknown>;
}

interface PresenceStateMap {
  [key: string]: UserPresence[];
}

interface UsePresenceOptimizationConfig {
  channelName: string;
  initialStatus?: UserPresence['status'];
  updateInterval?: number;
  activityTimeout?: number;
  enableActivityTracking?: boolean;
  enablePageTracking?: boolean;
  debounceMs?: number;
}

interface UsePresenceOptimizationReturn {
  presenceState: PresenceStateMap;
  currentUser: UserPresence | null;
  onlineUsers: UserPresence[];
  updateStatus: (status: UserPresence['status'], metadata?: Record<string, unknown>) => Promise<void>;
  updateActivity: (activity: string) => Promise<void>;
  isUserOnline: (userId: string) => boolean;
  getUserPresence: (userId: string) => UserPresence | null;
  stats: {
    totalUsers: number;
    onlineCount: number;
    awayCount: number;
    busyCount: number;
    offlineCount: number;
  };
}

export function usePresenceOptimization(
  config: UsePresenceOptimizationConfig,
  currentUserId: string | null
): UsePresenceOptimizationReturn {
  const [presenceState, setPresenceState] = useState<PresenceStateMap>({});
  const [currentUser, setCurrentUser] = useState<UserPresence | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const isActiveRef = useRef(true);
  
  const {
    updateInterval = 30000, // 30 seconds
    activityTimeout = 300000, // 5 minutes
    enableActivityTracking = true,
    enablePageTracking = true,
    debounceMs = 1000
  } = config;

  // Initialize current user presence
  useEffect(() => {
    if (currentUserId) {
      const initialPresence: UserPresence = {
        user_id: currentUserId,
        status: config.initialStatus || 'online',
        last_seen: new Date().toISOString(),
        page: enablePageTracking ? window.location.pathname : undefined,
        activity: 'active'
      };
      setCurrentUser(initialPresence);
    }
  }, [currentUserId, config.initialStatus, enablePageTracking]);

  // Handle presence updates from other users
  const handlePresenceUpdate = useCallback((payload: unknown) => {
    logger.debug('📡 Presence update received:', payload);

    const typedPayload = payload as { type: string; state?: PresenceStateMap; key?: string; newPresences?: UserPresence[]; leftPresences?: UserPresence[] };

    switch (typedPayload.type) {
      case 'presence_sync':
        setPresenceState(typedPayload.state || {});
        break;
      
      case 'presence_join':
        logger.info(`👋 User joined: ${typedPayload.key}`);
        if (typedPayload.key && typedPayload.newPresences) {
          setPresenceState(prev => ({
            ...prev,
            [typedPayload.key!]: typedPayload.newPresences!
          }));
        }
        break;
      
      case 'presence_leave':
        logger.info(`👋 User left: ${typedPayload.key}`);
        if (typedPayload.key) {
          setPresenceState(prev => {
            const newState = { ...prev };
            delete newState[typedPayload.key!];
            return newState;
          });
        }
        break;
      
      default:
        logger.debug('Unknown presence event:', typedPayload.type);
    }
  }, []);

  // Setup presence subscription
  const { updatePresence, isConnected } = useOptimizedSubscription(
    {
      channelName: config.channelName,
      presenceEnabled: true,
      presenceState: currentUser,
      debounceMs,
      priority: 'high'
    },
    handlePresenceUpdate
  );

  // Update user status
  const updateStatus = useCallback(async (
    status: UserPresence['status'], 
    metadata?: Record<string, unknown>
  ) => {
    if (!currentUser) return;

    const updatedPresence: UserPresence = {
      ...currentUser,
      status,
      last_seen: new Date().toISOString(),
      metadata: { ...currentUser.metadata, ...metadata }
    };

    setCurrentUser(updatedPresence);
    
    try {
      await updatePresence(updatedPresence);
      logger.info(`📱 Status updated to: ${status}`);
    } catch (error) {
      logger.error('❌ Failed to update presence:', error);
    }
  }, [currentUser, updatePresence]);

  // Update activity
  const updateActivity = useCallback(async (activity: string) => {
    if (!currentUser || !enableActivityTracking) return;

    lastActivityRef.current = Date.now();
    isActiveRef.current = true;

    const updatedPresence: UserPresence = {
      ...currentUser,
      activity,
      last_seen: new Date().toISOString()
    };

    setCurrentUser(updatedPresence);
    
    try {
      await updatePresence(updatedPresence);
    } catch (error) {
      logger.error('❌ Failed to update activity:', error);
    }
  }, [currentUser, enableActivityTracking, updatePresence]);

  // Activity tracking
  useEffect(() => {
    if (!enableActivityTracking || !currentUser) return;

    const trackActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        updateActivity('active');
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Check for inactivity
    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > activityTimeout && isActiveRef.current) {
        isActiveRef.current = false;
        updateStatus('away');
      }
    };

    const inactivityInterval = setInterval(checkInactivity, updateInterval);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      clearInterval(inactivityInterval);
    };
  }, [enableActivityTracking, currentUser, activityTimeout, updateInterval, updateActivity, updateStatus]);

  // Page visibility tracking
  useEffect(() => {
    if (!enablePageTracking || !currentUser) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await updateStatus('away');
      } else {
        await updateStatus('online');
        if (enablePageTracking) {
          await updateActivity('page_visible');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enablePageTracking, currentUser, updateStatus, updateActivity]);

  // Page navigation tracking
  useEffect(() => {
    if (!enablePageTracking || !currentUser) return;

    const updatePage = async () => {
      const updatedPresence: UserPresence = {
        ...currentUser,
        page: window.location.pathname,
        last_seen: new Date().toISOString()
      };

      setCurrentUser(updatedPresence);
      
      try {
        await updatePresence(updatedPresence);
      } catch (error) {
        logger.error('❌ Failed to update page:', error);
      }
    };

    // Listen for navigation changes
    window.addEventListener('popstate', updatePage);
    
    // For client-side routing, you might need to hook into your router
    // This is a generic approach that works with most routers
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(updatePage, 0);
    };

    return () => {
      window.removeEventListener('popstate', updatePage);
      history.pushState = originalPushState;
    };
  }, [enablePageTracking, currentUser, updatePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  // Utility functions
  const isUserOnline = useCallback((userId: string): boolean => {
    for (const presences of Object.values(presenceState)) {
      const user = presences.find(p => p.user_id === userId);
      if (user && ['online', 'busy'].includes(user.status)) {
        return true;
      }
    }
    return false;
  }, [presenceState]);

  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    for (const presences of Object.values(presenceState)) {
      const user = presences.find(p => p.user_id === userId);
      if (user) {
        return user;
      }
    }
    return null;
  }, [presenceState]);

  // Get all online users
  const onlineUsers = Object.values(presenceState)
    .flat()
    .filter(user => ['online', 'busy'].includes(user.status));

  // Calculate stats
  const allUsers = Object.values(presenceState).flat();
  const stats = {
    totalUsers: allUsers.length,
    onlineCount: allUsers.filter(u => u.status === 'online').length,
    awayCount: allUsers.filter(u => u.status === 'away').length,
    busyCount: allUsers.filter(u => u.status === 'busy').length,
    offlineCount: allUsers.filter(u => u.status === 'offline').length
  };

  return {
    presenceState,
    currentUser,
    onlineUsers,
    updateStatus,
    updateActivity,
    isUserOnline,
    getUserPresence,
    stats
  };
}

// Hook for simple online/offline tracking
export function useSimplePresence(channelName: string, userId: string | null) {
  const { isUserOnline, onlineUsers, stats } = usePresenceOptimization(
    {
      channelName,
      enableActivityTracking: false,
      enablePageTracking: false,
      debounceMs: 2000
    },
    userId
  );

  return {
    isOnline: userId ? isUserOnline(userId) : false,
    onlineUsers,
    onlineCount: stats.onlineCount
  };
}