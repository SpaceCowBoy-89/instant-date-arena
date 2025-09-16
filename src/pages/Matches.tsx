import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Heart, ArrowLeft, MessageCircle, Users, Star, Sparkles, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useSwipeable } from 'react-swipeable';
import FocusLock from 'react-focus-lock';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import ScrollToTop from '@/components/ScrollToTop';
import { toast } from 'sonner';
import { Preferences } from '@capacitor/preferences';

interface CompatibilityMatch {
  id: string;
  name: string;
  age: number;
  bio: string;
  photo_url: string;
  compatibility_score: number;
  compatibility_label: number;
  extroversion_diff: number;
  agreeableness_diff: number;
  age_diff: number;
  shared_interests?: string[];
}

interface UserProgress {
  messages_sent: number;
  feedback_count: number;
  badges: string[];
  boosts_earned: number;
}

export default function Matches({ setShowChatbot }: { setShowChatbot: (show: boolean) => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [matches, setMatches] = useState<CompatibilityMatch[]>([]);
  const [passedMatches, setPassedMatches] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<CompatibilityMatch | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSwipeActionModal, setShowSwipeActionModal] = useState<CompatibilityMatch | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<CompatibilityMatch | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [progress, setProgress] = useState<UserProgress>({ messages_sent: 0, feedback_count: 0, badges: [], boosts_earned: 0 });
  const [sortBy, setSortBy] = useState<string>('score');
  const [filterInterest, setFilterInterest] = useState<string>('all');
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [showDailyToast, setShowDailyToast] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const topMatchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchTopMatch = async () => {
    const { data, error } = await supabase.functions.invoke('compatibility-matchmaker', {
      body: { user_id: user?.id, limit: 1 }
    });
    if (error) throw error;
    const matchesWithInterests = await Promise.all(
      (data.matches || []).map(async (match) => {
        const { data: matchProfile } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', match.id)
          .single();
        const userPreferences = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user?.id)
          .single();
        const sharedInterests: string[] = []; // Simplified since interests column doesn't exist
        return { ...match, shared_interests: sharedInterests };
      })
    );
    return matchesWithInterests[0] || null;
  };

  const fetchMatches = async ({ pageParam = 1 }) => {
    const { data, error } = await supabase.functions.invoke('compatibility-matchmaker', {
      body: { user_id: user?.id, page: pageParam, limit: 5 }
    });
    if (error) throw error;
    const matchesWithInterests = await Promise.all(
      (data.matches || []).map(async (match) => {
        const { data: matchProfile } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', match.id)
          .single();
        const userPreferences = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user?.id)
          .single();
        const sharedInterests: string[] = []; // Simplified since interests column doesn't exist
        return { ...match, shared_interests: sharedInterests };
      })
    );
    return { matches: matchesWithInterests, hasMore: matchesWithInterests.length === 5 };
  };

  // Mock data for testing UI - 3 diverse matches
  const mockMatches = [
    {
      id: 'mock-1',
      name: 'Emma',
      age: 26,
      bio: 'Adventure seeker who loves hiking, coffee, and deep conversations. Looking for someone to explore the world with!',
      photo_url: 'https://images.unsplash.com/photo-1494790108755-2616c68e9c13?w=400&h=400&fit=crop&crop=face',
      compatibility_score: 0.92,
      compatibility_label: 5,
      extroversion_diff: 0.1,
      agreeableness_diff: 0.05,
      age_diff: 2,
      shared_interests: ['Hiking', 'Coffee', 'Travel', 'Photography', 'Reading']
    },
    {
      id: 'mock-2',
      name: 'Sofia',
      age: 24,
      bio: 'Creative designer and yoga enthusiast. Love creating beautiful things and finding balance in life.',
      photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      compatibility_score: 0.88,
      compatibility_label: 4,
      extroversion_diff: 0.15,
      agreeableness_diff: 0.08,
      age_diff: 1,
      shared_interests: ['Yoga', 'Design', 'Art', 'Meditation', 'Coffee']
    },
    {
      id: 'mock-3',
      name: 'Maya',
      age: 27,
      bio: 'Food lover and travel blogger. Always planning the next adventure or trying a new recipe!',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      compatibility_score: 0.84,
      compatibility_label: 4,
      extroversion_diff: 0.2,
      agreeableness_diff: 0.12,
      age_diff: 2,
      shared_interests: ['Travel', 'Cooking', 'Writing', 'Photography', 'Wine']
    }
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['matches', user?.id, page],
    queryFn: ({ pageParam = 1 }: { pageParam?: unknown }) => fetchMatches({ pageParam: pageParam as number }),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id && isOnline,
  });

  const mockTopMatch = {
    id: 'mock-top',
    name: 'Luna',
    age: 25,
    bio: 'Creative soul with a passion for photography, sustainable living, and spontaneous adventures. Always up for trying new restaurants or planning the next weekend getaway!',
    photo_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
    compatibility_score: 0.95,
    compatibility_label: 5,
    extroversion_diff: 0.05,
    agreeableness_diff: 0.02,
    age_diff: 0,
    shared_interests: ['Photography', 'Travel', 'Sustainability', 'Food', 'Adventure']
  };

  const { data: topMatch } = useQuery({
    queryKey: ['topMatch', user?.id],
    queryFn: fetchTopMatch,
    staleTime: 24 * 60 * 60 * 1000, // 1 day
    enabled: !!user?.id && isOnline,
  });

  useEffect(() => {
    const checkUserAndLoadProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }
        setUser(user);
        const { data: profile } = await supabase.from('users').select('name, interests').eq('id', user.id).single();
        setUserName(profile?.name || 'Friend');
        setUserInterests((profile?.interests as string[]) || []);

        const { data: scores } = await supabase
          .from('user_compatibility_scores')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!scores) {
          toast.error('Please complete the compatibility test first');
          navigate('/date');
          return;
        }

        await loadProgress(user.id);

        const { value } = await Preferences.get({ key: `daily_toast_${user.id}` });
        if (!value) {
          setShowDailyToast(true);
          await Preferences.set({ key: `daily_toast_${user.id}`, value: new Date().toDateString() });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    checkUserAndLoadProgress();
  }, [navigate]);

  useEffect(() => {
    const queryData = data as { matches: any[]; hasMore: boolean } | undefined;
    if (queryData?.matches && queryData.matches.length > 0) {
      setMatches(prev => [...prev, ...queryData.matches]);
      setHasMore(queryData.hasMore);
    } else if (!isLoading && user?.id && (!isOnline || !queryData || !queryData.matches || queryData.matches.length === 0)) {
      // Use mock data when offline, no data, or empty data
      setMatches(mockMatches);
      setHasMore(false);
    }
  }, [data, isLoading, user?.id, isOnline]);

  useEffect(() => {
    if (showDailyToast) {
      toast.success('New matches added! Check out your top picks today! ✨', {
        duration: 5000,
        position: 'top-center',
      });
      setShowDailyToast(false);
    }
  }, [showDailyToast]);

  useEffect(() => {
    // Filter interests to only show user's interests that are shared with matches
    const matchSharedInterests = Array.from(new Set(matches.flatMap(match => match.shared_interests || [])));
    const filteredInterests = userInterests.filter(interest => matchSharedInterests.includes(interest));
    setAvailableInterests(filteredInterests);
  }, [matches, userInterests]);

  useEffect(() => {
    if (topMatch && topMatchRef.current) {
      topMatchRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [topMatch]);

  useEffect(() => {
    const showHint = async () => {
      const { value } = await Preferences.get({ key: `swipe_hint_${user?.id}` });
      if (!value) {
        setShowSwipeHint(true);
        await Preferences.set({ key: `swipe_hint_${user?.id}`, value: 'true' });
      }
    };
    showHint();
  }, [user?.id]);

  const loadProgress = async (userId: string) => {
    const { value } = await Preferences.get({ key: `user_progress_${userId}` });
    if (value) {
      setProgress(JSON.parse(value));
    }
  };

  const updateProgress = async (newProgress: UserProgress) => {
    await Preferences.set({ key: `user_progress_${user?.id}`, value: JSON.stringify(newProgress) });
    setProgress(newProgress);
  };

  const filteredAndSortedMatches = useMemo(() => {
    let filtered = matches.filter(match => !passedMatches.includes(match.id));
    if (filterInterest !== 'all') {
      filtered = filtered.filter(match => match.shared_interests?.includes(filterInterest));
    }
    if (sortBy === 'score') {
      return filtered.sort((a, b) => b.compatibility_score - a.compatibility_score);
    } else if (sortBy === 'age') {
      return filtered.sort((a, b) => a.age_diff - b.age_diff);
    } else if (sortBy === 'personality') {
      return filtered.sort((a, b) => (a.extroversion_diff + a.agreeableness_diff) - (b.extroversion_diff + b.agreeableness_diff));
    }
    return filtered;
  }, [matches, passedMatches, filterInterest, sortBy]);

  const getCompatibilityVariant = (score: number) => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  };

  const getCompatibilityText = (match: CompatibilityMatch) => {
    if (match.compatibility_score >= 0.8) return 'Great Match';
    if (match.compatibility_score >= 0.6) return 'Good Match';
    return 'Potential Match';
  };

  const getExtroversionMessage = (diff: number): string => {
    if (diff <= 0.5) return "You both love putting yourselves out there — total social spark match ✨.";
    if (diff <= 1.0) return "Your social energy blends well — easy to vibe together.";
    if (diff <= 1.5) return "One of you may be the life of the party while the other enjoys quieter moments — a nice balance.";
    return "You bring different social flavors — could be exciting, or take some adjusting.";
  };

  const getAgreeablenessMessage = (diff: number): string => {
    if (diff <= 0.5) return "You both value kindness and harmony — sweet match energy 💕.";
    if (diff <= 1.0) return "You approach relationships with a similar level of understanding — easy flow.";
    if (diff <= 1.5) return "You may show care in different ways, which can actually make things more interesting.";
    return "You have unique ways of handling harmony — it could spark growth if you're open to it.";
  };

  const getAgeMessage = (ageDiff: number): string => {
    if (ageDiff === 0) return "Same age — perfect life stage alignment!";
    if (ageDiff === 1) return `Just ${ageDiff} year apart — great compatibility!`;
    return `${ageDiff} years apart — compatible age range!`;
  };

  const getCompatibilityBreakdown = (match: CompatibilityMatch) => {
    return [
      {
        icon: Users,
        label: 'Shared Interests',
        description: match.shared_interests?.length ? match.shared_interests.join(', ') : 'Different interests can make for great conversations!',
      },
      {
        icon: Heart,
        label: 'Social Energy Match',
        description: getExtroversionMessage(match.extroversion_diff || 0),
      },
      {
        icon: Heart,
        label: 'Harmony Style',
        description: getAgreeablenessMessage(match.agreeableness_diff || 0),
      },
      {
        icon: Star,
        label: 'Age Compatibility',
        description: getAgeMessage(Math.abs(match.age_diff) || 0),
      },
    ];
  };

  const sendMessage = async (matchId: string) => {
    // Handle mock users
    if (matchId.startsWith('mock-')) {
      toast.success('Demo conversation started! In the full app, this would open a real chat.');
      setSelectedMatch(null); // Close the modal
      // Navigate to messages page to show the demo
      navigate('/messages');
      return;
    }

    if (!isOnline) {
      toast.error('You need to be online to send messages.');
      return;
    }
    try {
      const { data: existingChatData } = await supabase
        .from('chats')
        .select('chat_id')
        .or(`and(user1_id.eq.${user?.id},user2_id.eq.${matchId}),and(user1_id.eq.${matchId},user2_id.eq.${user?.id})`)
        .maybeSingle();

      let chatId = existingChatData?.chat_id;

      if (!chatId) {
        const { data: newChat } = await supabase
          .from('chats')
          .insert({
            user1_id: user?.id,
            user2_id: matchId,
          })
          .select('chat_id')
          .single();
        chatId = newChat?.chat_id;
      }

      const newProgress = { ...progress, messages_sent: progress.messages_sent + 1 };
      if (newProgress.messages_sent >= 5 && !newProgress.badges.includes('Matchmaker Pro')) {
        newProgress.badges.push('Matchmaker Pro');
        newProgress.boosts_earned += 1;
        setShowProgressModal(true);
      }
      await updateProgress(newProgress);

      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  const handleIcebreaker = async (match: CompatibilityMatch) => {
    if (!isOnline) {
      toast.error('You need to be online to get icebreakers.');
      return;
    }
    try {
      const { data } = await supabase.functions.invoke('generate-icebreaker', {
        body: { user_id: user?.id, match_id: match.id }
      });
      toast.success(`Icebreaker: ${data.icebreaker}`);
    } catch (error) {
      console.error('Error generating icebreaker:', error);
      toast.error('Failed to generate icebreaker. Please try again.');
    }
  };

  const handleSwipe = useCallback((direction: 'left' | 'right', match: CompatibilityMatch) => {
    if (direction === 'left') {
      setPassedMatches(prev => [...prev, match.id]);
      setShowSwipeActionModal(match);
    } else {
      sendMessage(match.id);
    }
  }, [sendMessage]);

  const handlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left', filteredAndSortedMatches[0]),
    onSwipedRight: () => handleSwipe('right', filteredAndSortedMatches[0]),
    trackMouse: true,
  });

  const submitFeedback = async () => {
    if (!showFeedbackModal) return;
    try {
      await supabase.functions.invoke('submit-match-feedback', {
        body: {
          user_id: user?.id,
          match_id: showFeedbackModal.id,
          rating: feedbackRating,
          comment: feedbackComment,
        }
      });
      const newProgress = { ...progress, feedback_count: progress.feedback_count + 1 };
      if (newProgress.feedback_count >= 3 && !newProgress.badges.includes('Feedback Guru')) {
        newProgress.badges.push('Feedback Guru');
        newProgress.boosts_earned += 1;
        setShowProgressModal(true);
      }
      await updateProgress(newProgress);
      toast.success('Thanks for your feedback! It helps us improve your matches.');
      setShowFeedbackModal(null);
      setFeedbackRating(0);
      setFeedbackComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[hsl(var(--background))]">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 text-[hsl(var(--romance))] mx-auto animate-spin" />
          <p className="text-[hsl(var(--muted-foreground))]">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] pb-safe">
      {!isOnline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm text-center border-b">
          You're offline. Some features are limited.
        </div>
      )}
      <Navbar />
      <ScrollToTop />
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl pb-20">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4 text-[hsl(var(--muted-foreground))]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-[hsl(var(--foreground))]">Your Matches, {userName}!</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[hsl(var(--card))] border-[hsl(var(--border))]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Compatibility Score</SelectItem>
              <SelectItem value="age">Age Difference</SelectItem>
              <SelectItem value="personality">Personality Fit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterInterest} onValueChange={setFilterInterest}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[hsl(var(--card))] border-[hsl(var(--border))]">
              <SelectValue placeholder="Filter by interest" />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))] z-50">
              <SelectItem value="all">All Interests</SelectItem>
              {userInterests.map(interest => (
                <SelectItem key={interest} value={interest}>{interest}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

{(() => {
          const displayMatch = topMatch || mockTopMatch;
          const shouldShowTopMatch = topMatch || (!isOnline && user?.id) || (!topMatch && !isLoading && user?.id);

          if (!shouldShowTopMatch) return null;

          return (
            <div ref={topMatchRef} className="mb-12 relative z-10">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 text-[hsl(var(--foreground))]">Your Top Match Today! ✨</h2>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative w-full max-w-md mx-auto">
                  {/* Gradient Border Container */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400 rounded-2xl md:rounded-3xl blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-white via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-2 border-pink-300 dark:border-pink-400">
                  {/* Section 1: Image with Badges */}
                  <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
                    <img
                      src={displayMatch.photo_url}
                      alt={displayMatch.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full shadow-lg">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                          <span className="font-bold text-xs sm:text-sm">TOP MATCH</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full shadow-lg">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                          <span className="font-bold text-sm sm:text-lg">{Math.round(displayMatch.compatibility_score * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Profile Information */}
                  <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 leading-tight">
                        {displayMatch.name}, {displayMatch.age}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 line-clamp-2">
                        {displayMatch.bio}
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {displayMatch.shared_interests?.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                            {interest}
                          </span>
                        ))}
                        {displayMatch.shared_interests && displayMatch.shared_interests.length > 3 && (
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                            +{displayMatch.shared_interests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compatibility Score - Compact */}
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 mb-0">
                      <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Perfect Match Score
                        </p>
                        <div className="flex items-center justify-center gap-3 sm:gap-4">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-3 max-w-32 sm:max-w-40">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 sm:h-3 rounded-full transition-all duration-500"
                              style={{ width: displayMatch.compatibility_score * 100 + '%' }}
                            />
                          </div>
                          <span className="text-sm sm:text-lg font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {displayMatch.compatibility_score >= 0.9 ? 'Perfect Match' :
                             displayMatch.compatibility_score >= 0.8 ? 'Great Match' :
                             displayMatch.compatibility_score >= 0.7 ? 'Good Match' : 'Potential Match'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Action Buttons */}
                  <div className="p-4 sm:p-6 pt-0 bg-white dark:bg-gray-900">
                    <div className="flex gap-3 sm:gap-4">
                      <Button
                        onClick={() => setSelectedMatch(displayMatch)}
                        variant="outline"
                        className="flex-1 border-2 border-blue-200 hover:border-blue-300 text-blue-600 hover:bg-blue-50 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base min-h-[44px] font-medium"
                        aria-label="View compatibility details"
                      >
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Why We Match</span>
                        <span className="sm:hidden">Match</span>
                      </Button>
                      <Button
                        onClick={() => sendMessage(displayMatch.id)}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg text-sm sm:text-base min-h-[44px] font-medium"
                        aria-label="Start conversation"
                        disabled={!isOnline && !displayMatch.id.startsWith('mock-')}
                      >
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Message Now</span>
                        <span className="sm:hidden">Message</span>
                      </Button>
                    </div>
                   </div>
                   </div>
                 </div>
               </motion.div>
             </div>
           );
         })()}

        {filteredAndSortedMatches.length > 0 ? (
          <div className="mt-8 pt-4">
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-[hsl(var(--foreground))] text-center">More Great Matches</h2>
            <div className="relative h-[75vh] sm:h-[600px] flex items-center justify-center mx-auto max-w-sm px-4">
            {filteredAndSortedMatches.slice(0, 3).reverse().map((match, index) => {
              const isTop = index === 0;
              return (
                <motion.div
                  key={match.id}
                   className="absolute w-full"
                  style={{ zIndex: 10 + (3 - index) }}
                  initial={{ scale: 0.95 - index * 0.05, y: index * 10 }}
                  animate={{ scale: 1 - index * 0.05, y: index * 10 }}
                  drag={isTop}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(event, info) => {
                    if (isTop) {
                      const swipeThreshold = 100;
                      if (info.offset.x > swipeThreshold) {
                        handleSwipe('right', match);
                      } else if (info.offset.x < -swipeThreshold) {
                        handleSwipe('left', match);
                      }
                    }
                  }}
                  whileDrag={isTop ? { scale: 1.05 } : {}}
                >
                  <div className="w-full bg-gradient-to-br from-white via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-700">
                    {/* Hero Image Section */}
                    <div className="relative h-64 sm:h-80 overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center bg-gray-100"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.7) 100%), url('${match.photo_url}')`
                        }}
                      />

                      {/* Compatibility Badge */}
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                            <span className="font-bold text-sm sm:text-lg">{Math.round(match.compatibility_score * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Name & Age Overlay */}
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                        <h3 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2">
                          {match.name}, {match.age}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {match.shared_interests?.slice(0, 2).map((interest, idx) => (
                            <span key={idx} className="bg-white/20 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                              {interest}
                            </span>
                          ))}
                          {match.shared_interests && match.shared_interests.length > 2 && (
                            <span className="bg-white/20 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                              +{match.shared_interests.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-6">
                      <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 line-clamp-3">
                        {match.bio}
                      </p>

                      {/* Compatibility Details */}
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Compatibility Match
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${match.compatibility_score * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {match.compatibility_score >= 0.9 ? 'Perfect Match' :
                               match.compatibility_score >= 0.8 ? 'Great Match' :
                               match.compatibility_score >= 0.7 ? 'Good Match' : 'Potential Match'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Only show for top card */}
                      {isTop && (
                        <div className="space-y-4">
                          <div className="flex gap-3 sm:gap-4">
                            <button
                              onClick={() => handleSwipe('left', match)}
                              className="flex-1 bg-gray-100 hover:bg-red-50 text-red-500 border-2 border-red-200 hover:border-red-300 rounded-xl sm:rounded-2xl py-3 sm:py-4 transition-all duration-300 hover:scale-105 active:scale-95"
                              aria-label={`Pass ${match.name}`}
                            >
                              <X className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" strokeWidth={2.5} />
                            </button>

                            <button
                              onClick={() => setSelectedMatch(match)}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl sm:rounded-2xl py-3 sm:py-4 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                              aria-label={`View ${match.name}'s details`}
                            >
                              <Info className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" />
                            </button>

                            <button
                              onClick={() => handleSwipe('right', match)}
                              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl py-3 sm:py-4 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                              aria-label={`Like ${match.name}`}
                              disabled={!isOnline}
                            >
                              <Heart className="h-6 w-6 sm:h-8 sm:w-8 mx-auto fill-current" />
                            </button>
                          </div>

                          <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-4">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                Swipe left to pass
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                                Swipe right to like
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
             })}
           </div>
          </div>
        ) : (
          <div className="text-center text-[hsl(var(--muted-foreground))] mt-8">
            No more matches for now. Check back later or adjust your filters!
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-6">
            <Button
              onClick={() => {
                setLoadingMore(true);
                setPage(prev => prev + 1);
              }}
              className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 min-h-[44px] focus:ring-[hsl(var(--romance))]"
              disabled={loadingMore || !isOnline}
              aria-label="Load more matches"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Compatibility Modal */}
      <FocusLock>
        <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
          <DialogContent
            className="bg-[hsl(var(--card))] max-w-sm sm:max-w-md lg:max-w-lg bg-gradient-to-br from-[hsl(var(--romance)/0.1)] to-[hsl(var(--purple-accent)/0.1)] rounded-[2rem]"
            hideCloseButton={true}
          >
            {selectedMatch && (
              <div>
                  <DialogHeader>
                    <DialogTitle className="text-[hsl(var(--foreground))] flex items-center gap-2" id="compatibility-modal-title">
                      {selectedMatch.name}’s Compatibility
                      <Badge
                        variant={getCompatibilityVariant(selectedMatch.compatibility_score)}
                        className="ml-2 px-3 py-1"
                      >
                        {getCompatibilityText(selectedMatch)}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-[hsl(var(--muted-foreground))]" aria-describedby="compatibility-modal-description">
                      This score is based on your personality, age, and shared interests, tailored for a great connection!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <h4 className="text-sm font-medium text-[hsl(var(--foreground))]">Why You Match:</h4>
                    {getCompatibilityBreakdown(selectedMatch).map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <item.icon className="h-5 w-5 text-[hsl(var(--romance))]" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{item.label}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                    <Button
                      className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 min-h-[44px] focus:ring-[hsl(var(--romance))]"
                      onClick={() => sendMessage(selectedMatch.id)}
                      aria-label={`Start conversation with ${selectedMatch.name}`}
                      disabled={!isOnline}
                    >
                      Message Now
                    </Button>
                    <Button
                      variant="outline"
                      className="text-[hsl(var(--romance))] border-[hsl(var(--romance))] focus:ring-[hsl(var(--romance))]"
                      onClick={() => setSelectedMatch(null)}
                      aria-label="Close compatibility details"
                    >
                      Close
                    </Button>
                  </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </FocusLock>

      {/* Progress Modal */}
      <FocusLock>
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent
            className="bg-[hsl(var(--card))] max-w-sm sm:max-w-md lg:max-w-lg bg-gradient-to-br from-[hsl(var(--romance)/0.1)] to-[hsl(var(--purple-accent)/0.1)] rounded-[2rem]"
            hideCloseButton={true}
          >
            <AnimatePresence>
              {showProgressModal && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="prefers-reduced-motion:transition-none"
                >
                  {progress.badges.includes('Matchmaker Pro') && (
                    <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={100} />
                  )}
                  <DialogHeader>
                    <DialogTitle className="text-[hsl(var(--foreground))] flex items-center gap-2" id="progress-modal-title">
                      Your Matchmaker Journey
                      <Heart className="h-5 w-5 text-[hsl(var(--romance))]" />
                    </DialogTitle>
                    <DialogDescription className="text-[hsl(var(--muted-foreground))]" aria-describedby="progress-modal-description">
                      {progress.badges.includes('Matchmaker Pro')
                        ? 'Congrats, Matchmaker Pro! You’ve earned a badge and a free boost!'
                        : `Send ${5 - progress.messages_sent} more message${5 - progress.messages_sent > 1 ? 's' : ''} to earn the Matchmaker Pro badge and a free boost!`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Messages Sent: {progress.messages_sent}</p>
                      <Progress value={(progress.messages_sent / 5) * 100} className="mt-2" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Badges Earned: {progress.badges.length}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {progress.badges.map((badge, index) => (
                          <Badge key={index} className="bg-[hsl(var(--romance))] text-[hsl(var(--primary-foreground))]">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Boosts Earned: {progress.boosts_earned}</p>
                    </div>
                  </div>
                  <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                    <Button
                      className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 min-h-[44px] focus:ring-[hsl(var(--romance))]"
                      onClick={() => navigate('/badges')}
                      aria-label="View all badges"
                    >
                      View Badges
                    </Button>
                    <Button
                      variant="outline"
                      className="text-[hsl(var(--romance))] border-[hsl(var(--romance))] focus:ring-[hsl(var(--romance))]"
                      onClick={() => setShowProgressModal(false)}
                      aria-label="Close progress modal"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </FocusLock>

      {/* Swipe Action Modal */}
      <FocusLock>
        <Dialog open={!!showSwipeActionModal} onOpenChange={() => setShowSwipeActionModal(null)}>
          <DialogContent
            className="bg-[hsl(var(--card))] max-w-sm sm:max-w-md lg:max-w-lg bg-gradient-to-br from-[hsl(var(--romance)/0.1)] to-[hsl(var(--purple-accent)/0.1)] rounded-[2rem]"
            hideCloseButton={true}
          >
            <AnimatePresence>
              {showSwipeActionModal && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="prefers-reduced-motion:transition-none"
                >
                  <DialogHeader>
                    <DialogTitle className="text-[hsl(var(--foreground))]" id="swipe-action-modal-title">
                      Passed on {showSwipeActionModal.name}
                    </DialogTitle>
                    <DialogDescription className="text-[hsl(var(--muted-foreground))]" aria-describedby="swipe-action-modal-description">
                      Help us improve your matches by rating this suggestion!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-8 w-8 cursor-pointer ${
                            star <= feedbackRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
                          }`}
                          onClick={() => setFeedbackRating(star)}
                          aria-label={`Rate ${star} stars`}
                        />
                      ))}
                    </div>
                    <Input
                      placeholder="Optional comment..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="mt-2 bg-[hsl(var(--input))] border-[hsl(var(--border))]"
                      aria-label="Feedback comment"
                    />
                  </div>
                  <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                    <Button
                      className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 min-h-[44px] focus:ring-[hsl(var(--romance))]"
                      onClick={submitFeedback}
                      aria-label="Submit feedback"
                      disabled={feedbackRating === 0}
                    >
                      Submit Feedback
                    </Button>
                    <Button
                      variant="outline"
                      className="text-[hsl(var(--romance))] border-[hsl(var(--romance))] focus:ring-[hsl(var(--romance))]"
                      onClick={() => setShowSwipeActionModal(null)}
                      aria-label="Skip feedback"
                    >
                      Skip
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </FocusLock>

      {/* Swipe Hint Modal */}
      <FocusLock>
        <Dialog open={showSwipeHint} onOpenChange={setShowSwipeHint}>
          <DialogContent className="bg-[hsl(var(--card))] max-w-sm sm:max-w-md lg:max-w-lg bg-gradient-to-br from-[hsl(var(--romance)/0.1)] to-[hsl(var(--purple-accent)/0.1)] rounded-3xl">
            <AnimatePresence>
              {showSwipeHint && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="prefers-reduced-motion:transition-none"
                >
                  <DialogHeader>
                    <DialogTitle className="text-[hsl(var(--foreground))]" id="swipe-hint-modal-title">
                      Swipe to Decide!
                    </DialogTitle>
                    <DialogDescription className="text-[hsl(var(--muted-foreground))]" aria-describedby="swipe-hint-modal-description">
                      Swipe right to like and start chatting, left to pass. Or use the buttons!
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-6">
                    <Button
                      className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300 min-h-[44px] focus:ring-[hsl(var(--romance))]"
                      onClick={() => setShowSwipeHint(false)}
                      aria-label="Got it"
                    >
                      Got it!
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </FocusLock>
    </div>
  );
}