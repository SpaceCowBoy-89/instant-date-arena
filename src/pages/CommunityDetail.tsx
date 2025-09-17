import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Calendar, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import { motion } from "framer-motion";
import { COMMUNITY_GROUPS, ICON_MAP } from "@/data/communityGroups";
import { PostActions } from "@/components/PostActions";
import { PostCreation } from "@/components/PostCreation";
import { PostCard } from "@/components/PostCard";
import { MOCK_USERS, getUserById } from "@/data/mockUsers";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { EventList } from "@/components/EventList";

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
}

interface Post {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string;
  };
  likes?: number;
  comments?: number;
}

interface Member {
  id: string;
  user_id: string;
  user?: {
    name: string;
    photo_url?: string;
  };
}

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getCommunityIcon = (groupName: string) => {
    const groupData = COMMUNITY_GROUPS[groupName as keyof typeof COMMUNITY_GROUPS];
    const IconComponent = groupData ? ICON_MAP[groupData.icon as keyof typeof ICON_MAP] : Users;
    return <IconComponent className="h-7 w-7 text-white" />;
  };

  const getCommunityColor = (groupName: string) => {
    const groupData = COMMUNITY_GROUPS[groupName as keyof typeof COMMUNITY_GROUPS];
    return groupData?.color || 'bg-gray-500';
  };

  const getCommunityTheme = (groupName: string) => {
    const themes: Record<string, { background: string; text: string; iconBg: string; description: string }> = {
      "Book Lovers": {
        background: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50",
        text: "text-amber-900 dark:text-amber-100",
        iconBg: "bg-amber-500",
        description: "Where readers and writers unite to share stories, ideas, and literary adventures."
      },
      "Movie Aficionados": {
        background: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50",
        text: "text-purple-900 dark:text-purple-100",
        iconBg: "bg-purple-500",
        description: "For cinephiles and casual watchers alike — discuss films, share reviews, and relive classics."
      },
      "Foodies": {
        background: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50",
        text: "text-orange-900 dark:text-orange-100",
        iconBg: "bg-orange-500",
        description: "Savor flavors, swap recipes, and explore the culinary world one bite at a time."
      },
      "Gamers": {
        background: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50",
        text: "text-blue-900 dark:text-blue-100",
        iconBg: "bg-blue-500",
        description: "From casual play to hardcore battles, squad up with those who love the world of gaming."
      },
      "Anime Addicts": {
        background: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50",
        text: "text-pink-900 dark:text-pink-100",
        iconBg: "bg-pink-500",
        description: "A space for fans of anime and Japanese culture to discuss, binge, and celebrate together."
      },
      "Creators": {
        background: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50",
        text: "text-green-900 dark:text-green-100",
        iconBg: "bg-green-500",
        description: "A hub for painters, writers, designers, and dreamers to share inspiration and creations."
      },
      "Adventurers": {
        background: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50",
        text: "text-emerald-900 dark:text-emerald-100",
        iconBg: "bg-emerald-500",
        description: "For thrill-seekers and explorers who live for the outdoors, travel, and new challenges."
      },
      "Sports Enthusiasts": {
        background: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50",
        text: "text-red-900 dark:text-red-100",
        iconBg: "bg-red-500",
        description: "Cheer, play, and debate the games you love with fellow fans and athletes."
      },
      "Collectors": {
        background: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/50",
        text: "text-indigo-900 dark:text-indigo-100",
        iconBg: "bg-indigo-500",
        description: "Connect with fellow collectors who appreciate the art of finding and preserving treasures."
      },
      "Tech Hobbyists": {
        background: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/50 dark:to-cyan-900/50",
        text: "text-cyan-900 dark:text-cyan-100",
        iconBg: "bg-cyan-500",
        description: "Explore gadgets, code, and innovations with a community of curious tinkerers."
      },
      "Music & Performance": {
        background: "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/50",
        text: "text-violet-900 dark:text-violet-100",
        iconBg: "bg-violet-500",
        description: "Celebrate sound, rhythm, and stage — from playlists to live shows, this is your spotlight."
      },
      "Nature Lovers": {
        background: "bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-950/50 dark:to-lime-900/50",
        text: "text-lime-900 dark:text-lime-100",
        iconBg: "bg-lime-500",
        description: "Connect with fellow outdoor explorers who find peace and joy in the beauty of the natural world."
      },
      "Social & Cultural": {
        background: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/50",
        text: "text-rose-900 dark:text-rose-100",
        iconBg: "bg-rose-500",
        description: "Dive into global perspectives, traditions, and conversations that bring people together."
      }
    };

    return themes[groupName] || {
      background: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50",
      text: "text-gray-900 dark:text-gray-100",
      iconBg: "bg-gray-500",
      description: "Connect with like-minded individuals who share your interests and passions."
    };
  };
  
  const [user, setUser] = useState<any>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  // Removed unused post creation state variables - now handled by PostCreation component

  useEffect(() => {
    checkUser();
  }, [id]);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/");
        return;
      }

      setUser(authUser);
      await loadCommunityData(authUser.id);
    } catch (error) {
      console.error('Error checking user:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityData = async (userId: string) => {
    if (!id) return;

    try {
      // Load community details
      const { data: communityData } = await supabase
        .from('connections_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (communityData) {
        setCommunity(communityData);
      }

      // Check if user is a member
      const { data: membership } = await supabase
        .from('user_connections_groups')
        .select('*')
        .eq('user_id', userId)
        .eq('group_id', id)
        .single();

      setIsMember(!!membership);

      // Load posts (using group messages as posts)
      const { data: postsData } = await supabase
        .from('connections_group_messages')
        .select(`
          id,
          user_id,
          message,
          created_at
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false });

      if (postsData) {
        const postsWithMockData = postsData.map(post => {
          // Try to find a mock user for this post, or create a fallback
          const mockUser = getUserById(post.user_id) || MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
          return {
            ...post,
            user: {
              name: mockUser?.name || `User ${post.user_id.slice(0, 8)}`,
              photo_url: mockUser?.photo_url
            },
            likes: Math.floor(Math.random() * 50),
            comments: Math.floor(Math.random() * 20)
          };
        });
        setPosts(postsWithMockData);
      }

      // Load members
      const { data: membersData } = await supabase
        .from('user_connections_groups')
        .select(`
          id,
          user_id
        `)
        .eq('group_id', id);

      if (membersData) {
        const membersWithMockData = membersData.map(member => ({
          ...member,
          user: {
            name: `Member ${member.user_id.slice(0, 8)}`,
            photo_url: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`
          }
        }));
        setMembers(membersWithMockData);
        setMemberCount(membersData.length);
      }

    } catch (error) {
      console.error('Error loading community data:', error);
    }
  };

  const joinCommunity = async () => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('user_connections_groups')
        .insert({
          user_id: user.id,
          group_id: id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joined community successfully!",
      });

      setIsMember(true);
      await loadCommunityData(user.id);
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    }
  };

  const leaveCommunity = async () => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('user_connections_groups')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Left community successfully",
      });

      // Navigate back to Communities page
      navigate("/communities");
    } catch (error) {
      console.error('Error leaving community:', error);
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive",
      });
    }
  };

  const createPost = async (content: string, mentions: string[] = [], hashtags: string[] = [], fileUrls: string[] = []) => {
    if (!user || !id || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('connections_group_messages')
        .insert({
          group_id: id,
          user_id: user.id,
          message: content,
          mentions: mentions.length > 0 ? mentions : null,
          hashtags: hashtags.length > 0 ? hashtags : null,
          file_urls: fileUrls.length > 0 ? fileUrls : null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      await loadCommunityData(user.id);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
      throw error; // Re-throw so PostCreation component can handle it
    }
  };

  if (loading) {
    return <Spinner message="Loading community..." />;
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Community Not Found</CardTitle>
            <CardDescription>
              The community you're looking for doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/communities")} className="w-full">
              Back to Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 pb-40 md:pb-24" style={{ minHeight: 'calc(100vh + 200px)' }}>
        {/* Header: Back button and Group name */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/communities")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">{community.tag_name}</h1>
        </div>

        {/* Card */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`rounded-3xl border-2 shadow-lg overflow-hidden ${getCommunityTheme(community.tag_name).background}`}>
              <CardContent className="p-6">
                {/* Card layout */}
                <div className="flex items-center gap-4 mb-6">
                  {/* Community Icon */}
                  <div className={`p-4 ${getCommunityTheme(community.tag_name).iconBg} rounded-2xl shadow-md flex items-center justify-center`}>
                    {getCommunityIcon(community.tag_name)}
                  </div>

                  {/* Member Count */}
                  <div className={`flex items-center gap-2 p-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-black/20`}>
                    <Users className={`h-4 w-4 ${getCommunityTheme(community.tag_name).text}`} />
                    <span className={`text-sm font-medium ${getCommunityTheme(community.tag_name).text}`}>{memberCount.toLocaleString()} members</span>
                    {isMember && (
                      <Badge
                        variant="secondary"
                        className="ml-2 text-xs bg-green-500/20 text-green-800 dark:text-green-200 border-green-500/30 px-2 py-1 rounded-full"
                      >
                        ✓ Joined
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description of the group */}
                <div className="mb-6">
                  <p className={`text-lg leading-relaxed ${getCommunityTheme(community.tag_name).text} opacity-90`}>
                    {getCommunityTheme(community.tag_name).description}
                  </p>
                </div>

                {/* "Join Community" Button */}
                <div className="flex justify-center">
                  {isMember ? (
                    <Button
                      variant="outline"
                      onClick={leaveCommunity}
                      className={`${getCommunityTheme(community.tag_name).text} hover:text-red-700 dark:hover:text-red-300 hover:border-red-500 border-2 border-black/20 dark:border-white/20 rounded-xl font-medium bg-white/20 dark:bg-black/20 px-6 py-3`}
                    >
                      Leave Community
                    </Button>
                  ) : (
                    <Button
                      onClick={joinCommunity}
                      className={`${getCommunityTheme(community.tag_name).iconBg} hover:opacity-90 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all px-6 py-3`}
                    >
                      Join Community
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Bar */}
          {isMember && (
            <div className="flex gap-2 justify-center">
              <CreateEventDialog
                groupId={id || ''}
                userId={user.id}
                onEventCreated={() => {
                  toast({
                    title: "Event created!",
                    description: "Your event has been created successfully",
                  });
                }}
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {/* Post Creation Component */}
              {isMember && (
                <PostCreation
                  communityName={community.tag_name}
                  userAvatar={user?.user_metadata?.avatar_url}
                  userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'}
                  onCreatePost={createPost}
                  placeholder="What's on your mind?"
                  maxLength={500}
                />
              )}

              {/* Posts List */}
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    communityName={community.tag_name}
                    onLike={async (postId) => {
                      // Handle like functionality
                      console.log('Liked post:', postId);
                    }}
                    onComment={(postId) => {
                      // Handle comment functionality
                      console.log('Comment on post:', postId);
                    }}
                    onShare={(postId) => {
                      // Handle share functionality
                      console.log('Share post:', postId);
                    }}
                    onReport={(postId) => {
                      // Handle report functionality
                      console.log('Report post:', postId);
                    }}
                  />
                ))
              ) : (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200/50 dark:border-blue-800/30">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {isMember ? "No Posts Yet" : "Join to See Posts"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isMember
                        ? "Be the first to start a conversation in this community!"
                        : "Join the community to see posts and share your thoughts with other members."
                      }
                    </p>
                    {!isMember && (
                      <Button
                        onClick={joinCommunity}
                        className={`${getCommunityTheme(community.tag_name).iconBg} hover:opacity-90 text-white rounded-xl font-medium shadow-lg`}
                      >
                        Join Community
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="events">
              {user && id && (
                <EventList groupId={id} userId={user.id} />
              )}
            </TabsContent>

            <TabsContent value="members">
              {members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{member.user?.name}</p>
                            <p className="text-xs text-muted-foreground">Member</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Members Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This community is waiting for its first members to join and start connecting!
                    </p>
                    {!isMember && (
                      <Button
                        onClick={joinCommunity}
                        className={`${getCommunityTheme(community.tag_name).iconBg} hover:opacity-90 text-white rounded-xl font-medium shadow-lg`}
                      >
                        Be the First to Join
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="about">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">About {community.tag_name}</h3>
                      <p className="text-muted-foreground">{community.tag_subtitle}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Community Guidelines</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Be respectful and kind to all members</li>
                        <li>• Stay on topic and relevant to the community</li>
                        <li>• No spam or promotional content</li>
                        <li>• Follow the platform's terms of service</li>
                      </ul>
                    </div>
                    
                    {isMember && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={leaveCommunity}
                          className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Leave Community
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default CommunityDetail;