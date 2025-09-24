import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bookmark, ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PostCard } from "@/components/PostCard";

interface BookmarkedPost {
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
  user_liked?: boolean;
  user_bookmarked?: boolean;
  community?: {
    id: string;
    tag_name: string;
  };
}

const Bookmarks = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchBookmarkedPosts(user.id);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkedPosts = async (userId: string) => {
    try {
      console.log('Fetching bookmarks for user:', userId);

      // First, get the bookmark entries
      const { data: bookmarks, error: bookmarkError } = await supabase
        .from('post_bookmarks')
        .select('post_id, created_at')
        .eq('user_id', userId);

      if (bookmarkError) {
        console.error('Error fetching bookmarks:', bookmarkError);
        return;
      }

      console.log('Found bookmarks:', bookmarks);

      if (!bookmarks || bookmarks.length === 0) {
        console.log('No bookmarks found');
        setBookmarkedPosts([]);
        return;
      }

      // Get the post IDs
      const postIds = bookmarks.map(b => b.post_id);
      console.log('Post IDs to fetch:', postIds);

      // Now fetch the posts with their details
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          message,
          created_at,
          media_urls,
          group_id
        `)
        .in('id', postIds);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      console.log('Found posts:', posts);

      if (!posts || posts.length === 0) {
        console.log('No posts found for bookmark IDs');
        setBookmarkedPosts([]);
        return;
      }

      // Get unique user IDs and group IDs
      const userIds = [...new Set(posts.map(p => p.user_id))];
      const groupIds = [...new Set(posts.map(p => p.group_id))];

      console.log('Fetching users:', userIds);
      console.log('Fetching groups:', groupIds);

      // Fetch users and groups separately
      const [
        { data: users, error: usersError },
        { data: groups, error: groupsError }
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, photo_url')
          .in('id', userIds),
        supabase
          .from('connections_groups')
          .select('id, tag_name')
          .in('id', groupIds)
      ]);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }
      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
      }

      console.log('Found users:', users);
      console.log('Found groups:', groups);

      // Create lookup maps
      const userMap = new Map(users?.map(u => [u.id, u]) || []);
      const groupMap = new Map(groups?.map(g => [g.id, g]) || []);

      // Transform the data
      const transformedPosts = posts.map(post => {
        const user = userMap.get(post.user_id);
        const group = groupMap.get(post.group_id);

        return {
          id: post.id,
          user_id: post.user_id,
          message: post.message,
          created_at: post.created_at,
          media_urls: post.media_urls || undefined,
          user: {
            name: user?.name || `User ${post.user_id.slice(0, 8)}`,
            photo_url: user?.photo_url
          },
          community: {
            id: group?.id || post.group_id,
            tag_name: group?.tag_name || 'Unknown Community'
          },
          likes: 0, // Will be populated separately
          comments: 0,
          user_liked: false,
          user_bookmarked: true
        };
      });

      console.log('Transformed posts:', transformedPosts);
      setBookmarkedPosts(transformedPosts);

    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
      toast({
        title: "Error",
        description: "Failed to load bookmarked posts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    try {
      await supabase
        .from('post_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      // Remove from local state
      setBookmarkedPosts(prev => prev.filter(post => post.id !== postId));

      toast({
        title: "Bookmark removed",
        description: "Post removed from your bookmarks.",
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to remove bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = bookmarkedPosts.find(p => p.id === postId);
      if (!post) return;

      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        setBookmarkedPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, likes: Math.max(0, (p.likes || 0) - 1), user_liked: false }
              : p
          )
        );
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        setBookmarkedPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, likes: (p.likes || 0) + 1, user_liked: true }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="bg-purple-500 p-2 rounded-xl shrink-0">
            <Bookmark className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground truncate">My Bookmarks</h1>
            <p className="text-sm text-muted-foreground">
              {bookmarkedPosts.length} saved post{bookmarkedPosts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto">
          {bookmarkedPosts.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bookmark className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No bookmarks yet</h3>
                <p className="text-muted-foreground mb-4">
                  When you bookmark posts, they'll appear here for easy access later.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/communities')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Explore Communities
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookmarkedPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    {/* Community badge */}
                    <div className="mb-2">
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={() => navigate(`/communities/${post.community?.id}`)}
                      >
                        {post.community?.tag_name}
                      </Badge>
                    </div>

                    <PostCard
                      post={post}
                      currentUserId={user.id}
                      communityName={post.community?.tag_name || 'Community'}
                      onLike={handleLike}
                      onComment={() => {
                        // Navigate to the community detail page with the post
                        navigate(`/communities/${post.community?.id}#${post.id}`);
                      }}
                      onShare={(postId) => {
                        const shareUrl = `${window.location.origin}/communities/${post.community?.id}#${postId}`;
                        if (navigator.share) {
                          navigator.share({
                            title: `Post from ${post.community?.tag_name}`,
                            text: post.message,
                            url: shareUrl
                          });
                        } else {
                          navigator.clipboard.writeText(shareUrl);
                          toast({
                            title: "Link Copied",
                            description: "Post link copied to clipboard!",
                          });
                        }
                      }}
                      onBookmark={() => handleRemoveBookmark(post.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Bookmarks;