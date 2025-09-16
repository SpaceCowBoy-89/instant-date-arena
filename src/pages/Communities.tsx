// Communities.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, Flame, Sparkles, Users, Zap, Swords, PenTool, Clock } from 'lucide-react';
import ArenaCard from '@/components/ArenaCard';
import { arenas, getActiveArenas } from '@/data/arenas';
import Spinner from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar';
import { ICON_MAP, COMMUNITY_GROUPS } from '@/data/communityGroups';
import { MOCK_POSTS, MOCK_USERS, getUserById } from '@/data/mockUsers';
import { EnhancedPostModal } from '@/components/EnhancedPostModal';
import Marquee from '@/components/ui/marquee';
import { MarqueePostCard } from '@/components/MarqueePostCard';
import { TweetCard } from '@/components/ui/tweet-card';
import { Preferences } from '@capacitor/preferences';
import { useMemo, useCallback } from 'react'; // For performance optimization
import { LazyLoadImage } from 'react-lazy-load-image-component'; // For performance tweak
import 'react-lazy-load-image-component/src/effects/blur.css'; // Lazy load effect
import { format, parseISO, isAfter, isBefore, differenceInMilliseconds } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { useCommunities, useUserGroupStatus } from '@/hooks/useCommunities';

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
  member_count?: number;
  icon?: React.ComponentType<{ className?: string }>;
  interests?: string[];
}

interface Post {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: { name: string; photo_url?: string };
  likes?: number;
  comments?: number;
  community_name?: string;
  is_trending?: boolean;
}

interface User {
  id: string;
}

interface Event {
  id: string;
  name: string;
  time: string;
  location: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  group_id?: string;
}


const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Button
    variant={active ? 'default' : 'outline'}
    size="sm"
    onClick={onClick}
    className={active ? 'bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300' : 'text-[hsl(var(--romance))] border-[hsl(var(--romance))]'}
    aria-label={active ? `${children} selected` : `Select ${children}`}
  >
    {children}
  </Button>
);

// Helper functions
const useDebounce = (callback: (...args: unknown[]) => void, delay: number) => {
  const debounceRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: unknown[]) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

const formatTimeInUserTimezone = (timeString: string) => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    // For now, we'll just convert ET to user's local time
    const [day, time] = timeString.split(' ');
    const [hour, period] = time.split(/(\d+)(AM|PM)/i).filter(Boolean);
    let hour24 = parseInt(hour);
    if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
    if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;

    const etDate = new Date();
    etDate.setHours(hour24, 0, 0, 0);

    return formatInTimeZone(etDate, userTimeZone, 'EEE h:mm a zzz');
  } catch {
    return timeString; // fallback to original format
  }
};

const getCountdownText = (nextEventDate?: Date) => {
  if (!nextEventDate) return null;

  const now = new Date();
  const diff = differenceInMilliseconds(nextEventDate, now);

  if (diff <= 0) return "Live now!";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};


const Communities = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState<Post | null>(null);
  const [showEventModal, setShowEventModal] = useState<Event | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Use cached queries
  const { data: communitiesData, isLoading: isCommunitiesLoading } = useCommunities(user?.id);
  const { data: hasJoinedGroup, isLoading: isGroupStatusLoading } = useUserGroupStatus(user?.id);

  // Extract data from cached queries
  const communities = communitiesData?.allCommunities || [];
  const myGroups = communitiesData?.userGroups || [];
  const personalizedSuggestions = communitiesData?.personalizedSuggestions || [];
  const posts = communitiesData?.posts || {};

  // Use mock trending posts with user data
  const trendingPosts = useMemo(() => {
    return MOCK_POSTS.slice(0, 3).map(post => {
      const user = getUserById(post.user_id);
      return {
        ...post,
        user: {
          name: user?.name || 'Unknown User',
          photo_url: user?.photo_url
        },
        community_name: user?.groups?.[0] || 'General',
        is_trending: true
      };
    });
  }, []);

  const events = communitiesData?.events || [];

  // Overall loading state
  const loading = initialLoading || isCommunitiesLoading || isGroupStatusLoading;
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [notificationRequests, setNotificationRequests] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastRandomizedRef = useRef<number>(0); // For 30-day randomization

  // Memoize filtered communities for performance
  const filteredCommunities = useMemo(() =>
    communities.filter(
      group =>
        group.tag_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.tag_subtitle.toLowerCase().includes(searchTerm.toLowerCase())
    ), [communities, searchTerm]
  );

  // Use centralized arena data
  const arenaData = useMemo(() => getActiveArenas(), []);

  // Mock leaderboard data
  const leaderboardData = useMemo(() => [
    { rank: 1, name: 'Alex Thunder', points: 2547, avatar: '' },
    { rank: 2, name: 'Jamie Spark', points: 2234, avatar: '' },
    { rank: 3, name: 'Casey Storm', points: 2156, avatar: '' },
  ], []);

  // Debounced navigation function
  const debouncedNavigate = useDebounce((path: string) => {
    navigate(path);
  }, 300);

  // Notification handler
  const handleNotifyMe = useCallback((arenaId: string) => {
    setNotificationRequests(prev => new Set(prev).add(arenaId));
    toast({
      title: 'Notification Set!',
      description: 'We\'ll notify you when this arena becomes available.',
    });
  }, [toast]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          navigate('/');
          return;
        }
        setUser(authUser);

        const { data: userData } = await supabase
          .from('users')
          .select('created_at, onboarding_completed')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          const createdAt = new Date(userData.created_at);
          const now = new Date();
          const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          setIsNewUser(hoursSinceCreation < 24 && !userData.onboarding_completed);

          if (isNewUser) {
            const { value } = await Preferences.get({ key: `onboarding_${authUser.id}` });
            if (value !== 'completed') {
              navigate('/onboarding');
              return;
            }
          }
        }

        const { value: quizAnswers } = await Preferences.get({ key: `quiz_answers_${authUser.id}` });
        setQuizCompleted(!!quizAnswers);
      } catch (error) {
        console.error('Error checking user:', error);
        toast({ title: 'Error', description: 'Failed to load user data', variant: 'destructive' });
      } finally {
        setInitialLoading(false);
      }
    };
    checkUser();
  }, [navigate, toast]);

  // Invalidate queries when user joins groups or completes quiz for fresh data
  const queryClient = useQueryClient();
  useEffect(() => {
    if (user?.id && (hasJoinedGroup || quizCompleted)) {
      queryClient.invalidateQueries({ queryKey: ['communities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['userGroupStatus', user.id] });
    }
  }, [hasJoinedGroup, quizCompleted, user?.id, queryClient]);

  const joinCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections_groups')
        .insert({ user_id: user?.id, group_id: communityId });
      if (error) throw error;
      toast({ title: 'Joined!', description: `You've successfully joined the community!` });

      // Invalidate queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['communities', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['userGroupStatus', user?.id] });
    } catch (error) {
      console.error('Error joining community:', error);
      toast({ title: 'Error', description: 'Failed to join community', variant: 'destructive' });
    }
  };

  const reportPost = async (postId: string) => {
    // Implement report functionality
    toast({ title: 'Reported', description: 'The post has been reported for review.' });
  };

  const handlePostLike = async (postId: string) => {
    // Implement like functionality
    toast({ title: 'Post liked', description: 'You liked this post!' });
  };

  const handlePostComment = async (postId: string, content: string) => {
    // Implement comment functionality
    toast({ title: 'Comment added', description: 'Your comment has been posted.' });
  };

  const handlePostShare = async (postId: string) => {
    // Implement share functionality
    try {
      await navigator.clipboard.writeText(`Check out this post from the community!`);
      toast({ title: 'Link copied', description: 'Post link copied to clipboard' });
    } catch {
      toast({ title: 'Share', description: 'Share feature coming soon!' });
    }
  };

  // Navigate to all groups page
  const handleExploreCommunities = () => {
    navigate('/communities/all');
  };


  if (loading) {
    return <Spinner message="Loading communities..." />;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] mobile-container header-safe pb-20" style={{ '--navbar-height': '60px' } as React.CSSProperties}>
      <div className="flex items-center justify-between p-4 border-b bg-[hsl(var(--background))/0.8] backdrop-blur-sm sticky-header-safe">
        <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Communities</h1>
      </div>

      {!hasJoinedGroup && !loading && (
        <>
          {/* Hero Section for Unjoined Users */}
          <section className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Find Your People</h2>
            <p className="text-[hsl(var(--muted-foreground))]">Join groups that match your interests - chat, share, and meet in person.</p>
            <div className="flex items-center gap-4">
              <Button
                className="step-communities-explore bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 animate-glow px-6 py-3 rounded-full"
                onClick={handleExploreCommunities}
                aria-label="Explore available communities"
              >
                Explore Communities
              </Button>
              <motion.div
                className="hidden md:block w-1/3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <LazyLoadImage
                  src="/images/group-congregation.png" // Placeholder, replace with actual asset
                  alt="Illustration of friends gathering"
                  effect="blur"
                  className="w-full h-auto rounded-lg object-cover"
                />
              </motion.div>
            </div>

            {/* Suggested Starter Communities */}
            <section id="starter-communities" className="space-y-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Suggested Starter Communities</h3>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 pb-4 snap-x snap-mandatory">
                  {personalizedSuggestions.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.01 }} // Subtle hover/tap effect
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="inline-block w-48 snap-center"
                    >
                      <Card className="bg-[hsl(var(--card))] shadow-[hsl(var(--soft-shadow))] hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-4 text-center space-y-3">
                          <div
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/communities/${group.id}`)}
                            aria-label={`Browse ${group.tag_name} community`}
                          >
                            <LazyLoadImage
                              src={`/images/${group.tag_name.toLowerCase()}.png`} // Placeholder, replace with actual assets
                              alt={`${group.tag_name} group illustration`}
                              effect="blur"
                              className="h-20 w-20 mx-auto mb-2 rounded-full object-cover"
                            />
                            <h4
                              className="font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--romance))] transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/communities/${group.id}`);
                              }}
                            >
                              {group.tag_name}
                            </h4>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">
                              {group.tag_subtitle}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1] hover:text-[hsl(var(--romance))]"
                              onClick={() => navigate(`/communities/${group.id}`)}
                              aria-label={`Browse ${group.tag_name} community`}
                            >
                              Browse
                            </Button>
                            <Button
                              className="flex-1 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300"
                              size="sm"
                              onClick={() => joinCommunity(group.id)}
                              aria-label={`Join ${group.tag_name} community`}
                            >
                              Join
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </section>

            {/* AI Quiz Prompt (Static, No Slide-In) */}
            <section className="p-4 bg-[hsl(var(--card))] rounded-lg shadow-[hsl(var(--soft-shadow))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Unlock More with the AI Quiz</h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">Take our quick quiz to get personalized community suggestions!</p>
              <Button
                className="step-quiz-button w-full bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 animate-glow"
                onClick={() => navigate('/quiz?returnTo=/communities')}
                aria-label="Start AI quiz for personalized communities"
              >
                Take Quiz Now
              </Button>
            </section>

            {/* Why Join a Group? Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Why Join a Group?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Heart, text: 'Chat with like-minded people' },
                  { icon: Users, text: 'Discover exciting events' },
                  { icon: Sparkles, text: 'Find dates in your niche' },
                  { icon: Flame, text: 'Boost your profile visibility' },
                ].map((item, index) => (
                  <Card key={index} className="bg-[hsl(var(--card))] shadow-[hsl(var(--soft-shadow))] p-4 text-center">
                    <item.icon className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--romance))]" />
                    <p className="text-[hsl(var(--muted-foreground))]">{item.text}</p>
                  </Card>
                ))}
              </div>
            </section>
          </section>
        </>
      )}

      {hasJoinedGroup && !quizCompleted && (
        <>
          {/* Search Bar for Joined Users */}
          <div className="p-4">
            <div className="relative border border-[hsl(var(--romance))/0.3] rounded-full">
              <Input
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 rounded-full h-10 text-base border-0 focus-visible:ring-0 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"
              />
            </div>
          </div>

          {/* AI Quiz Hero for Joined Users */}
          <section className="p-4">
            <Card className="bg-[hsl(var(--card))] shadow-[hsl(var(--soft-shadow))]">
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Unlock More with the AI Quiz</h2>
                <p className="text-[hsl(var(--muted-foreground))] mt-2">Take our quick quiz to get personalized community suggestions based on your groups!</p>
                <Button
                  className="mt-4 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 animate-glow px-6 py-3 rounded-full"
                  onClick={() => navigate('/quiz?returnTo=/communities')}
                  aria-label="Start AI quiz for personalized communities"
                >
                  Take Quiz Now
                </Button>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {(hasJoinedGroup || quizCompleted) && (
        <>
          {/* Suggestions Section */}
          <section className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Suggestions</h2>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-4 pb-4 snap-x snap-mandatory">
                {personalizedSuggestions.map(group => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="inline-block w-48 snap-center"
                  >
                    <Card className="bg-[hsl(var(--card))] shadow-[hsl(var(--soft-shadow))] hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-4 text-center space-y-3">
                        <div
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/communities/${group.id}`)}
                          aria-label={`Browse ${group.tag_name} community`}
                        >
                          <group.icon className="h-12 w-12 mx-auto mb-2 text-[hsl(var(--romance))]" />
                          <h3
                            className="font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--romance))] transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/communities/${group.id}`);
                            }}
                          >
                            {group.tag_name}
                          </h3>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">
                            {group.tag_subtitle}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1] hover:text-[hsl(var(--romance))]"
                            onClick={() => navigate(`/communities/${group.id}`)}
                            aria-label={`Browse ${group.tag_name} community`}
                          >
                            Browse
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300"
                            size="sm"
                            onClick={() => joinCommunity(group.id)}
                            aria-label={`Join ${group.tag_name} community`}
                          >
                            Join
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </section>

          {/* My Groups Section */}
          <section className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">My Groups</h2>
            <div className="flex flex-wrap gap-2">
              {myGroups.map(group => (
                <div key={group.id} className="relative group">
                  <Chip
                    active={selectedGroup === group.id}
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    {group.tag_name}
                  </Chip>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[hsl(var(--romance))] hover:bg-[hsl(var(--romance-dark))] text-white rounded-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/communities/${group.id}`);
                    }}
                    aria-label={`Go to ${group.tag_name} community`}
                    title={`Visit ${group.tag_name}`}
                  >
                    →
                  </Button>
                </div>
              ))}
              <Chip
                active={selectedGroup === null}
                onClick={() => setSelectedGroup(null)}
              >
                All
              </Chip>
            </div>
            {selectedGroup ? (
              <div className="space-y-4">
                <Marquee
                  pauseOnHover
                  className="[--duration:45s] py-2"
                  repeat={1}
                  reverse={false}
                >
                  {(posts[selectedGroup] || []).map(post => {
                    const selectedCommunity = myGroups.find(group => group.id === selectedGroup);
                    const enhancedPost = {
                      ...post,
                      community_name: selectedCommunity?.tag_name || 'Community',
                      is_trending: false
                    };
                    return (
                      <MarqueePostCard
                        key={post.id}
                        post={enhancedPost}
                        onClick={() => setShowPostModal(enhancedPost)}
                        className="mx-3"
                      />
                    );
                  })}
                </Marquee>

                {posts[selectedGroup]?.length > 3 && (
                  <div className="px-4">
                    <Button
                      variant="outline"
                      className="w-full text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1] hover:text-[hsl(var(--romance))] active:bg-[hsl(var(--romance))/0.2] active:text-[hsl(var(--romance))] focus:text-[hsl(var(--romance))]"
                      onClick={() => navigate(`/communities/${selectedGroup}`)}
                      aria-label="View more posts"
                    >
                      View More Posts in {myGroups.find(group => group.id === selectedGroup)?.tag_name}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-[hsl(var(--muted-foreground))] mb-4">Select a group to view posts.</p>
                <Button
                  variant="outline"
                  className="text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1]"
                  onClick={() => navigate('/communities/all')}
                >
                  Browse All Communities
                </Button>
              </div>
            )}
          </section>

          {/* Recent Posts Feed using TweetCard */}
          {selectedGroup && (
            <section className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Recent Posts</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[hsl(var(--romance))] hover:text-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1]"
                  onClick={() => navigate(`/communities/${selectedGroup}`)}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {(posts[selectedGroup] || []).slice(0, 4).map(post => {
                  const selectedCommunity = myGroups.find(group => group.id === selectedGroup);
                  const enhancedPost = {
                    ...post,
                    community_name: selectedCommunity?.tag_name || 'Community',
                    is_trending: false
                  };
                  return (
                    <TweetCard
                      key={post.id}
                      post={enhancedPost}
                      currentUserId={user?.id || ''}
                      onLike={async (postId) => {
                        // Handle like functionality
                        console.log('Liked post:', postId);
                      }}
                      onComment={(postId) => {
                        // Handle comment functionality
                        setShowPostModal(enhancedPost);
                      }}
                      onShare={(postId) => {
                        // Handle share functionality
                        console.log('Share post:', postId);
                      }}
                      onReport={(postId) => {
                        // Handle report functionality
                        console.log('Report post:', postId);
                      }}
                      className="cursor-pointer"
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Trending Section with Marquee */}
          <section className="space-y-4">
            <div className="px-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Flame className="h-5 w-5 text-[hsl(var(--romance))]" />
                  Trending Now
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[hsl(var(--romance))] hover:text-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1]"
                  onClick={() => navigate('/communities/all')}
                >
                  View All
                </Button>
              </div>
            </div>

            {/* Manual horizontal scrolling row */}
            <div className="overflow-x-auto scrollbar-hide py-4">
              <div className="flex gap-4 px-4 min-w-max">
                {trendingPosts.map((post) => (
                  <MarqueePostCard
                    key={post.id}
                    post={post}
                    onClick={() => setShowPostModal(post)}
                    className="flex-shrink-0"
                    hideDate={true}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Arena Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] px-4">Arena</h2>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-4 px-4 pb-4 snap-x snap-mandatory">
                {arenaData.map((arena) => (
                  <motion.div
                    key={arena.id}
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="snap-center flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px]"
                  >
                    <ArenaCard
                      arena={arena}
                      onJoin={() => debouncedNavigate(`/arena/${arena.id}`)}
                      onNotifyMe={arena.status !== 'active' ? () => handleNotifyMe(arena.id) : undefined}
                      onLeaderboardClick={() => setShowLeaderboardModal(true)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Events Section */}
          <section className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Events</h2>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-4 pb-4 snap-x snap-mandatory">
                {events.map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="inline-block w-48 snap-center"
                  >
                    <Card className="bg-[hsl(var(--card))] shadow-[hsl(var(--soft-shadow))]">
                      <CardContent className="p-4 text-center">
                        {event.icon && <event.icon className="h-12 w-12 mx-auto mb-2 text-[hsl(var(--romance))]" />}
                        <h3 className="font-bold text-[hsl(var(--foreground))]">{event.name}</h3>
                        <Button
                          className="mt-2 w-full bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 animate-glow"
                          onClick={() => setShowEventModal(event)}
                          aria-label={`View ${event.name} event`}
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </section>
        </>
      )}


      {/* Enhanced Post Modal */}
      <EnhancedPostModal
        post={showPostModal}
        open={!!showPostModal}
        onOpenChange={(open) => !open && setShowPostModal(null)}
        currentUserId={user?.id || ''}
        onLike={handlePostLike}
        onComment={handlePostComment}
        onShare={handlePostShare}
        onReport={reportPost}
      />

      {/* Event Modal */}
      <Dialog open={!!showEventModal} onOpenChange={() => setShowEventModal(null)}>
        <DialogContent className="bg-[hsl(var(--card))] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--foreground))]">{showEventModal?.name}</DialogTitle>
            <DialogDescription className="text-[hsl(var(--muted-foreground))]">
              <p><strong>Time:</strong> {showEventModal?.time}</p>
              <p><strong>Location:</strong> {showEventModal?.location}</p>
              <p>{showEventModal?.description}</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 animate-glow"
              onClick={() => joinCommunity(showEventModal?.group_id)}
              aria-label={`Join ${showEventModal?.name} event`}
            >
              Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leaderboard Modal */}
      <Dialog open={showLeaderboardModal} onOpenChange={setShowLeaderboardModal}>
        <DialogContent className="bg-[hsl(var(--card))] max-h-[80vh] overflow-y-auto [&>button]:hidden rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--foreground))] text-center">🏆 Arena Leaderboard</DialogTitle>
            <DialogDescription className="text-[hsl(var(--muted-foreground))] text-center">
              Top performers across all arena challenges
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4">
            {leaderboardData.map((entry, index) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  entry.rank === 1 ?
                    'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-[0_0_20px_rgba(255,193,7,0.3)]' :
                  entry.rank === 2 ?
                    'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800/30 dark:to-slate-700/30' :
                  entry.rank === 3 ?
                    'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30' :
                  'bg-hsl(var(--muted))'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-hsl(var(--romance)) text-hsl(var(--primary-foreground)) font-bold text-lg">
                    {entry.rank}
                  </div>
                  {entry.rank <= 3 && (
                    <div className="text-2xl">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback className="font-semibold">{entry.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-base text-hsl(var(--foreground))">{entry.name}</p>
                  <p className="text-sm text-hsl(var(--muted-foreground))">{entry.points} points</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowLeaderboardModal(false)}
              className="w-full bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] transition-all duration-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Navbar />
    </div>
  );
};

export default Communities;