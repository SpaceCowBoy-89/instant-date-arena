import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  criteria_action: string;
  criteria_threshold: number;
  category: string;
  reward?: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  progress_count: number;
  is_earned: boolean;
  earned_at?: string;
  created_at: string;
  updated_at: string;
  badge?: Badge;
}

// Update badge progress for a user action
export const updateBadgeProgress = async (action: string, increment: number = 1): Promise<any> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user for badge progress update');
      return null;
    }

    console.log(`Updating badge progress: user=${user.id}, action=${action}, increment=${increment}`);
    
    const { data, error } = await supabase.rpc('update_badge_progress', {
      p_user_id: user.id,
      p_action: action,
      p_increment: increment
    });

    if (error) {
      console.error('Error updating badge progress:', error);
      return null;
    }

    console.log('Badge progress update successful:', data);
    return data || { newly_earned: [] };
  } catch (error) {
    console.error('Error in updateBadgeProgress:', error);
    return { newly_earned: [] };
  }
};

// Get all badges with user progress
export const getUserBadges = async (): Promise<{ badges: Badge[], userBadges: UserBadge[] } | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get all badges
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .order('created_at');

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return null;
    }

    // Get user badge progress
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', user.id);

    if (userBadgesError) {
      console.error('Error fetching user badges:', userBadgesError);
      return null;
    }

    return { badges: badges || [], userBadges: userBadges || [] };
  } catch (error) {
    console.error('Error in getUserBadges:', error);
    return null;
  }
};

// Show toast notification for newly earned badges
export const showBadgeNotification = (newlyEarned: any[], toast: ReturnType<typeof useToast>['toast']) => {
  if (newlyEarned && newlyEarned.length > 0) {
    newlyEarned.forEach((badge) => {
      toast({
        title: '🏆 Badge Earned!',
        description: `Congratulations! You've earned the "${badge.name}" badge!`,
        duration: 5000,
      });
    });
  }
};

// Badge action constants
export const BADGE_ACTIONS = {
  QUIZ_COMPLETED: 'quiz_completed',
  CHATS_STARTED: 'chats_started',
  EVENTS_JOINED: 'events_joined',
  PROFILE_COMPLETED: 'profile_completed',
} as const;