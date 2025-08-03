import { supabase } from "@/integrations/supabase/client";
import { COMMUNITY_GROUPS, findGroupForInterest } from "@/data/communityGroups";

export interface UserInterestMatch {
  groupName: string;
  matchScore: number;
  matchedInterests: string[];
}

/**
 * Analyzes user's Q&A answers to suggest relevant communities
 * @param userId - The user's ID
 * @returns Array of community matches sorted by relevance
 */
export const getUserCommunityMatches = async (userId: string): Promise<UserInterestMatch[]> => {
  try {
    // Get user's Q&A answers
    const { data: answers } = await supabase
      .from('user_connections_answers')
      .select('selected_answer')
      .eq('user_id', userId);

    if (!answers || answers.length === 0) {
      return [];
    }

    // Extract all user interests from their answers
    const userInterests: string[] = [];
    answers.forEach(answer => {
      if (answer.selected_answer && typeof answer.selected_answer === 'object') {
        const answerData = answer.selected_answer as any;
        if (answerData.interests && Array.isArray(answerData.interests)) {
          userInterests.push(...answerData.interests);
        }
      }
    });

    // Count interest frequency
    const interestCounts: Record<string, number> = {};
    userInterests.forEach(interest => {
      interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    });

    // Map interests to community groups and calculate match scores
    const groupMatches: Record<string, UserInterestMatch> = {};

    Object.entries(interestCounts).forEach(([interest, count]) => {
      const groupName = findGroupForInterest(interest);
      if (groupName) {
        if (!groupMatches[groupName]) {
          groupMatches[groupName] = {
            groupName,
            matchScore: 0,
            matchedInterests: []
          };
        }
        groupMatches[groupName].matchScore += count;
        // Only add the interest if it's not already in the array and it's a valid interest that maps to this group
        if (!groupMatches[groupName].matchedInterests.includes(interest)) {
          groupMatches[groupName].matchedInterests.push(interest);
        }
      }
    });

    // Sort by match score and return
    return Object.values(groupMatches)
      .sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.error('Error analyzing user interests:', error);
    return [];
  }
};

/**
 * Gets the top community recommendation for a user
 * @param userId - The user's ID
 * @returns The best matching community name or null
 */
export const getTopCommunityRecommendation = async (userId: string): Promise<string | null> => {
  const matches = await getUserCommunityMatches(userId);
  return matches.length > 0 ? matches[0].groupName : null;
};

/**
 * Checks if a user would be a good fit for a specific community
 * @param userId - The user's ID
 * @param communityName - The community to check
 * @returns Match score (0 if no match)
 */
export const getCommunityMatchScore = async (userId: string, communityName: string): Promise<number> => {
  const matches = await getUserCommunityMatches(userId);
  const match = matches.find(m => m.groupName === communityName);
  return match?.matchScore || 0;
};