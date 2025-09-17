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
    className={active ? 'bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 active:scale-95' : 'text-[hsl(var(--romance))] border-[hsl(var(--romance))] active:scale-95 transition-all duration-150'}
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
          .select('created_at')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          const createdAt = new Date(userData.created_at);
          const now = new Date();
          const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          setIsNewUser(hoursSinceCreation < 24);

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
      <div className="flex items-center justify-between p-4 border-b bg-[hsl(var(--background))/0.8] backdrop-blur-sm sticky-header-safe z-50">
        <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Communities</h1>
      </div>

      {!hasJoinedGroup && !loading && (
        <>
          {/* Hero Banner for Unjoined Users */}
          <section className="relative mx-2 sm:mx-4 my-4 sm:my-6 overflow-hidden rounded-2xl sm:rounded-3xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))] via-[hsl(var(--romance))] to-[hsl(var(--purple-accent))]" />

            {/* Animated background elements - responsive positioning */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 right-4 sm:top-4 sm:right-8 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-xl sm:blur-2xl animate-pulse" />
              <div className="absolute bottom-4 left-6 sm:bottom-8 sm:left-12 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-white/15 rounded-full blur-lg sm:blur-xl animate-pulse delay-75" />
              <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white/10 rounded-full blur-md sm:blur-lg animate-pulse delay-150" />
            </div>

            {/* Content - Enhanced mobile responsiveness */}
            <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8">
                <div className="flex-1 text-center md:text-left">
                  <motion.h2
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    Find Your People
                  </motion.h2>
                  <motion.p
                    className="text-white/90 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 leading-relaxed max-w-sm sm:max-w-md mx-auto md:mx-0 px-2 sm:px-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    Join groups that match your interests - chat, share, and meet in person.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Button
                      className="step-communities-explore bg-white text-[hsl(var(--romance))] hover:bg-white/90 hover:text-[hsl(var(--romance-dark))] font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg w-full sm:w-auto min-h-[48px] active:scale-95"
                      onClick={handleExploreCommunities}
                      aria-label="Explore available communities"
                    >
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Explore Communities
                    </Button>
                  </motion.div>
                </div>

                {/* Responsive illustration - hidden on small screens, visible on medium+ */}
                <motion.div
                  className="hidden md:block flex-shrink-0 w-40 md:w-48 lg:w-64"
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="relative">
                    {/* Floating community icons - responsive sizing */}
                    <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
                      <Heart className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce delay-75">
                      <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <div className="absolute top-1/2 -right-4 md:-right-6 w-7 h-7 md:w-8 md:h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce delay-150">
                      <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>

                    {/* Main illustration container - responsive */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20">
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-white/20 rounded-lg md:rounded-xl p-2 md:p-3 flex items-center justify-center aspect-square">
                          <Users className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                        <div className="bg-white/20 rounded-lg md:rounded-xl p-2 md:p-3 flex items-center justify-center aspect-square">
                          <Heart className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                        <div className="bg-white/20 rounded-lg md:rounded-xl p-2 md:p-3 flex items-center justify-center aspect-square">
                          <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                        <div className="bg-white/20 rounded-lg md:rounded-xl p-2 md:p-3 flex items-center justify-center aspect-square">
                          <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

            {/* Suggested Starter Communities */}
            <section id="starter-communities" className="space-y-4 sm:space-y-6 px-3 sm:px-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(var(--romance))]" />
                  Suggested Starter Communities
                </h3>
              </div>
              <div className="overflow-x-auto scrollbar-hide touch-pan-x -mx-3 sm:-mx-4">
                <div className="flex space-x-3 sm:space-x-4 pb-4 snap-x snap-mandatory px-3 sm:px-4 w-max">
                  {personalizedSuggestions.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-block w-64 sm:w-72 md:w-80 lg:w-80 flex-shrink-0 snap-center"
                    >
                      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 h-full border-0 relative overflow-hidden">
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))/0.05] to-[hsl(var(--purple-accent))/0.05] pointer-events-none" />

                        <CardContent className="p-4 sm:p-5 text-center h-full flex flex-col relative min-h-[280px] sm:min-h-[320px]">
                          <div
                            className="cursor-pointer hover:opacity-80 transition-all duration-200 flex-1 flex flex-col justify-center active:scale-[0.98]"
                            onClick={() => navigate(`/communities/${group.id}`)}
                            aria-label={`Browse ${group.tag_name} community`}
                          >
                            {/* Icon/Image container with enhanced styling */}
                            <div className="relative mx-auto mb-4 sm:mb-6 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                              {/* Outer glow ring */}
                              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] rounded-full opacity-30 blur-lg scale-110" />
                              {/* Inner shadow ring */}
                              <div className="absolute inset-1 bg-gradient-to-br from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] rounded-full opacity-10" />
                              {/* Main avatar container */}
                              <div className="relative w-full h-full bg-gradient-to-br from-[hsl(var(--romance))] via-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20">
                                {/* Inner content with subtle background */}
                                <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full flex items-center justify-center">
                                  {group.icon ? (
                                    <group.icon className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white drop-shadow-lg" />
                                  ) : (
                                    <Users className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white drop-shadow-lg" />
                                  )}
                                </div>
                              </div>
                              {/* Floating particles effect */}
                              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-80 animate-pulse" />
                              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-60 animate-pulse delay-75" />
                            </div>

                            <h4
                              className="font-bold text-sm sm:text-base md:text-lg text-[hsl(var(--foreground))] hover:text-[hsl(var(--romance))] transition-all duration-200 cursor-pointer mb-2 line-clamp-2 px-1 sm:px-2 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/communities/${group.id}`);
                              }}
                              title={group.tag_name}
                            >
                              {group.tag_name}
                            </h4>
                            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-3 line-clamp-3 leading-relaxed px-1 sm:px-2 flex-1 min-h-[45px] sm:min-h-[60px] flex items-center">
                              {group.tag_subtitle}
                            </p>

                            {/* Member count badge */}
                            {group.member_count && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[hsl(var(--romance))/0.1] rounded-full text-xs font-medium text-[hsl(var(--romance))] mb-3 mx-auto">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{group.member_count?.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-auto pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1] hover:text-[hsl(var(--romance))] min-h-[32px] sm:min-h-[36px] rounded-lg transition-all duration-200 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/communities/${group.id}`);
                              }}
                              aria-label={`Browse ${group.tag_name} community`}
                            >
                              Browse
                            </Button>
                            <Button
                              className="flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-white shadow-lg hover:shadow-xl transition-all duration-300 min-h-[32px] sm:min-h-[36px] rounded-lg font-medium active:scale-95"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                joinCommunity(group.id);
                              }}
                              aria-label={`Join ${group.tag_name} community`}
                            >
                              Join Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* AI Quiz Prompt (Static, No Slide-In) */}
            <section className="px-3 sm:px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
              >
                {/* Enhanced background with gradient and glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))] via-[hsl(var(--romance))] to-[hsl(var(--purple-accent))]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 right-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
                  <div className="absolute bottom-6 left-8 w-12 h-12 sm:w-16 sm:h-16 bg-white/15 rounded-full blur-lg animate-pulse delay-75" />
                  <div className="absolute top-1/2 left-1/3 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full blur-md animate-pulse delay-150" />
                </div>

                <div className="relative p-4 sm:p-6 md:p-8 text-center">
                  {/* Enhanced icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl"
                  >
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-pulse" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight"
                  >
                    🚀 Unlock More with the AI Quiz
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-white/90 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed max-w-md mx-auto px-2 sm:px-0"
                  >
                    Take our quick AI-powered quiz to get personalized community suggestions that match your interests perfectly!
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Button
                      className="step-quiz-button bg-white text-[hsl(var(--romance))] hover:bg-white/90 hover:text-[hsl(var(--romance-dark))] font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg w-full sm:w-auto min-h-[48px] sm:min-h-[56px] active:scale-95 group"
                      onClick={() => navigate('/quiz?returnTo=/communities')}
                      aria-label="Start AI quiz for personalized communities"
                    >
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
                        <span>Take Quiz Now</span>
                        <span className="text-sm sm:text-base">✨</span>
                      </div>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </section>

            {/* Why Join a Group? Section */}
            <section className="space-y-4 px-4 mt-6 sm:mt-8">
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
          <section className="px-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
            >
              {/* Enhanced background with gradient and glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))] via-[hsl(var(--romance))] to-[hsl(var(--purple-accent))]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 right-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
                <div className="absolute bottom-6 left-8 w-12 h-12 sm:w-16 sm:h-16 bg-white/15 rounded-full blur-lg animate-pulse delay-75" />
                <div className="absolute top-1/2 left-1/3 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full blur-md animate-pulse delay-150" />
              </div>

              <div className="relative p-4 sm:p-6 md:p-8 text-center">
                {/* Enhanced icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl"
                >
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-pulse" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight"
                >
                  🎯 Unlock More with the AI Quiz
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-white/90 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed max-w-md mx-auto px-2 sm:px-0"
                >
                  Take our quick AI-powered quiz to get even more personalized community suggestions based on your current groups!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Button
                    className="bg-white text-[hsl(var(--romance))] hover:bg-white/90 hover:text-[hsl(var(--romance-dark))] font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg w-full sm:w-auto min-h-[48px] sm:min-h-[56px] active:scale-95 group"
                    onClick={() => navigate('/quiz?returnTo=/communities')}
                    aria-label="Start AI quiz for personalized communities"
                  >
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
                      <span>Take Quiz Now</span>
                      <span className="text-sm sm:text-base">🎉</span>
                    </div>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </section>
        </>
      )}

      {(hasJoinedGroup || quizCompleted) && (
        <>
          {/* Suggestions Section */}
          <section className="space-y-4 sm:space-y-6 px-3 sm:px-4 mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[hsl(var(--foreground))]">Suggestions</h2>
            <div className="overflow-x-auto scrollbar-hide touch-pan-x -mx-3 sm:-mx-4">
              <div className="flex space-x-3 sm:space-x-4 pb-4 snap-x snap-mandatory px-3 sm:px-4 w-max">
                {personalizedSuggestions.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block w-64 sm:w-72 md:w-80 lg:w-80 flex-shrink-0 snap-center"
                  >
                    <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 h-full border-0 relative overflow-hidden">
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))/0.05] to-[hsl(var(--purple-accent))/0.05] pointer-events-none" />

                      <CardContent className="p-4 sm:p-5 text-center h-full flex flex-col relative min-h-[280px] sm:min-h-[320px]">
                        <div
                          className="cursor-pointer hover:opacity-80 transition-all duration-200 flex-1 flex flex-col justify-center active:scale-[0.98]"
                          onClick={() => navigate(`/communities/${group.id}`)}
                          aria-label={`Browse ${group.tag_name} community`}
                        >
                          {/* Icon/Image container with enhanced styling */}
                          <div className="relative mx-auto mb-4 sm:mb-6 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                            {/* Outer glow ring */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] rounded-full opacity-30 blur-lg scale-110" />
                            {/* Inner shadow ring */}
                            <div className="absolute inset-1 bg-gradient-to-br from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] rounded-full opacity-10" />
                            {/* Main avatar container */}
                            <div className="relative w-full h-full bg-gradient-to-br from-[hsl(var(--romance))] via-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20">
                              {/* Inner content with subtle background */}
                              <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full flex items-center justify-center">
                                {group.icon ? (
                                  <group.icon className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white drop-shadow-lg" />
                                ) : (
                                  <Users className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white drop-shadow-lg" />
                                )}
                              </div>
                            </div>
                            {/* Floating particles effect */}
                            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-80 animate-pulse" />
                            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-60 animate-pulse delay-75" />
                          </div>

                          <h4
                            className="font-bold text-sm sm:text-base md:text-lg text-[hsl(var(--foreground))] hover:text-[hsl(var(--romance))] transition-all duration-200 cursor-pointer mb-2 line-clamp-2 px-1 sm:px-2 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/communities/${group.id}`);
                            }}
                            title={group.tag_name}
                          >
                            {group.tag_name}
                          </h4>
                          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-3 line-clamp-3 leading-relaxed px-1 sm:px-2 flex-1 min-h-[45px] sm:min-h-[60px] flex items-center">
                            {group.tag_subtitle}
                          </p>

                          {/* Member count badge */}
                          {group.member_count && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-[hsl(var(--romance))/0.1] rounded-full text-xs font-medium text-[hsl(var(--romance))] mb-3 mx-auto">
                              <Users className="h-3 w-3" />
                              <span className="truncate">{group.member_count?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1] hover:text-[hsl(var(--romance))] min-h-[32px] sm:min-h-[36px] rounded-lg transition-all duration-200 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/communities/${group.id}`);
                            }}
                            aria-label={`Browse ${group.tag_name} community`}
                          >
                            Browse
                          </Button>
                          <Button
                            className="flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-white shadow-lg hover:shadow-xl transition-all duration-300 min-h-[32px] sm:min-h-[36px] rounded-lg font-medium active:scale-95"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              joinCommunity(group.id);
                            }}
                            aria-label={`Join ${group.tag_name} community`}
                          >
                            Join Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
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
                    className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[hsl(var(--romance))] hover:bg-[hsl(var(--romance-dark))] text-white rounded-full text-xs active:scale-90"
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
            <div className="overflow-x-auto scrollbar-hide touch-pan-x py-4 -mx-4">
              <div className="flex gap-3 sm:gap-4 px-4 min-w-max snap-x snap-mandatory">
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
            <div className="overflow-x-auto scrollbar-hide touch-pan-x -mx-4">
              <div className="flex space-x-3 sm:space-x-4 px-4 pb-4 snap-x snap-mandatory">
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
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] px-4">Events</h2>
            <div className="overflow-x-auto scrollbar-hide touch-pan-x -mx-4">
              <div className="flex space-x-3 sm:space-x-4 px-4 pb-4 snap-x snap-mandatory">
                {events.map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="inline-block w-48 sm:w-52 flex-shrink-0 snap-center"
                  >
                    <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 h-full border-0 relative overflow-hidden">
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))/0.05] to-[hsl(var(--purple-accent))/0.05] pointer-events-none" />

                      <CardContent className="p-4 text-center relative h-full flex flex-col min-h-[180px]">
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg">📅</span>
                          </div>
                          <h3 className="font-bold text-[hsl(var(--foreground))] mb-2 line-clamp-2 text-sm sm:text-base leading-tight">{event.title}</h3>
                          {event.date && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-white shadow-lg hover:shadow-xl transition-all duration-300 text-sm rounded-lg active:scale-95"
                          onClick={() => setShowEventModal(event as any)}
                          aria-label={`View ${event.title} event`}
                        >
                          View Event
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
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
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback className="font-semibold text-sm sm:text-base">{entry.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-hsl(var(--foreground)) truncate">{entry.name}</p>
                  <p className="text-xs sm:text-sm text-hsl(var(--muted-foreground))">{entry.points} points</p>
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