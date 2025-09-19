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
      .select('*, connections_groups(id, tag_name), user:users(name, photo_url)')
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

  // Process posts by group - fix type mismatches
  const processedMessages = groupMessages?.map(msg => ({
    id: msg.id,
    user_id: msg.user_id,
    message: msg.message,
    created_at: msg.created_at,
    user: Array.isArray(msg.user) ? msg.user[0] : msg.user,
    likes: 0, // Default value since not in database
    comments: 0, // Default value since not in database
    connections_groups: msg.connections_groups
  })) || [];

  const postsByGroup = processedMessages.reduce((acc, post) => {
    const groupId = post.connections_groups.id;
    acc[groupId] = acc[groupId] ? [...acc[groupId], post] : [post];
    return acc;
  }, {} as { [groupId: string]: Post[] }) || {};

  // Process trending posts
  const trendingPosts = processedMessages.slice(0, 5); // Just take first 5 as trending

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