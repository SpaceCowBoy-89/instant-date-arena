import React, { useState, useEffect } from 'react';
import { Plus, Play } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { StoryCamera } from './StoryCamera';
import { StoryViewer } from './StoryViewer';

interface StoryUser {
  user_id: string;
  user_name: string;
  user_photo_url?: string;
  stories: Array<{
    id: string;
    content_type: 'image' | 'video' | 'text';
    media_url?: string;
    text_content?: string;
    background_color?: string;
    created_at: string;
    expires_at: string;
    view_count: number;
    has_viewed: boolean;
  }>;
  has_unviewed: boolean;
}

interface StoriesRingProps {
  className?: string;
  showAddStory?: boolean;
}

export const StoriesRing: React.FC<StoriesRingProps> = ({
  className = '',
  showAddStory = true
}) => {
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stories from followed users and communities
  const fetchStories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      // Get stories from followed users (this would integrate with your following system)
      // For now, we'll get stories from all users in your communities
      const { data: communityMembers } = await supabase
        .from('user_connections_groups')
        .select(`
          user_id,
          connections_groups!inner(id)
        `)
        .eq('connections_groups.id', user.id); // This would be adjusted based on your schema

      // Get active stories with user info
      const { data: storiesData, error } = await supabase
        .from('user_stories')
        .select(`
          id,
          user_id,
          content_type,
          media_url,
          text_content,
          background_color,
          created_at,
          expires_at,
          view_count,
          users!inner(name, photo_url),
          story_views!left(viewer_id)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group stories by user
      const userStoriesMap = new Map<string, StoryUser>();

      storiesData?.forEach((story) => {
        const userId = story.user_id;
        const hasViewed = story.story_views?.some(view => view.viewer_id === user.id) || false;

        if (!userStoriesMap.has(userId)) {
          userStoriesMap.set(userId, {
            user_id: userId,
            user_name: story.users.name,
            user_photo_url: story.users.photo_url,
            stories: [],
            has_unviewed: false,
          });
        }

        const userStory = userStoriesMap.get(userId)!;
        userStory.stories.push({
          id: story.id,
          content_type: story.content_type,
          media_url: story.media_url,
          text_content: story.text_content,
          background_color: story.background_color,
          created_at: story.created_at,
          expires_at: story.expires_at,
          view_count: story.view_count,
          has_viewed: hasViewed,
        });

        if (!hasViewed) {
          userStory.has_unviewed = true;
        }
      });

      // Convert to array and sort by unviewed first, then by latest story
      const sortedUsers = Array.from(userStoriesMap.values()).sort((a, b) => {
        if (a.has_unviewed && !b.has_unviewed) return -1;
        if (!a.has_unviewed && b.has_unviewed) return 1;

        const aLatest = Math.max(...a.stories.map(s => new Date(s.created_at).getTime()));
        const bLatest = Math.max(...b.stories.map(s => new Date(s.created_at).getTime()));
        return bLatest - aLatest;
      });

      setStoryUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();

    // Subscribe to real-time story updates
    const subscription = supabase
      .channel('stories_updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_stories' },
        () => fetchStories()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const openStoryViewer = (userStories: StoryUser) => {
    const storiesWithUser = userStories.stories.map(story => ({
      ...story,
      user: {
        name: userStories.user_name,
        photo_url: userStories.user_photo_url,
      },
    }));

    setSelectedUserStories(storiesWithUser);
    setShowViewer(true);
  };

  if (loading) {
    return (
      <div className={`flex space-x-4 p-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`flex space-x-4 p-4 overflow-x-auto ${className}`}>
        {/* Add Story Button */}
        {showAddStory && (
          <div className="flex flex-col items-center space-y-2 flex-shrink-0">
            <Button
              onClick={() => setShowCamera(true)}
              className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              variant="ghost"
            >
              <Plus className="h-6 w-6 text-gray-600" />
            </Button>
            <span className="text-xs text-gray-600 text-center max-w-[60px] truncate">
              Your Story
            </span>
          </div>
        )}

        {/* Story Users */}
        {storyUsers.map((userStory) => (
          <div
            key={userStory.user_id}
            className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer"
            onClick={() => openStoryViewer(userStory)}
          >
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userStory.user_photo_url} />
                <AvatarFallback>
                  {userStory.user_name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Story Ring */}
              <div className={`absolute inset-0 w-16 h-16 rounded-full border-2 ${
                userStory.has_unviewed
                  ? 'border-gradient-to-r from-purple-500 to-pink-500'
                  : 'border-gray-300'
              }`} />

              {/* Unviewed Indicator */}
              {userStory.has_unviewed && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {userStory.stories.filter(s => !s.has_viewed).length}
                  </span>
                </div>
              )}

              {/* Play Icon for Videos */}
              {userStory.stories.some(s => s.content_type === 'video') && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Play className="h-3 w-3 text-gray-600" />
                </div>
              )}
            </div>

            <span className="text-xs text-gray-600 text-center max-w-[60px] truncate">
              {userStory.user_name}
            </span>
          </div>
        ))}

        {/* Empty State */}
        {storyUsers.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-gray-500 text-sm">No stories to show</p>
          </div>
        )}
      </div>

      {/* Story Camera Modal */}
      {showCamera && (
        <StoryCamera
          onClose={() => setShowCamera(false)}
          onStoryCreated={() => {
            setShowCamera(false);
            fetchStories(); // Refresh stories
          }}
        />
      )}

      {/* Story Viewer Modal */}
      {showViewer && (
        <StoryViewer
          stories={selectedUserStories}
          initialStoryIndex={0}
          onClose={() => setShowViewer(false)}
          onStoryChange={(index) => {
            // Mark as viewed, update UI, etc.
            fetchStories();
          }}
        />
      )}
    </>
  );
};