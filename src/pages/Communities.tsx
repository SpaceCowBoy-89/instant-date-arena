import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Users, Search, Plus, TrendingUp, Book, Gamepad2, ChefHat, Music, Camera, Dumbbell, Film, Palette, Mountain, Trophy, Archive, Cpu, TreePine, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { COMMUNITY_GROUPS } from "@/data/communityGroups";
import { getUserCommunityMatches, getSimilarCommunities } from "@/utils/communityMatcher";
import Navbar from "@/components/Navbar";
import AIQuiz from "@/components/AIQuiz";

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
  member_count?: number;
  unread_count?: number;
  is_member?: boolean;
}

const ICON_MAP = {
  Book,
  Film,
  ChefHat,
  Gamepad2,
  Sparkles,
  Palette,
  Mountain,
  Trophy,
  Archive,
  Cpu,
  Music,
  TreePine,
  Users
};

const INTEREST_CATEGORIES = Object.entries(COMMUNITY_GROUPS).map(([groupName, groupData]) => {
  const IconComponent = ICON_MAP[groupData.icon as keyof typeof ICON_MAP] || Users;
  return {
    id: groupName.toLowerCase().replace(/\s+/g, '-'),
    name: groupName,
    description: groupData.subtitle,
    icon: IconComponent,
    interests: groupData.interests,
    color: groupData.color
  };
});

const Communities = () => {
  const [user, setUser] = useState<any>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myGroups, setMyGroups] = useState<Community[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<Community[]>([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<Community[]>([]);
  const [similarCommunities, setSimilarCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/");
        return;
      }

      setUser(authUser);
      await loadCommunities(authUser.id);
      
      // Check if user needs onboarding - look for both connections and communities participation
      const { data: userConnectionsGroups } = await supabase
        .from('user_connections_groups')
        .select('*')
        .eq('user_id', authUser.id);
      
      // Also check user's interests from their Q&A answers to suggest relevant groups
      const { data: userAnswers } = await supabase
        .from('user_connections_answers')
        .select('selected_answer')
        .eq('user_id', authUser.id);
      
      // Get personalized recommendations based on user's interests
      if (userAnswers && userAnswers.length > 0) {
        const matches = await getUserCommunityMatches(authUser.id);
        const personalizedCommunities = matches.map(match => {
          const community = communities.find(c => c.tag_name === match.groupName);
          return community ? {
            ...community,
            match_score: match.matchScore,
            matched_interests: match.matchedInterests
          } : null;
        }).filter(Boolean);
        setPersonalizedSuggestions(personalizedCommunities as Community[]);
      }

      // Get similar communities based on current memberships
      if (userConnectionsGroups && userConnectionsGroups.length > 0) {
        const similarMatches = await getSimilarCommunities(authUser.id);
        const similarCommunities = similarMatches.map(match => {
          const community = communities.find(c => c.tag_name === match.groupName);
          return community ? {
            ...community,
            match_score: match.matchScore,
            matched_interests: match.matchedInterests
          } : null;
        }).filter(Boolean);
        setSimilarCommunities(similarCommunities as Community[]);
      }
      
      if (!userConnectionsGroups || userConnectionsGroups.length === 0) {
        setShowOnboarding(true);
      }
      
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

  const loadCommunities = async (userId: string) => {
    try {
      // Load all groups
      const { data: allGroups } = await supabase
        .from('connections_groups')
        .select('*');

      if (allGroups) {
        setCommunities(allGroups);
        
        // Load user's groups
        const { data: userGroupMemberships } = await supabase
          .from('user_connections_groups')
          .select(`
            connections_groups (
              id,
              tag_name,
              tag_subtitle
            )
          `)
          .eq('user_id', userId);

        const userGroups = userGroupMemberships?.map(m => ({
          ...m.connections_groups,
          is_member: true,
          unread_count: Math.floor(Math.random() * 5) // Simulated unread count
        })) || [];

        setMyGroups(userGroups);

        // Set suggested groups (groups user is not in)
        const userGroupIds = new Set(userGroups.map(g => g.id));
        const suggested = allGroups
          .filter(g => !userGroupIds.has(g.id))
          .map(g => ({
            ...g,
            member_count: Math.floor(Math.random() * 5000) + 100, // Simulated member count
            is_member: false
          }))
          .slice(0, 2); // Limit to 2 suggested communities

        setSuggestedGroups(suggested);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_connections_groups')
        .insert({
          user_id: user.id,
          group_id: communityId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joined community successfully!",
      });

      // Reload communities
      await loadCommunities(user.id);
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.tag_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.tag_subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-20">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 mb-4">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Join Your Communities!</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Connect with Book Lovers, Gamers, and more.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Choose Your Interests</CardTitle>
                <CardDescription>
                  Select communities that match your hobbies and interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INTEREST_CATEGORIES.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <Card 
                        key={category.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                        onClick={() => {
                          // Find matching community and join it
                          const matchingCommunity = communities.find(c => 
                            c.tag_name.toLowerCase() === category.name.toLowerCase()
                          );
                          if (matchingCommunity) {
                            joinCommunity(matchingCommunity.id);
                            setShowOnboarding(false);
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 ${category.color || 'bg-primary/10'} rounded-lg text-white`}>
                                <IconComponent className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{category.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {category.interests.slice(0, 6).map((interest) => (
                                <Badge key={interest} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {category.interests.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                  +{category.interests.length - 6} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="flex justify-center gap-4 mt-6">
                  <Button onClick={() => setShowOnboarding(false)} variant="outline">
                    Skip for now
                  </Button>
                  <Button onClick={() => setShowOnboarding(false)}>
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ScrollArea className="h-screen">
        <div className="container mx-auto px-4 py-6 pb-20">
          {/* Header */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">
                Hey {user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'}, explore your communities!
              </h1>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search communities or posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* My Groups */}
            {myGroups.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Communities</h2>
                  <Button size="sm" variant="ghost" onClick={() => setShowOnboarding(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Join More
                  </Button>
                </div>
                
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {myGroups.map((group) => (
                      <CarouselItem key={group.id} className="pl-2 md:pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
                        <Card 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/communities/${group.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-sm">{group.tag_name}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground">{group.tag_subtitle}</p>
                              {group.unread_count && group.unread_count > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {group.unread_count} new
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}

            {/* Personalized Suggestions */}
            {personalizedSuggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Perfect Match For You</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalizedSuggestions.slice(0, 4).map((group: any) => (
                    <Card key={group.id} className="hover:shadow-md transition-shadow border-primary/20">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{group.tag_name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {group.match_score} matches
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{group.tag_subtitle}</p>
                              {group.matched_interests && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {group.matched_interests.slice(0, 3).map((interest: string) => (
                                    <Badge key={interest} variant="outline" className="text-xs">
                                      {interest}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => joinCommunity(group.id)}
                            disabled={group.is_member}
                          >
                            {group.is_member ? "Joined" : "Join Perfect Match"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Communities */}
            {similarCommunities.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Similar Communities</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similarCommunities.map((group: any) => (
                    <Card key={group.id} className="hover:shadow-md transition-shadow border-primary/20">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{group.tag_name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {group.match_score} shared interests
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{group.tag_subtitle}</p>
                              {group.matched_interests && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {group.matched_interests.slice(0, 3).map((interest: string) => (
                                    <Badge key={interest} variant="outline" className="text-xs">
                                      {interest}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => joinCommunity(group.id)}
                          >
                            Join Community
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Groups */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  {personalizedSuggestions.length > 0 || similarCommunities.length > 0 ? "More Communities" : "Suggested Communities"}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(searchTerm ? filteredCommunities : suggestedGroups).map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{group.tag_name}</h3>
                            <p className="text-sm text-muted-foreground">{group.tag_subtitle}</p>
                          </div>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        {group.member_count && (
                          <p className="text-xs text-muted-foreground">
                            {group.member_count.toLocaleString()} members
                          </p>
                        )}
                        
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => joinCommunity(group.id)}
                          disabled={group.is_member}
                        >
                          {group.is_member ? "Joined" : "Join"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Ask AI Section - Only show if quiz not completed */}
            {!quizCompleted && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Ask AI</h2>
                
                <AIQuiz 
                  userId={user.id} 
                  onQuizComplete={(groupName) => {
                    setQuizCompleted(true);
                    if (groupName) {
                      toast({
                        title: "Perfect Match Found!",
                        description: `Welcome to ${groupName}!`,
                      });
                      // Reload communities to show new membership
                      loadCommunities(user.id);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      <Navbar />
    </div>
  );
};

export default Communities;