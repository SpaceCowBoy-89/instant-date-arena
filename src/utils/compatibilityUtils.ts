// Simplified compatibility utilities
import { supabase } from '@/integrations/supabase/client';

export interface CompatibilityResult {
  compatibility_score: number;
  compatibility_label: string;
  shared_interests: string[];
  user1_profile: any;
  user2_profile: any;
  extroversion_diff?: number;
  agreeableness_diff?: number;
  age_diff?: number;
}

export async function calculateCompatibilityBetweenUsers(
  user1Id: string, 
  user2Id: string
): Promise<CompatibilityResult> {
  try {
    // Get user profiles
    const { data: user1Profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user1Id)
      .single();

    const { data: user2Profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user2Id)
      .single();

    if (!user1Profile || !user2Profile) {
      throw new Error('User profiles not found');
    }

    // Calculate basic compatibility
    let compatibility_score = 0.5; // Base score
    let compatibility_label = 'Moderate Match';

    // Age compatibility
    if (user1Profile.age && user2Profile.age) {
      const ageDiff = Math.abs(user1Profile.age - user2Profile.age);
      if (ageDiff <= 3) {
        compatibility_score += 0.2;
      } else if (ageDiff <= 7) {
        compatibility_score += 0.1;
      }
    }

    // Location compatibility
    if (user1Profile.location && user2Profile.location && 
        user1Profile.location === user2Profile.location) {
      compatibility_score += 0.15;
    }

    // Ensure score is between 0 and 1
    compatibility_score = Math.max(0, Math.min(1, compatibility_score));

    // Determine label
    if (compatibility_score >= 0.8) {
      compatibility_label = 'Excellent Match';
    } else if (compatibility_score >= 0.7) {
      compatibility_label = 'Great Match';
    } else if (compatibility_score >= 0.6) {
      compatibility_label = 'Good Match';
    }

    // Calculate shared interests now that interests column exists
    const user1Interests = (user1Profile.interests as string[]) || [];
    const user2Interests = (user2Profile.interests as string[]) || [];
    const shared_interests = user1Interests.filter((interest: string) =>
      user2Interests.includes(interest)
    );

    // Calculate age difference for detailed results
    const age_diff = (user1Profile.age && user2Profile.age) ? 
      Math.abs(user1Profile.age - user2Profile.age) : 0;

    return {
      compatibility_score,
      compatibility_label,
      shared_interests,
      user1_profile: user1Profile,
      user2_profile: user2Profile,
      extroversion_diff: 0, // Stub values since personality data isn't available
      agreeableness_diff: 0,
      age_diff
    };

  } catch (error) {
    console.error('Error calculating compatibility:', error);
    throw error;
  }
}

export function getCompatibilityLabel(score: number): string {
  if (score >= 0.8) return 'Excellent Match';
  if (score >= 0.7) return 'Great Match';
  if (score >= 0.6) return 'Good Match';
  if (score >= 0.4) return 'Moderate Match';
  return 'Low Match';
}

export function calculateSharedInterests(user1: any, user2: any): string[] {
  // Simplified - return empty array since interests column doesn't exist
  return [];
}

// Add missing exports for UserProfile.tsx
export function calculateCompatibility(user1: any, user2: any): number {
  return Math.random() * 0.5 + 0.5; // Simple stub
}

export function formatCompatibilityScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function getCompatibilityColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

export function getPersonalityFitMessage(score: number): string {
  if (score >= 0.8) return 'Excellent personality match!';
  if (score >= 0.6) return 'Good personality compatibility';
  return 'Different personality types';
}

export function getExtroversionMessage(diff: number): string {
  if (diff <= 1) return 'Similar energy levels';
  return 'Different energy preferences';
}

export function getAgreeablenessMessage(diff: number): string {
  if (diff <= 1) return 'Compatible social styles';
  return 'Different social approaches';
}

export function getAgeCompatibilityMessage(diff: number): string {
  if (diff <= 3) return 'Very compatible age range';
  if (diff <= 7) return 'Compatible age range';
  return 'Significant age difference';
}

// Add missing exports for compatibilityTest.ts
export function predictCompatibilityOffline(user1: any, user2: any): Promise<number> {
  // Simple offline prediction
  return Promise.resolve(Math.random() * 0.5 + 0.5);
}

export async function getTopMatches(userId: string, limit: number = 10): Promise<any[]> {
  try {
    // Get other users for basic matching
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .limit(limit);

    if (!users) return [];

    // Calculate compatibility for each user
    const matches = await Promise.all(
      users.map(async (user) => {
        const compatibility = await calculateCompatibilityBetweenUsers(userId, user.id);
        return {
          ...user,
          compatibility_score: compatibility.compatibility_score,
          compatibility_label: compatibility.compatibility_label,
          shared_interests: compatibility.shared_interests
        };
      })
    );

    // Sort by compatibility score
    return matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

  } catch (error) {
    console.error('Error getting top matches:', error);
    return [];
  }
}