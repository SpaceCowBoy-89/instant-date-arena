import { supabase } from "@/integrations/supabase/client";
import { COMMUNITY_GROUPS, findGroupForInterest } from "@/data/communityGroups";
import quizQuestions from "@/data/quizQuestionz.json";

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
    // Get user's Q&A answers with question data
    const { data: answers } = await supabase
      .from('user_connections_answers')
      .select('selected_answer, question_id')
      .eq('user_id', userId);

    if (!answers || answers.length === 0) {
      console.log('No answers found for user:', userId);
      return [];
    }

    console.log('Raw answers from database:', answers);

    // Use imported quiz questions
    const questions = quizQuestions.questions;
    console.log('Quiz questions loaded:', questions?.length);

    // Calculate community scores based on quiz answer groups
    const communityScores: Record<string, number> = {};
    const matchedInterests: Record<string, string[]> = {};

    answers.forEach(answer => {
      // Find the corresponding question
      const question = questions?.find((q: any) => q.id === answer.question_id);
      if (!question) {
        console.log('Question not found for:', answer.question_id);
        return;
      }

      // Find the selected answer option
      const selectedOption = question.answers?.find((opt: any) =>
        opt.value === answer.selected_answer
      );

      if (selectedOption && selectedOption.groups) {
        console.log('Selected option groups:', selectedOption.groups);

        // Add score for each group based on weight
        selectedOption.groups.forEach((group: any) => {
          const groupId = group.group_id;
          const weight = group.weight || 1;

          communityScores[groupId] = (communityScores[groupId] || 0) + weight;

          if (!matchedInterests[groupId]) {
            matchedInterests[groupId] = [];
          }
          // Add the answer text as an interest
          if (!matchedInterests[groupId].includes(answer.selected_answer)) {
            matchedInterests[groupId].push(answer.selected_answer);
          }
        });
      }
    });

    console.log('Community scores calculated:', communityScores);

    // Convert to UserInterestMatch format and sort by score
    const matches: UserInterestMatch[] = Object.entries(communityScores)
      .map(([groupName, score]) => ({
        groupName,
        matchScore: score,
        matchedInterests: matchedInterests[groupName] || []
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log('Final matches:', matches);
    return matches;

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

/**
 * Gets similar communities based on user's current group memberships
 * @param userId - The user's ID
 * @returns Array of similar community matches
 */
export const getSimilarCommunities = async (userId: string): Promise<UserInterestMatch[]> => {
  try {
    // Get user's current group memberships
    const { data: userGroups } = await supabase
      .from('user_connections_groups')
      .select(`
        connections_groups (
          tag_name
        )
      `)
      .eq('user_id', userId);

    if (!userGroups || userGroups.length === 0) {
      return [];
    }

    const currentGroupNames = userGroups
      .map(ug => ug.connections_groups?.tag_name)
      .filter(Boolean) as string[];

    if (currentGroupNames.length === 0) {
      return [];
    }

    // Get interests from user's current groups
    const userInterests: string[] = [];
    currentGroupNames.forEach(groupName => {
      const groupData = COMMUNITY_GROUPS[groupName];
      if (groupData?.interests) {
        userInterests.push(...groupData.interests);
      }
    });

    // Find similar groups based on overlapping interests
    const similarityScores: Record<string, { score: number; sharedInterests: string[] }> = {};

    Object.entries(COMMUNITY_GROUPS).forEach(([groupName, groupData]) => {
      // Skip groups user is already in
      if (currentGroupNames.includes(groupName)) {
        return;
      }

      const sharedInterests = groupData.interests.filter(interest => 
        userInterests.includes(interest)
      );

      if (sharedInterests.length > 0) {
        similarityScores[groupName] = {
          score: sharedInterests.length,
          sharedInterests
        };
      }
    });

    // Convert to UserInterestMatch format and sort by similarity
    const similarMatches: UserInterestMatch[] = Object.entries(similarityScores)
      .map(([groupName, data]) => ({
        groupName,
        matchScore: data.score,
        matchedInterests: data.sharedInterests
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2); // Return only top 2 similar groups

    return similarMatches;

  } catch (error) {
    console.error('Error finding similar communities:', error);
    return [];
  }
};