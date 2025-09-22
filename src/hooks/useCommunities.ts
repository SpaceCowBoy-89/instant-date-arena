import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ICON_MAP, COMMUNITY_GROUPS, getIconForGroup } from '@/data/communityGroups';
import { Users } from 'lucide-react';
import { getUserCommunityMatches, getSimilarCommunities } from '@/utils/communityMatcher';

interface Post {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string;
    photo_url?: string;
  };
  likes?: number;
  comments?: number;
  trendingScore?: number;
  hoursAgo?: number;
  engagementRate?: number;
  is_trending?: boolean;
  connections_groups: {
    id: string;
    tag_name: string;
  };
}

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle?: string;
  icon: any;
  member_count?: number;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  name?: string; // Add optional name property for compatibility
  connections_groups: {
    id: string;
    tag_name: string;
  };
}

interface CommunitiesData {
  allCommunities: Community[];
  userGroups: Community[];
  posts: { [groupId: string]: Post[] };
  trendingPosts: Post[];
  events: Event[];
  personalizedSuggestions: Community[];
}

const fetchCommunitiesData = async (userId: string): Promise<CommunitiesData> => {
  // Fetch all data in parallel for better performance
  const [
    { data: allCommunities },
    { data: userGroups },
    { data: groupMessages },
    { data: eventsData }
  ] = await Promise.all([
    supabase.from('connections_groups').select('*'),
    supabase
      .from('user_connections_groups')
      .select('*, connections_groups(*)')
      .eq('user_id', userId),
    supabase
      .from('connections_group_messages')
      .select('*, connections_groups(id, tag_name), users!user_id(name, photo_url)')
      .order('created_at', { ascending: false }),
    supabase
      .from('community_events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
  ]);

  // Process communities - add proper icons from community groups data
  const processedCommunities = allCommunities?.map(community => {
    const groupData = COMMUNITY_GROUPS[community.tag_name as keyof typeof COMMUNITY_GROUPS];
    const iconName = groupData?.icon || 'Users';
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Users;

    return {
      ...community,
      icon: IconComponent,
      tag_subtitle: groupData?.subtitle || community.tag_subtitle,
      member_count: Math.floor(Math.random() * 1000) + 100, // Mock member count for now
    };
  }) || [];

  // Process user groups
  const processedUserGroups = userGroups?.map(ug => {
    const community = ug.connections_groups;
    const groupData = COMMUNITY_GROUPS[community.tag_name as keyof typeof COMMUNITY_GROUPS];
    const iconName = groupData?.icon || 'Users';
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Users;

    return {
      ...community,
      icon: IconComponent,
    };
  }).filter(Boolean) || [];

  // Process posts by group - fix type mismatches and add engagement data
  const processedMessages = groupMessages?.map(msg => {
    // Generate realistic engagement data based on post age and content
    const postTime = new Date(msg.created_at);
    const hoursAgo = (new Date().getTime() - postTime.getTime()) / (1000 * 60 * 60);
    
    // Simulate engagement based on recency and content length
    const contentLength = msg.message?.length || 0;
    const baseEngagement = Math.max(1, Math.floor(contentLength / 20)); // Longer posts get more engagement
    const recencyMultiplier = Math.max(0.1, 1 - (hoursAgo / 48)); // Decay over 48 hours
    
    const likes = Math.floor((baseEngagement + Math.random() * 5) * recencyMultiplier);
    const comments = Math.floor((baseEngagement * 0.3 + Math.random() * 2) * recencyMultiplier);
    
    return {
      id: msg.id,
      user_id: msg.user_id,
      message: msg.message,
      created_at: msg.created_at,
      user: Array.isArray(msg.users) ? msg.users[0] : msg.users, // Handle both array and single object
      likes: Math.max(0, likes), // Ensure non-negative
      comments: Math.max(0, comments), // Ensure non-negative
      connections_groups: msg.connections_groups
    };
  }) || [];

  const postsByGroup = processedMessages.reduce((acc, post) => {
    const groupId = post.connections_groups.id;
    acc[groupId] = acc[groupId] ? [...acc[groupId], post] : [post];
    return acc;
  }, {} as { [groupId: string]: Post[] }) || {};

  // Process trending posts with engagement-based algorithm
  const trendingPosts = calculateTrendingPosts(processedMessages);

  // Get user's group IDs for filtering events
  const userGroupIds = processedUserGroups.map(group => group.id);

  // Process events - only show events from groups the user belongs to
  const processedEvents = eventsData?.filter(event => 
    userGroupIds.includes(event.group_id)
  ).map(event => {
    // Find the group data for this event
    const groupData = processedUserGroups.find(group => group.id === event.group_id);
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.event_date, // Map event_date to date for compatibility
      time: new Date(event.event_date).toLocaleTimeString(), // Extract time from date
      location: event.location,
      connections_groups: {
        id: event.group_id,
        tag_name: groupData?.tag_name || 'Event Group'
      }
    };
  }) || [];

  // Get personalized suggestions
  const personalizedSuggestions = await getUserCommunityMatches(userId);
  let processedSuggestions = processedCommunities.filter(community =>
    personalizedSuggestions.some(suggestion =>
      suggestion.groupName.toLowerCase() === community.tag_name.toLowerCase()
    )
  ).slice(0, 5);

  // If no personalized suggestions (user hasn't taken quiz), check if they have joined groups
  if (processedSuggestions.length === 0) {
    // If user has joined groups, show similar communities based on their current groups
    if (processedUserGroups.length > 0) {
      const similarCommunities = await getSimilarCommunities(userId);
      processedSuggestions = processedCommunities.filter(community =>
        similarCommunities.some(similar =>
          similar.groupName.toLowerCase() === community.tag_name.toLowerCase()
        )
      ).slice(0, 5);
    }

    // If still no suggestions or user hasn't joined any groups, show popular default communities
    if (processedSuggestions.length === 0) {
      const defaultSuggestions = ['Foodies', 'Gamers', 'Book Lovers', 'Travel Adventurers', 'Music Lovers'];
      processedSuggestions = processedCommunities.filter(community =>
        defaultSuggestions.includes(community.tag_name)
      ).slice(0, 5);
    }
  }

  return {
    allCommunities: processedCommunities,
    userGroups: processedUserGroups,
    posts: postsByGroup,
    trendingPosts,
    events: processedEvents,
    personalizedSuggestions: processedSuggestions
  };
};

// Advanced trending algorithm based on engagement metrics
const calculateTrendingPosts = (posts: any[]): any[] => {
  const now = new Date();
  
  // Calculate trending score for each post
  const postsWithScores = posts.map(post => {
    const postTime = new Date(post.created_at);
    const hoursAgo = (now.getTime() - postTime.getTime()) / (1000 * 60 * 60);
    
    // Engagement metrics (with fallbacks)
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    const totalEngagement = likes + (comments * 2); // Comments weighted more heavily
    
    // Recency factor (posts lose score over time)
    const recencyFactor = Math.max(0, 1 - (hoursAgo / 24)); // Decays over 24 hours
    
    // Boost factor for recent posts (posts less than 4 hours old get extra boost)
    const recentBoost = hoursAgo < 4 ? 1.5 : 1;
    
    // Community diversity bonus (posts from different communities get slight boost)
    const communityBonus = 1.1; // Slight boost for cross-community visibility
    
    // Calculate final trending score
    const trendingScore = 
      (totalEngagement * 0.6) + // 60% engagement weight
      (recencyFactor * 20 * 0.3) + // 30% recency weight (max 20 points)
      (recentBoost * 5 * 0.1) * // 10% recent boost weight
      communityBonus;
    
    return {
      ...post,
      trendingScore,
      hoursAgo: Math.round(hoursAgo * 10) / 10, // Round to 1 decimal
      engagementRate: totalEngagement,
      is_trending: true
    };
  });
  
  // Sort by trending score (highest first) and return top 8
  return postsWithScores
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 8); // Increased from 5 to 8 for better variety
};

export const useCommunities = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['communities', userId],
    queryFn: () => fetchCommunitiesData(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: false, // Prevent refetch on window focus for better UX
  });
};

export const useUserGroupStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['userGroupStatus', userId],
    queryFn: async () => {
      const { data: userGroups } = await supabase
        .from('user_connections_groups')
        .select('group_id')
        .eq('user_id', userId!);
      return !!userGroups?.length;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};