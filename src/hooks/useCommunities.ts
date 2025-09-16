import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ICON_MAP } from '@/data/communityGroups';
import { Users } from 'lucide-react';
import { getUserCommunityMatches } from '@/utils/communityMatcher';

interface Post {
  id: string;
  message: string;
  user: {
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
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
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
    supabase.from('events').select('*')
  ]);

  // Process communities
  const processedCommunities = allCommunities?.map(community => ({
    ...community,
    icon: ICON_MAP[community.icon as keyof typeof ICON_MAP] || Users,
  })) || [];

  // Process user groups
  const processedUserGroups = userGroups?.map(ug => ug.connections_groups).filter(Boolean) || [];

  // Process posts by group
  const postsByGroup = groupMessages?.reduce((acc, post) => {
    const groupId = post.connections_groups.id;
    acc[groupId] = acc[groupId] ? [...acc[groupId], post] : [post];
    return acc;
  }, {} as { [groupId: string]: Post[] }) || {};

  // Process trending posts
  const sortedPosts = groupMessages?.sort((a, b) => (b.likes || 0) - (a.likes || 0)) || [];
  const topLiked = sortedPosts[0];
  const topCommented = sortedPosts.sort((a, b) => (b.comments || 0) - (a.comments || 0))[0];
  const trendingPosts = [topLiked, topCommented].filter(Boolean).slice(0, 2);

  // Get personalized suggestions
  const personalizedSuggestions = await getUserCommunityMatches(userId);
  const processedSuggestions = processedCommunities.filter(community =>
    personalizedSuggestions.some(suggestion =>
      suggestion.groupName.toLowerCase() === community.tag_name.toLowerCase()
    )
  ).slice(0, 5);

  return {
    allCommunities: processedCommunities,
    userGroups: processedUserGroups,
    posts: postsByGroup,
    trendingPosts,
    events: eventsData || [],
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
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};