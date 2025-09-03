import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Users, Search, Plus, TrendingUp, Book, Gamepad2, ChefHat, Music, Camera, Dumbbell, Film, Palette, Mountain, Trophy, Archive, Cpu, TreePine, Sparkles, Check, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [quizCompleted, setQuizCompleted] = useState(() => {
    // Check if quiz was already completed in this session
    return localStorage.getItem('quiz-completed') === 'true';
  });
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
      
      // If user has groups, they've likely completed the quiz before
      if (userConnectionsGroups && userConnectionsGroups.length > 0) {
        setQuizCompleted(true);
        localStorage.setItem('quiz-completed', 'true');
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
      // Load all groups with member counts
      const { data: allGroups } = await supabase
        .from('connections_groups')
        .select('*');

      if (allGroups) {
        // Get member counts for each group
        const groupsWithCounts = await Promise.all(
          allGroups.map(async (group) => {
            const { count } = await supabase
              .from('user_connections_groups')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);
            
            console.log('Group member count:', {
              groupId: group.id,
              groupName: group.tag_name,
              memberCount: count
            });
            
            return {
              ...group,
              member_count: count || 0
            };
          })
        );

        setCommunities(groupsWithCounts);
        
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

        const userGroups = userGroupMemberships?.map(m => {
          const groupWithCount = groupsWithCounts.find(g => g.id === m.connections_groups.id);
          console.log('Mapping user group:', {
            groupId: m.connections_groups.id,
            groupName: m.connections_groups.tag_name,
            foundGroupWithCount: groupWithCount,
            memberCount: groupWithCount?.member_count
          });
          return {
            ...m.connections_groups,
            is_member: true,
            member_count: groupWithCount?.member_count || 0,
            unread_count: 0 // We can implement real unread counts later if needed
          };
        }) || [];

        setMyGroups(userGroups);

        // Set suggested groups (groups user is not in)
        const userGroupIds = new Set(userGroups.map(g => g.id));
        const suggested = groupsWithCounts
          .filter(g => !userGroupIds.has(g.id))
          .map(g => ({
            ...g,
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
    if (!user) {
      console.error('No user found when trying to join community');
      toast({
        title: "Error",
        description: "Please sign in to join communities",
        variant: "destructive",
      });
      return;
    }

    if (!communityId) {
      console.error('No community ID provided');
      toast({
        title: "Error",
        description: "Invalid community selection",
        variant: "destructive",
      });
      return;
    }

    // Check if user has reached the maximum limit of 2 groups
    if (myGroups.length >= 2) {
      toast({
        title: "Group Limit Reached",
        description: "You can only join up to 2 communities. Leave a community first to join a new one.",
        variant: "destructive",
      });
      return;
    }

    console.log('Attempting to join community:', { userId: user.id, communityId });

    try {
      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('user_connections_groups')
        .select('id')
        .eq('user_id', user.id)
        .eq('group_id', communityId)
        .maybeSingle();

      if (existingMembership) {
        toast({
          title: "Already a member",
          description: "You're already part of this community!",
        });
        return;
      }

      const { error } = await supabase
        .from('user_connections_groups')
        .insert({
          user_id: user.id,
          group_id: communityId
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // First show success message
      toast({
        title: "Success",
        description: "Joined community successfully!",
      });

      // Immediately update the local state to reflect the new membership
      const joinedCommunity = communities.find(c => c.id === communityId);
      if (joinedCommunity) {
        // Add to myGroups immediately
        const newGroup = {
          ...joinedCommunity,
          is_member: true,
          unread_count: 0
        };
        setMyGroups(prev => [...prev, newGroup]);
        
        // Remove from suggested groups
        setSuggestedGroups(prev => prev.filter(g => g.id !== communityId));
      }

      // Then reload communities to ensure data consistency
      await loadCommunities(user.id);
    } catch (error: any) {
      console.error('Error joining community:', error);
      
      let errorMessage = "Failed to join community";
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {INTEREST_CATEGORIES.map((category) => {
                    const IconComponent = category.icon;
                    const isJoined = myGroups.some(g => g.tag_name.toLowerCase() === category.name.toLowerCase());
                    return (
                      <Card 
                        key={category.id} 
                        className={`cursor-pointer transition-all duration-200 border border-date-border shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-communities-blue/30 ${
                          isJoined ? 'bg-communities-green/5 border-communities-green/30' : ''
                        }`}
                        style={{ width: '100%', maxWidth: '300px', height: '150px' }}
                        onClick={() => {
                          if (!isJoined) {
                            const matchingCommunity = communities.find(c => 
                              c.tag_name.toLowerCase() === category.name.toLowerCase()
                            );
                            if (matchingCommunity) {
                              joinCommunity(matchingCommunity.id);
                            }
                          }
                        }}
                      >
                        <CardContent className="p-3 h-full flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-communities-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconComponent className="h-5 w-5 text-communities-blue" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-foreground">{category.name}</h3>
                                <p className="text-xs text-communities-gray mt-1 line-clamp-2">{category.description}</p>
                              </div>
                            </div>
                            <div className="text-xs text-communities-gray">
                              {(() => {
                                const matchingCommunity = communities.find(c => 
                                  c.tag_name.toLowerCase() === category.name.toLowerCase()
                                );
                                return matchingCommunity?.member_count || 0;
                              })()} Members
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            disabled={isJoined}
                            className={`w-full h-8 text-xs font-medium transition-all duration-200 ${
                              isJoined 
                                ? 'bg-communities-green hover:bg-communities-green text-white' 
                                : 'bg-communities-blue hover:bg-communities-blue/90 text-white hover:scale-105'
                            }`}
                          >
                            {isJoined ? (
                              <div className="flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Joined
                              </div>
                            ) : (
                              'Join'
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex justify-center gap-4">
                    <Button 
                      onClick={() => setShowOnboarding(false)} 
                      variant="outline"
                      className="w-48 h-12 text-communities-gray border-communities-gray hover:bg-communities-gray/10"
                    >
                      Skip to Explore
                    </Button>
                    <Button 
                      onClick={() => setShowOnboarding(false)}
                      className="w-48 h-12 bg-communities-blue hover:bg-communities-blue/90 text-white"
                    >
                      Save & Explore
                    </Button>
                  </div>
                  <p className="text-center text-xs text-communities-gray">
                    Save your selections or skip to browse
                  </p>
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
                  <h2 className="text-xl font-bold">Your Interests</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {personalizedSuggestions.slice(0, 8).map((group: any) => (
                    <Card key={group.id} className="transition-all duration-200 border border-date-border shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-communities-blue/30" style={{ width: '100%', maxWidth: '300px', height: '150px' }}>
                      <CardContent className="p-3 h-full flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-communities-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-communities-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-foreground">{group.tag_name}</h3>
                              <p className="text-xs text-communities-gray mt-1 line-clamp-2">{group.tag_subtitle}</p>
                            </div>
                          </div>
                          <div className="text-xs text-communities-gray">
                            {group.member_count || 0} Members
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full h-8 text-xs font-medium bg-communities-blue hover:bg-communities-blue/90 text-white hover:scale-105 transition-all duration-200"
                          onClick={() => joinCommunity(group.id)}
                          disabled={group.is_member}
                        >
                          {group.is_member ? (
                            <div className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Joined
                            </div>
                          ) : (
                            'Join'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Communities */}
            {similarCommunities.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Popular</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {similarCommunities.map((group: any) => (
                    <Card key={group.id} className="transition-all duration-200 border border-date-border shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-communities-blue/30" style={{ width: '100%', maxWidth: '300px', height: '150px' }}>
                      <CardContent className="p-3 h-full flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-communities-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-communities-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-foreground">{group.tag_name}</h3>
                              <p className="text-xs text-communities-gray mt-1 line-clamp-2">{group.tag_subtitle}</p>
                            </div>
                          </div>
                          <div className="text-xs text-communities-gray">
                            {group.member_count || 0} Members
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full h-8 text-xs font-medium bg-communities-blue hover:bg-communities-blue/90 text-white hover:scale-105 transition-all duration-200"
                          onClick={() => joinCommunity(group.id)}
                        >
                          Join
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Communities with Pagination */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">
                  {personalizedSuggestions.length > 0 || similarCommunities.length > 0 ? "New" : "All Communities"}
                </h2>
              </div>
              
              {/* Pagination Controls */}
              {(() => {
                const currentItems = searchTerm ? filteredCommunities : suggestedGroups;
                const totalItems = currentItems.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentPageItems = currentItems.slice(startIndex, endIndex);
                
                return (
                  <>
                    {totalItems > 0 && (
                      <div className="flex justify-between items-center text-sm text-communities-gray">
                        <span>
                          {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
                        </span>
                        {totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="h-8 px-3"
                            >
                              Previous
                            </Button>
                            <span className="text-xs">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="h-8 px-3 flex items-center gap-1"
                            >
                              Next
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {currentPageItems.map((group) => (
                        <Card key={group.id} className="transition-all duration-200 border border-date-border shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-communities-blue/30" style={{ width: '100%', maxWidth: '300px', height: '150px' }}>
                          <CardContent className="p-3 h-full flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-communities-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Users className="h-5 w-5 text-communities-blue" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm text-foreground">{group.tag_name}</h3>
                                  <p className="text-xs text-communities-gray mt-1 line-clamp-2">{group.tag_subtitle}</p>
                                </div>
                              </div>
                              <div className="text-xs text-communities-gray">
                                {group.member_count?.toLocaleString() || 0} Members
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              className={`w-full h-8 text-xs font-medium transition-all duration-200 ${
                                group.is_member 
                                  ? 'bg-communities-green hover:bg-communities-green text-white' 
                                  : 'bg-communities-blue hover:bg-communities-blue/90 text-white hover:scale-105'
                              }`}
                              onClick={() => joinCommunity(group.id)}
                              disabled={group.is_member}
                            >
                              {group.is_member ? (
                                <div className="flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Joined
                                </div>
                              ) : (
                                'Join'
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Ask AI Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Ask AI</h2>
                {quizCompleted && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setQuizCompleted(false);
                      localStorage.removeItem('quiz-completed');
                    }}
                  >
                    Retake Quiz
                  </Button>
                )}
              </div>
              
              {!quizCompleted ? (
                <AIQuiz 
                  userId={user.id} 
                  onQuizComplete={(groupName) => {
                    setQuizCompleted(true);
                    localStorage.setItem('quiz-completed', 'true');
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
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        You've already completed the AI quiz! Click "Retake Quiz" above to discover new community suggestions.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
      <Navbar />
    </div>
  );
};

export default Communities;