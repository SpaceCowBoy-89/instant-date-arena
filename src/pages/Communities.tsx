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
import { Heart, MessageCircle, Flame, Sparkles, Users, Zap, Swords, PenTool, Clock, Calendar, MapPin, Info, Bookmark } from 'lucide-react';
import ArenaCard from '@/components/ArenaCard';
import { arenas, getActiveArenas } from '@/data/arenas';
import Spinner from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar';
import { ICON_MAP, COMMUNITY_GROUPS } from '@/data/communityGroups';
import { EnhancedPostModal } from '@/components/EnhancedPostModal';
import Marquee from '@/components/ui/marquee';
import { MarqueePostCard } from '@/components/MarqueePostCard';
import { TweetCard } from '@/components/ui/tweet-card';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
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
  trendingScore?: number;
  hoursAgo?: number;
  engagementRate?: number;
  connections_groups?: {
    id: string;
    tag_name: string;
  };
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
  const trendingPosts = communitiesData?.trendingPosts || [];

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

  // Leaderboard data - empty to show empty state
  const leaderboardData = useMemo(() => [], []);

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

      // Redirect to community detail page after a brief delay to show the success message
      setTimeout(() => {
        navigate(`/communities/${communityId}`);
      }, 1500);
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
    <div className="min-h-screen bg-[hsl(var(--background))] mobile-container" style={{
      '--navbar-height': '60px',
      paddingBottom: '5rem'
    } as React.CSSProperties}>
      <div className="flex items-center justify-between p-4 border-b bg-[hsl(var(--background))/0.95] backdrop-blur-sm sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Communities</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/bookmarks')}
          className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-3 py-2 rounded-xl font-medium active:scale-95"
        >
          <Bookmark className="w-4 h-4 mr-2" />
          <span className="text-sm">Bookmarks</span>
        </Button>
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

      {hasJoinedGroup && (
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

          {!quizCompleted && (
            <>
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
            </>
          )}

          {/* My Groups Section */}
          <section className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">My Groups</h2>
            {myGroups.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {myGroups.map(group => (
                    <div key={group.id} className="relative group">
                      <div className="flex items-center gap-1 p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Filter Button */}
                        <Button
                          variant={selectedGroup === group.id ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setSelectedGroup(group.id)}
                          className={selectedGroup === group.id
                            ? 'bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] text-white shadow-lg'
                            : 'text-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1]'
                          }
                          aria-label={`Filter posts from ${group.tag_name}`}
                          title={`Filter posts from ${group.tag_name}`}
                        >
                          {group.tag_name}
                        </Button>

                        {/* Visit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1] hover:text-[hsl(var(--romance-dark))] transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/communities/${group.id}`);
                          }}
                          aria-label={`Visit ${group.tag_name} community`}
                          title={`Visit ${group.tag_name} community`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M17 7H7M17 7V17"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* All Filter - separate styling since it doesn't have a visit action */}
                  <Chip
                    active={selectedGroup === null}
                    onClick={() => setSelectedGroup(null)}
                  >
                    All
                  </Chip>
                </div>
                {selectedGroup ? (
                  <div className="space-y-4">
                    {(posts[selectedGroup] || []).length > 0 ? (
                      <>
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
                      </>
                    ) : (
                      <Card className="bg-gradient-to-br from-slate-50 to-gray-50/50 dark:from-slate-800/50 dark:to-gray-800/30 border border-slate-200/50 dark:border-slate-700/30">
                        <CardContent className="p-6 text-center">
                          <div className="text-4xl mb-3">💬</div>
                          <h4 className="text-base font-semibold text-[hsl(var(--foreground))] mb-2">
                            No Posts Yet in {myGroups.find(group => group.id === selectedGroup)?.tag_name}
                          </h4>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 max-w-xs mx-auto">
                            This community is waiting for its first posts. Be the conversation starter!
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1]"
                            onClick={() => navigate(`/communities/${selectedGroup}`)}
                          >
                            Visit {myGroups.find(group => group.id === selectedGroup)?.tag_name}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  (() => {
                    // When "All" is selected, aggregate posts from all user's groups
                    const allUserPosts = myGroups.flatMap(group =>
                      (posts[group.id] || []).map(post => ({
                        ...post,
                        community_name: group.tag_name,
                        is_trending: false
                      }))
                    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                    return allUserPosts.length > 0 ? (
                      <div className="space-y-4">
                        <Marquee
                          pauseOnHover
                          className="[--duration:50s] py-2"
                          repeat={1}
                          reverse={false}
                        >
                          {allUserPosts.map(post => (
                            <MarqueePostCard
                              key={post.id}
                              post={post}
                              onClick={() => setShowPostModal(post)}
                              className="mx-3"
                            />
                          ))}
                        </Marquee>
                        {allUserPosts.length > 3 && (
                          <div className="px-4">
                            <Button
                              variant="outline"
                              className="w-full text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1]"
                              onClick={() => navigate('/communities/all')}
                            >
                              Browse All Communities
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
                        <CardContent className="p-6 text-center">
                          <div className="text-4xl mb-3">📝</div>
                          <h4 className="text-base font-semibold text-[hsl(var(--foreground))] mb-2">
                            No Posts in Your Groups Yet
                          </h4>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 max-w-xs mx-auto">
                            None of your communities have posts yet. Be the first to start conversations!
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[hsl(var(--romance))] border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.1]"
                            onClick={() => myGroups.length > 0 ? navigate(`/communities/${myGroups[0].id}`) : navigate('/communities/all')}
                          >
                            {myGroups.length > 0 ? `Visit ${myGroups[0].tag_name}` : 'Browse All Communities'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })()
                )}
              </>
            ) : (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">No Groups Yet</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-sm mx-auto">
                    Join communities that match your interests to see their posts and connect with like-minded people.
                  </p>
                  <div className="space-y-3">
                    <Button
                      className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                      onClick={() => navigate('/communities/all')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Browse Communities
                    </Button>
                    <div className="bg-gradient-to-r from-white to-blue-50 dark:from-blue-800/30 dark:to-purple-800/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        💡 Take the AI Quiz to get personalized community recommendations!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  console.log(`Displaying recent post in group ${selectedGroup}:`, {
                    id: post.id,
                    created_at: post.created_at,
                    message: post.message?.substring(0, 50) + '...'
                  });
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

          {/* Trending Section */}
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

            {trendingPosts.length > 0 ? (
              <div className="px-4">
                <div className="space-y-3">
                  {trendingPosts.slice(0, 5).map((post) => (
                    <Card
                      key={post.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 border border-[hsl(var(--border))] bg-[hsl(var(--card))] relative overflow-hidden"
                      onClick={() => setShowPostModal({ ...post, is_trending: true })}
                    >
                      {/* Trending indicator stripe */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))]" />
                      
                      <CardContent className="p-4 pl-6">
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-10 h-10 border-2 border-[hsl(var(--romance))/0.2]">
                            <AvatarImage src={post.user?.photo_url} alt={post.user?.name} />
                            <AvatarFallback className="bg-[hsl(var(--romance))/0.1] text-[hsl(var(--romance))] font-semibold">
                              {post.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-[hsl(var(--foreground))] text-sm truncate">
                                {post.user?.name || 'Anonymous'}
                              </p>
                              <span className="text-xs px-2 py-1 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] text-white rounded-full flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                Trending
                              </span>
                              {post.hoursAgo !== undefined && (
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {post.hoursAgo < 1 ? 'Just now' : `${post.hoursAgo}h ago`}
                                </span>
                              )}
                            </div>
                            <p className="text-[hsl(var(--muted-foreground))] text-xs mb-2">
                              {post.connections_groups?.tag_name || 'Community'}
                            </p>
                            <p className="text-[hsl(var(--foreground))] text-sm leading-relaxed line-clamp-3">
                              {post.message}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-[hsl(var(--muted-foreground))] text-xs">
                              <button className="flex items-center gap-1 hover:text-[hsl(var(--romance))] transition-colors">
                                <Heart className="h-3 w-3" />
                                <span>{post.likes || 0}</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-[hsl(var(--romance))] transition-colors">
                                <MessageCircle className="h-3 w-3" />
                                <span>{post.comments || 0}</span>
                              </button>
                              {post.trendingScore && (
                                <span className="text-xs bg-[hsl(var(--romance))/0.1] text-[hsl(var(--romance))] px-2 py-1 rounded-full">
                                  Score: {Math.round(post.trendingScore)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {trendingPosts.length > 5 && (
                  <div className="text-center mt-4">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      +{trendingPosts.length - 5} more trending posts
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4">
                <Card className="bg-gradient-to-br from-orange-50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20 border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">🔥</div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Nothing Trending Yet</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-sm mx-auto">
                      Be the first to create buzz! Popular posts from all communities will appear here.
                    </p>
                    <div className="bg-gradient-to-r from-white to-orange-50 dark:from-orange-800/30 dark:to-red-800/30 rounded-xl p-4 border border-orange-200/50 dark:border-orange-700/30">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        💡 Posts with high engagement from all communities show up in trending
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>

          {/* Arena Section */}
          <section className="space-y-4 mt-8">
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
            {events.length > 0 ? (
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
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
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
            ) : (
              <div className="px-4">
                <Card className="bg-gradient-to-br from-gray-50 to-purple-50/50 dark:from-gray-800/50 dark:to-purple-900/20 border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">No Events Scheduled</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-sm mx-auto">
                      Community events will appear here when organizers create them. Stay tuned!
                    </p>
                    <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        💡 Tip: Join community groups to get notified when new events are posted
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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
        <DialogContent
          className="bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/30 border-purple-200/50 dark:border-purple-800/30 rounded-3xl shadow-2xl [&>button]:hidden w-[95vw] max-w-lg mx-auto my-4 sm:my-8 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-0"
          hideCloseButton={true}
        >
          {showEventModal && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Header Section */}
              <div className="text-center pb-3 sm:pb-4 border-b border-purple-200/30 dark:border-purple-800/30">
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎉</div>
                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[hsl(var(--foreground))] mb-2 px-2 leading-tight">
                  {(showEventModal as any).title || (showEventModal as any).name}
                </DialogTitle>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  {/* Date Display */}
                  <div className="flex items-center gap-2 bg-purple-100/50 dark:bg-purple-900/30 px-3 py-1.5 rounded-full">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="font-medium text-purple-800 dark:text-purple-200">
                      {(() => {
                        try {
                          const eventDate = new Date((showEventModal as any).date || (showEventModal as any).event_date);
                          const today = new Date();
                          const tomorrow = new Date(today);
                          tomorrow.setDate(tomorrow.getDate() + 1);

                          // Check if it's today, tomorrow, or another day
                          if (eventDate.toDateString() === today.toDateString()) {
                            return 'Today';
                          } else if (eventDate.toDateString() === tomorrow.toDateString()) {
                            return 'Tomorrow';
                          } else {
                            return eventDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            });
                          }
                        } catch {
                          return (showEventModal as any).event_date || (showEventModal as any).date;
                        }
                      })()}
                    </span>
                  </div>

                  {/* Time Display */}
                  <div className="flex items-center gap-2 bg-pink-100/50 dark:bg-pink-900/30 px-3 py-1.5 rounded-full">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                    <span className="font-medium text-pink-800 dark:text-pink-200">
                      {(() => {
                        try {
                          // Try to parse and format the time if it's a valid time string
                          if (showEventModal.time && showEventModal.time.includes(':')) {
                            const [hours, minutes] = showEventModal.time.split(':');
                            const hour24 = parseInt(hours);
                            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                            const period = hour24 >= 12 ? 'PM' : 'AM';
                            return `${hour12}:${minutes} ${period}`;
                          }
                          return showEventModal.time;
                        } catch {
                          return showEventModal.time;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-3 sm:space-y-4">
                {/* Description */}
                {showEventModal.description && (
                  <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <h4 className="font-semibold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2 text-sm sm:text-base">
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                      About This Event
                    </h4>
                    <p className="text-[hsl(var(--muted-foreground))] leading-relaxed text-sm sm:text-base">
                      {showEventModal.description}
                    </p>
                  </div>
                )}

                {/* Location */}
                {showEventModal.location && (
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl sm:rounded-2xl">
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 shrink-0 mt-0.5">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-1 text-sm sm:text-base">Location</h4>
                      <p className="text-[hsl(var(--muted-foreground))] text-sm sm:text-base break-words">{showEventModal.location}</p>
                    </div>
                  </div>
                )}

                {/* Community */}
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-green-50/50 dark:bg-green-950/20 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900/50 shrink-0 mt-0.5">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-[hsl(var(--foreground))] mb-1 text-sm sm:text-base">Community</h4>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm sm:text-base break-words">
                      {(showEventModal as any).connections_groups?.tag_name || 'Community Event'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2 sm:pt-4">
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold min-h-[48px] sm:min-h-[52px] text-sm sm:text-base active:scale-95"
                  onClick={async () => {
                    try {
                      // Proper event attendance logic (placeholder for now)
                      toast({
                        title: "Event Interest Noted! 🎉",
                        description: "We've noted your interest in this event. You'll be notified with updates!",
                      });
                      setShowEventModal(null);
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to register interest. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  aria-label={`Show interest in ${(showEventModal as any).title || (showEventModal as any).name} event`}
                >
                  <Heart className="h-4 w-4 mr-2 shrink-0" />
                  I'm Interested
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEventModal(null)}
                  className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 hover:text-purple-800 dark:border-purple-700 dark:hover:bg-purple-950/50 dark:text-purple-300 dark:hover:text-purple-200 min-h-[44px] sm:min-h-[48px] text-sm sm:text-base active:scale-95"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
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
            {leaderboardData.length > 0 ? (
              leaderboardData.map((entry, index) => (
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
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold text-hsl(var(--foreground)) mb-2">No Champions Yet</h3>
                <p className="text-sm text-hsl(var(--muted-foreground)) mb-6 max-w-sm mx-auto">
                  Be the first to compete in arenas and claim your spot on the leaderboard!
                </p>
                <div className="bg-gradient-to-r from-gray-50 to-purple-50/50 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl p-4 mx-4">
                  <p className="text-xs text-hsl(var(--muted-foreground))">
                    Participate in Speed Spark, Speed Clash, and other arenas to earn points and climb the rankings.
                  </p>
                </div>
              </div>
            )}
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