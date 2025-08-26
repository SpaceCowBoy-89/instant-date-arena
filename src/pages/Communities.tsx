import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Calendar, Sparkles, BookOpen, Film, Utensils, Gamepad, Palette, Mountain, Trophy, Archive, Cpu, Music, TreePine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { COMMUNITY_GROUPS } from "@/data/communityGroups";
import { getUserCommunityMatches, getSimilarCommunities } from "@/utils/communityMatcher";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
  member_count?: number;
  unread_count?: number;
  is_member?: boolean;
  match_score?: number;
  matched_interests?: string[];
  recent_activity?: string;
  next_event?: string;
  icon?: React.ComponentType<{ className?: string }>;  // Added for icon component
}

const ICON_MAP = {
  Book: BookOpen,
  Film: Film,
  ChefHat: Utensils,
  Gamepad2: Gamepad,
  Sparkles: Sparkles,
  Palette: Palette,
  Mountain: Mountain,
  Trophy: Trophy,
  Archive: Archive,
  Cpu: Cpu,
  Music: Music,
  TreePine: TreePine,
  Users: Users
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
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<Community[]>([]);
  const [similarCommunities, setSimilarCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(() => localStorage.getItem('quiz-completed') === 'true');
  const navigate = useNavigate();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState(6);

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
      const { data: userConnectionsGroups } = await supabase
        .from('user_connections_groups')
        .select('*')
        .eq('user_id', authUser.id);
      const { data: userAnswers } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      if (userAnswers) {
        setQuizCompleted(true);
        localStorage.setItem('quiz-completed', 'true');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      toast({ title: "Error", description: "Failed to load user data", variant: "destructive" });
      setLoading(false);
    }
  };

  const loadCommunities = async (userId: string) => {
    try {
      const { data: allCommunities } = await supabase
        .from('connections_groups')
        .select('*');

      const { data: userGroups } = await supabase
        .from('user_connections_groups')
        .select('*, connections_groups(*)')
        .eq('user_id', userId);

      if (userGroups) {
        setMyGroups(userGroups.map(ug => ug.connections_groups));
      }

      if (allCommunities && userGroups) {
        const joinedIds = new Set(userGroups.map(ug => ug.group_id));
        const nonJoinedCommunities = allCommunities.filter(community => !joinedIds.has(community.id));
        setCommunities(nonJoinedCommunities.map(community => ({
          ...community,
          icon: ICON_MAP[community.icon as keyof typeof ICON_MAP] || Users
        })));
      }

      const matches = await getUserCommunityMatches(userId);
      setPersonalizedSuggestions(matches);

      const similar = await getSimilarCommunities(userId);
      setSimilarCommunities(similar);
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  };

  const joinCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections_groups')
        .insert({
          user_id: user?.id,
          group_id: communityId
        });

      if (error) throw error;

      toast({ title: "Joined!", description: "You've successfully joined the community!" });
      await loadCommunities(user?.id);
    } catch (error) {
      console.error('Error joining community:', error);
      toast({ title: "Error", description: "Failed to join community", variant: "destructive" });
    }
  };

  const filteredCommunities = communities.filter(group => 
    group.tag_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.tag_subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleItems((prev) => Math.min(prev + 3, communities.length));
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [communities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mobile-container header-safe pb-20">
      <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold">Communities</h1>
      </div>

      <div className="p-4 space-y-6">
        {!quizCompleted && (
          <Card className="bg-gradient-to-r from-romance to-purple-accent text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2"><Sparkles className="h-6 w-6" /><h2 className="text-lg font-semibold">Discover Your Community</h2></div>
              <p className="text-sm mb-4">Take our quick AI Quiz to find groups that match your vibe!</p>
              <Button className="w-full bg-white text-romance hover:bg-gray-100" onClick={() => navigate('/quiz')}>
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="relative border border-[#D81B60]/30 dark:border-[#D81B60]/20 rounded-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-400" />
          <Input 
            placeholder="Search communities..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 rounded-full h-10 text-base border-0 focus-visible:ring-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {searchTerm && (
          <ScrollArea className="h-[200px] mt-2 border rounded-lg bg-white dark:bg-gray-800">
            <AnimatePresence>
              {filteredCommunities.map(group => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => joinCommunity(group.id)}
                >
                  <Users className="h-4 w-4" />
                  <span>{group.tag_name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredCommunities.length === 0 && (
              <p className="p-2 text-center text-gray-500">No results found</p>
            )}
          </ScrollArea>
        )}

        <Tabs defaultValue="suggestions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="suggestions" className="space-y-4">
            {personalizedSuggestions.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center text-gray-600 space-y-4 p-4">
                <Sparkles className="h-16 w-16 opacity-50" />
                <p className="max-w-xs">No suggestions yet. Complete your profile or take the quiz for personalized recommendations!</p>
                <Button variant="outline" onClick={() => navigate('/quiz')}>Take Quiz Now</Button>
              </div>
            )}
            <ScrollArea className="h-[calc(100vh-200px)]">
              <AnimatePresence>
                {personalizedSuggestions.slice(0, visibleItems).map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-4"
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold">{group.tag_name}</h3>
                          <Badge variant="outline" className="text-primary border-primary">
                            {Math.round((group.match_score || 0) * 100)}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{group.tag_subtitle}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {group.matched_interests?.map(interest => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => joinCommunity(group.id)}>
                          Join Now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleItems < personalizedSuggestions.length && <div ref={loadMoreRef} />}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="trending" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <AnimatePresence>
                {communities.sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, visibleItems).map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4, ease: "easeOut" } }}
                    transition={{ duration: 0.3 }}
                    className="mb-4"
                  >
                    <Card className="cursor-pointer" onClick={() => navigate(`/communities/${group.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {group.icon && <group.icon className="h-5 w-5 text-primary" />}
                          <h3 className="font-bold">{group.tag_name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{group.tag_subtitle}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          {group.member_count?.toLocaleString() || '1K+'} members
                        </div>
                        <Button className="w-full mt-3 bg-primary hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); joinCommunity(group.id); }}>
                          Join Now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleItems < communities.length && <div ref={loadMoreRef} />}
            </ScrollArea>
            {communities.length === 0 && (
              <p className="text-center text-gray-500 text-sm sm:text-base">No trending communities available.</p>
            )}
          </TabsContent>
          {/* Add similar fixes for other tabs */}
        </Tabs>
      </div>
      <Navbar />
    </div>
  );
};

export default Communities;