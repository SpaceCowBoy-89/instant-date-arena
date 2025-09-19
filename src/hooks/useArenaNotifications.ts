import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import type { ArenaData } from '@/data/arenas';
import { getNextArenaTime } from '@/data/arenas';
import { useToast } from '@/hooks/use-toast';

interface ArenaNotificationState {
  [arenaId: string]: {
    isSet: boolean;
    loading: boolean;
    error?: string;
  };
}

export const useArenaNotifications = () => {
  const [notificationStates, setNotificationStates] = useState<ArenaNotificationState>({});
  const { toast } = useToast();

  // Load notification states from database
  const loadNotificationStates = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('arena_notification_requests')
        .select('arena_id, is_active, notification_sent')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading notification states:', error);
        return;
      }

      const states: ArenaNotificationState = {};
      data?.forEach(request => {
        states[request.arena_id] = {
          isSet: true,
          loading: false
        };
      });

      setNotificationStates(states);
    } catch (error) {
      console.error('Error in loadNotificationStates:', error);
    }
  }, []);

  // Toggle notification for an arena
  const toggleNotification = useCallback(async (arena: ArenaData): Promise<boolean> => {
    const arenaId = arena.id;
    const currentState = notificationStates[arenaId];
    const isCurrentlySet = currentState?.isSet || false;

    // Set loading state
    setNotificationStates(prev => ({
      ...prev,
      [arenaId]: {
        ...prev[arenaId],
        loading: true,
        error: undefined
      }
    }));

    try {
      if (isCurrentlySet) {
        // Cancel notification
        await notificationService.clearArenaNotification(arenaId);
        
        setNotificationStates(prev => ({
          ...prev,
          [arenaId]: {
            isSet: false,
            loading: false
          }
        }));

        toast({
          title: 'Notification Cancelled',
          description: `You will no longer receive alerts for ${arena.name}.`,
        });

        return false;
      } else {
        // Set notification
        const hasPermission = await notificationService.requestNotificationPermission();
        
        if (hasPermission || notificationService.getPreferences().toastEnabled) {
          const nextTime = getNextArenaTime(arena);
          const success = await notificationService.scheduleArenaNotification(arena, nextTime);
          
          if (success) {
            setNotificationStates(prev => ({
              ...prev,
              [arenaId]: {
                isSet: true,
                loading: false
              }
            }));

            notificationService.sendNotifyMeConfirmation(arena);
            return true;
          } else {
            throw new Error('Failed to schedule notification');
          }
        } else {
          setNotificationStates(prev => ({
            ...prev,
            [arenaId]: {
              isSet: false,
              loading: false,
              error: 'Permission denied'
            }
          }));

          toast({
            title: 'Permission Required',
            description: 'Please enable notifications in your browser settings.',
            variant: 'destructive'
          });

          return false;
        }
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      
      setNotificationStates(prev => ({
        ...prev,
        [arenaId]: {
          isSet: isCurrentlySet, // Revert to original state
          loading: false,
          error: 'Failed to update notification'
        }
      }));

      toast({
        title: 'Error',
        description: 'Failed to update notification settings. Please try again.',
        variant: 'destructive'
      });

      return isCurrentlySet;
    }
  }, [notificationStates, toast]);

  // Get notification state for a specific arena
  const getNotificationState = useCallback((arenaId: string) => {
    return notificationStates[arenaId] || {
      isSet: false,
      loading: false
    };
  }, [notificationStates]);

  // Load states on mount
  useEffect(() => {
    loadNotificationStates();
  }, [loadNotificationStates]);

  return {
    notificationStates,
    toggleNotification,
    getNotificationState,
    refreshStates: loadNotificationStates
  };
};