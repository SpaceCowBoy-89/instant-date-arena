import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, Plus, Calendar, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { PostActions } from "@/components/PostActions";
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
  
  const [user, setUser] = useState<any>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);

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
        const postsWithMockData = postsData.map(post => ({
          ...post,
          user: { name: `User ${post.user_id.slice(0, 8)}` },
          likes: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 20)
        }));
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

  const createPost = async () => {
    if (!user || !id || !newPost.trim()) return;

    try {
      const { error } = await supabase
        .from('connections_group_messages')
        .insert({
          group_id: id,
          user_id: user.id,
          message: newPost
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      setNewPost("");
      setNewPostTitle("");
      setShowCreatePost(false);
      await loadCommunityData(user.id);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/communities")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Community Header */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">{community.tag_name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{community.tag_subtitle}</CardDescription>
                  <p className="text-sm text-muted-foreground">{memberCount.toLocaleString()} members</p>
                </div>
                <div className="space-y-2">
                  {isMember ? (
                    <Button variant="outline" onClick={leaveCommunity}>
                      Leave Group
                    </Button>
                  ) : (
                    <Button onClick={joinCommunity}>
                      Join Community
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Action Bar */}
          {isMember && (
            <div className="flex gap-2 justify-center">
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                    <DialogDescription>
                      Share something with the {community.tag_name} community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Post title (optional)"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createPost} disabled={!newPost.trim()}>
                        Post
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
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
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{post.user?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm">{post.message}</p>
                        
                        <PostActions
                          postId={post.id}
                          postUserId={post.user_id}
                          postUserName={post.user?.name || 'Unknown User'}
                          postContent={post.message}
                          initialLikes={post.likes || 0}
                          initialComments={post.comments || 0}
                          currentUserId={user.id}
                          groupId={id || ''}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
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
                        <Button variant="destructive" onClick={leaveCommunity}>
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