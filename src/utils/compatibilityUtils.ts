// Utility functions for compatibility scoring and integration
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import CompatibilityPlugin from '@/plugins/compatibility';

export interface CompatibilityScores {
  extroversion_score: number;
  agreeableness_score: number;
  openness_to_experience_score: number;
  conscientiousness_score: number;
  neuroticism_score: number;
}

export interface CompatibilityResult {
  compatibility_score: number;
  compatibility_label: string;
  extroversion_diff: number;
  agreeableness_diff: number;
  age_diff: number;
  shared_interests: string[];
}

// Calculate compatibility between two users
export const calculateCompatibility = async (
  user1Id: string,
  user2Id: string
): Promise<CompatibilityResult | null> => {
  try {
    // Get both users' compatibility scores
    const [user1Data, user2Data] = await Promise.all([
      supabase
        .from('user_compatibility_scores')
        .select('*')
        .eq('user_id', user1Id)
        .single(),
      supabase
        .from('user_compatibility_scores')
        .select('*')
        .eq('user_id', user2Id)
        .single()
    ]);

    if (!user1Data.data || !user2Data.data) {
      return null;
    }

    const user1Scores = user1Data.data;
    const user2Scores = user2Data.data;

    // Get user profiles for age and interests
    const [user1Profile, user2Profile] = await Promise.all([
      supabase.from('users').select('age, preferences').eq('id', user1Id).single(),
      supabase.from('users').select('age, preferences').eq('id', user2Id).single()
    ]);

    const age_diff = Math.abs((user1Profile.data?.age || 0) - (user2Profile.data?.age || 0));

    // Calculate personality differences
    const extroversion_diff = Math.abs(user1Scores.extroversion_score - user2Scores.extroversion_score);
    const agreeableness_diff = Math.abs(user1Scores.agreeableness_score - user2Scores.agreeableness_score);
    const openness_diff = Math.abs(user1Scores.openness_to_experience_score - user2Scores.openness_to_experience_score);
    const conscientiousness_diff = Math.abs(user1Scores.conscientiousness_score - user2Scores.conscientiousness_score);
    const neuroticism_diff = Math.abs(user1Scores.neuroticism_score - user2Scores.neuroticism_score);

    // Calculate overall compatibility score (same algorithm as matchmaker)
    const compatibility_score = 1.0 - (
      (extroversion_diff + agreeableness_diff + openness_diff +
       conscientiousness_diff + neuroticism_diff) / 20.0 +
      Math.min(age_diff / 20.0, 1.0) * 0.2
    );

    // Determine compatibility label
    let compatibility_label = 'Potential Match';
    if (compatibility_score >= 0.8) {
      compatibility_label = 'Great Match';
    } else if (compatibility_score >= 0.6) {
      compatibility_label = 'Good Match';
    }

    // Calculate shared interests
    const user1Interests = user1Profile.data?.preferences?.interests || [];
    const user2Interests = user2Profile.data?.preferences?.interests || [];
    const shared_interests = user1Interests.filter((interest: string) =>
      user2Interests.includes(interest)
    );

    return {
      compatibility_score: Math.max(0, Math.min(1, compatibility_score)),
      compatibility_label,
      extroversion_diff: Math.round(extroversion_diff * 100) / 100,
      agreeableness_diff: Math.round(agreeableness_diff * 100) / 100,
      age_diff,
      shared_interests
    };

  } catch (error) {
    console.error('Error calculating compatibility:', error);
    return null;
  }
};

// Get compatibility score display color
export const getCompatibilityColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400';
  if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

// Get compatibility badge variant
export const getCompatibilityVariant = (score: number) => {
  if (score >= 0.8) return 'default';
  if (score >= 0.6) return 'secondary';
  return 'destructive';
};

// Format compatibility percentage
export const formatCompatibilityScore = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};

// Get user-friendly extroversion message
export const getExtroversionMessage = (extroversionDiff: number): string => {
  if (extroversionDiff <= 0.5) {
    return "Both have similar social energy";
  } else if (extroversionDiff <= 1.0) {
    return "Compatible social styles";
  } else if (extroversionDiff <= 1.5) {
    return "Some differences in social energy";
  } else {
    return "Different social styles";
  }
};

// Get user-friendly agreeableness message
export const getAgreeablenessMessage = (agreeablenessDiff: number): string => {
  if (agreeablenessDiff <= 0.5) {
    return "Both value harmony";
  } else if (agreeablenessDiff <= 1.0) {
    return "Compatible cooperative natures";
  } else if (agreeablenessDiff <= 1.5) {
    return "Some differences in agreeableness";
  } else {
    return "Different approaches to cooperation";
  }
};

// Get combined personality fit message
export const getPersonalityFitMessage = (extroversionDiff: number, agreeablenessDiff: number): string => {
  const extroversionMsg = getExtroversionMessage(extroversionDiff);
  const agreeablenessMsg = getAgreeablenessMessage(agreeablenessDiff);

  // If both are very similar, show a combined positive message
  if (extroversionDiff <= 0.5 && agreeablenessDiff <= 0.5) {
    return "Very similar personalities";
  }

  // If one trait is very similar and the other is compatible, show the better one
  if (extroversionDiff <= 0.5) {
    return extroversionMsg;
  } else if (agreeablenessDiff <= 0.5) {
    return agreeablenessMsg;
  }

  // Otherwise, show the average compatibility level
  const avgDiff = (extroversionDiff + agreeablenessDiff) / 2;
  if (avgDiff <= 1.0) {
    return "Compatible personalities";
  } else if (avgDiff <= 1.5) {
    return "Some personality differences";
  } else {
    return "Different personality styles";
  }
};

// Get user-friendly age compatibility message
export const getAgeCompatibilityMessage = (ageDiff: number): string => {
  if (ageDiff === 0) {
    return "Same age";
  } else if (ageDiff === 1) {
    return "1 year apart";
  } else if (ageDiff <= 3) {
    return `${ageDiff} years apart - great match`;
  } else if (ageDiff <= 5) {
    return `${ageDiff} years apart - good match`;
  } else if (ageDiff <= 10) {
    return `${ageDiff} years apart`;
  } else {
    return `${ageDiff} years apart - larger age gap`;
  }
};

// Check if user has completed compatibility test
export const hasCompletedCompatibilityTest = async (userId: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('user_compatibility_scores')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    return !!data;
  } catch {
    return false;
  }
};

// Web-based compatibility calculation (matches iOS CoreML and Android logic)
const calculateWebCompatibility = (features: Record<string, number>): number => {
  // Extract features for compatibility calculation
  const adventure = features.Adventure || 0.0;
  const anime = features.Anime || 0.0;
  const creative = features.Creative || 0.0;
  const fantasy = features.Fantasy || 0.0;
  const tech = features.Tech || 0.0;

  const agreeableness = features.agreeableness || 0.0;
  const conscientiousness = features.conscientiousness || 0.0;
  const extraversion = features.extraversion || 0.0;
  const neuroticism = features.neuroticism || 0.0;
  const openness = features.openness || 0.0;
  const sameLocation = features.same_location || 0.0;

  // Interest compatibility (30% weight)
  const interestScore = (adventure + anime + creative + fantasy + tech) / 5.0;

  // Personality compatibility (60% weight)
  // Higher agreeableness, conscientiousness, extraversion, openness are positive
  // Lower neuroticism is positive
  const personalityScore = (
    agreeableness * 0.25 +
    conscientiousness * 0.2 +
    extraversion * 0.2 +
    openness * 0.2 +
    (5.0 - neuroticism) * 0.15  // Invert neuroticism
  ) / 5.0;

  // Location proximity (10% weight)
  const locationScore = sameLocation;

  // Combine all factors
  let finalScore = (
    interestScore * 0.3 +
    personalityScore * 0.6 +
    locationScore * 0.1
  );

  // Normalize to 0-1 range and apply sigmoid for realistic distribution
  finalScore = Math.max(0.0, Math.min(1.0, finalScore));
  return 1.0 / (1.0 + Math.exp(-((finalScore - 0.5) * 6))); // Sigmoid function
};

// Cross-platform compatibility prediction
export const predictCompatibilityOffline = async (
  userFeatures: Record<string, number>
): Promise<number | null> => {
  try {
    // Detect platform using Capacitor
    const platform = Capacitor.getPlatform();

    if (platform === 'ios' || platform === 'android') {
      // Use native plugins (iOS CoreML or Android Java)
      const result = await CompatibilityPlugin.predictCompatibility({
        features: {
          Adventure: userFeatures.Adventure || 0,
          Anime: userFeatures.Anime || 0,
          Creative: userFeatures.Creative || 0,
          Fantasy: userFeatures.Fantasy || 0,
          Tech: userFeatures.Tech || 0,
          agreeableness: userFeatures.agreeableness || 0,
          conscientiousness: userFeatures.conscientiousness || 0,
          extraversion: userFeatures.extraversion || 0,
          neuroticism: userFeatures.neuroticism || 0,
          openness: userFeatures.openness || 0,
          same_location: userFeatures.same_location || 0,
        }
      });
      return result.probability;
    } else {
      // Web platform - use JavaScript implementation
      return calculateWebCompatibility(userFeatures);
    }

    return null;
  } catch (error) {
    console.error('Error with offline compatibility prediction:', error);
    // Fallback to web calculation
    try {
      return calculateWebCompatibility(userFeatures);
    } catch (fallbackError) {
      console.error('Fallback web calculation failed:', fallbackError);
      return null;
    }
  }
};