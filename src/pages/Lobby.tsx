import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { IOSSafeDropdown, IOSSafeDropdownItem } from "@/components/ui/ios-safe-dropdown";
import { Heart, Users, Clock, Settings, User, MessageCircle, Sparkles, Sun, Moon, Coffee, RefreshCw, ChevronDown, Star, Flame, Trophy, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import DailyMatchIndicator from "@/components/DailyMatchIndicator";
import { useMatchLimits } from "@/hooks/useMatchLimits";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StreakCardProps {
  streak: number;
  previousStreak?: number;
}

const StreakCard: React.FC<StreakCardProps> = ({ streak, previousStreak = 0 }) => {
  const isIncreased = streak > previousStreak;
  const milestones = [
    { day: 7, icon: Flame, color: 'text-red-500', label: '7-day milestone: Unlock bonus match!' },
    { day: 30, icon: Trophy, color: 'text-yellow-500', label: '30-day milestone: Profile boost!' },
    { day: 100, icon: Crown, color: 'text-purple-500', label: '100-day milestone: Premium features!' },
  ];
  const maxDay = 100;
  const segments = [
    { start: 0, end: 7, color: 'bg-green-500' },
    { start: 7, end: 30, color: 'bg-blue-500' },
    { start: 30, end: maxDay, color: 'bg-purple-500' },
  ];

  const getDynamicText = () => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 7) return "Keep going! Aim for 7 days to earn extra matches.";
    if (streak < 30) return "Great job! You've earned extra matches. Next: Profile boost at 30 days.";
    if (streak < 100) return "Awesome streak! Profile boosted. Crown awaits at 100 days.";
    return "Legendary! Enjoy premium features. Keep it up!";
  };

  useEffect(() => {
    if (isIncreased) {
      // Optional: Trigger particle effect here if using a library like particles.js, but keeping CSS-only
    }
  }, [streak]);

  return (
    <div className="rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md p-6 dark:from-gray-900 dark:to-gray-800 h-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Star className="h-6 w-6 text-yellow-400 animate-shine cursor-pointer" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Streak Milestones</DialogTitle>
              <DialogDescription>
                {milestones.map(({ day, label }) => (
                  <p key={day} className={streak >= day ? 'text-foreground' : 'text-muted-foreground'}>
                    Day {day}: {label}
                  </p>
                ))}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <h3 className="text-lg font-semibold">Your Streak</h3>
      </div>
      <div className="relative mb-6">
        <div className="relative h-3 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden mt-4">
          {segments.map((seg, i) => {
            const segWidth = ((seg.end - seg.start) / maxDay) * 100;
            const filledWidth = Math.min(Math.max(streak - seg.start, 0), seg.end - seg.start) / (seg.end - seg.start) * segWidth;
            return (
              <div
                key={i}
                className="absolute h-full transition-all duration-500"
                style={{ left: `${(seg.start / maxDay) * 100}%`, width: `${segWidth}%` }}
              >
                <div className={cn("h-full rounded-full", seg.color)} style={{ width: `${filledWidth}%` }} />
              </div>
            );
          })}
        </div>
      </div>
      <p className={cn('text-center text-4xl sm:text-5xl md:text-6xl font-black text-pink-600 dark:text-pink-400', isIncreased && 'animate-glow')}>
        {streak}
      </p>
      <p className="text-center text-sm font-sans text-gray-500 dark:text-gray-400">days in a row</p>
      <p className="text-center text-sm text-muted-foreground mt-2">{getDynamicText()}</p>
    </div>
  );
};

const Lobby = () => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState("2-3 minutes");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [noSinglesAvailable, setNoSinglesAvailable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { refetchMatchLimits } = useMatchLimits();

  useEffect(() => {
    loadUserProfile();
    getCurrentUser();
    fetchActiveUsersCount();
    fetchDailyStreak();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload) => {
          console.log('Queue status changed:', payload);
          if (payload.eventType === 'DELETE') {
            setIsInQueue(false);
            setQueuePosition(0);
            setNoSinglesAvailable(false);
            
            try {
              const { data: recentChat } = await supabase
                .from('chats')
                .select('chat_id, created_at')
                .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (recentChat && new Date().getTime() - new Date(recentChat.created_at).getTime() < 30000) {
                toast({
                  title: "Match Found!",
                  description: "Redirecting to your chat...",
                });
                refetchMatchLimits();
                navigate(`/chat/${recentChat.chat_id}`);
              }
            } catch (error) {
              console.error('Error checking for recent chat:', error);
            }
          } else if (payload.new && payload.new.status === 'matched') {
            setIsInQueue(false);
            setNoSinglesAvailable(false);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue'
        },
        () => {
          fetchActiveUsersCount();
        }
      )
      .subscribe();

    checkQueueStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchActiveUsersCount = async () => {
    try {
      const { data: queueUsers, error } = await supabase
        .from('queue')
        .select('user_id')
        .eq('status', 'waiting');

      if (error) {
        console.error('Error fetching queue users:', error);
        return;
      }

      if (!queueUsers || queueUsers.length === 0) {
        setActiveUsers(0);
        return;
      }

      const userIds = queueUsers.map(q => q.user_id);
      const { data: userProfiles, error: profileError } = await supabase
        .from('users')
        .select('id, gender, preferences')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching user profiles:', profileError);
        return;
      }

      const usersWithCompleteProfiles = userProfiles?.filter(user => {
        const userGender = user.gender;
        const userPreferences = user.preferences as any;
        const userGenderPreference = userPreferences?.gender_preference;
        return userGender && userGenderPreference;
      }) || [];

      setActiveUsers(usersWithCompleteProfiles.length);
    } catch (error) {
      console.error('Error in fetchActiveUsersCount:', error);
    }
  };

  const checkQueueStatus = async () => {
    if (!currentUserId) return;

    const { data: queueEntry } = await supabase
      .from('queue')
      .select('status')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (queueEntry) {
      setIsInQueue(true);
      setQueuePosition(Math.floor(Math.random() * 5) + 1);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfileLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        const prefs = (profile.preferences as any) || {};
        profile.preferences = {
          interests: Array.isArray(prefs.interests) ? prefs.interests : [],
          looking_for: typeof prefs.looking_for === 'string' ? prefs.looking_for : "Long-term relationship",
          age_range: Array.isArray(prefs.age_range) ? prefs.age_range : 
                    Array.isArray(prefs.ageRange) ? prefs.ageRange : [22, 35],
          max_distance: Array.isArray(prefs.max_distance) ? prefs.max_distance : [24901],
          gender_preference: typeof prefs.gender_preference === 'string' ? prefs.gender_preference : "Women"
        };
      }

      setUserProfile(profile);
      
      console.log('Loaded user profile:', profile);
      console.log('Photo URL:', profile?.photo_url);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDailyStreak = async () => {
    if (!currentUserId) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('streak')
        .eq('id', currentUserId)
        .single();
      setDailyStreak(0); // Default since streak column doesn't exist
    } catch (error) {
      console.error('Error fetching daily streak:', error);
    }
  };

  const joinQueue = async () => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "Please log in to join the queue",
        variant: "destructive"
      });
      return;
    }

    if (!userProfile) {
      toast({
        title: "Complete Your Profile",
        description: "Please complete your profile before joining the queue",
        variant: "destructive"
      });
      navigate('/profile');
      return;
    }

    if (!userProfile.photo_url || userProfile.photo_url === "/placeholder.svg") {
      toast({
        title: "Profile Picture Required",
        description: "Please upload a profile picture to join the speed dating queue. Your photo helps create meaningful connections!",
        variant: "destructive"
      });
      navigate('/profile');
      return;
    }

    try {
      setNoSinglesAvailable(false);
      
      const { error: queueError } = await supabase
        .from('queue')
        .upsert({
          user_id: currentUserId,
          status: 'waiting'
        });

      if (queueError) {
        console.error('Error joining queue:', queueError);
        toast({
          title: "Error",
          description: "Failed to join queue. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setIsInQueue(true);
      setQueuePosition(Math.floor(Math.random() * 5) + 1);
      
      const { data, error } = await supabase.functions.invoke('matchmaker');
      
      if (error) {
        console.error('Matchmaker error:', error);
        toast({
          title: "Error",
          description: "Failed to find match. Please try again.",
          variant: "destructive"
        });
        await leaveQueue();
        return;
      }

      if (data?.daily_limit_reached) {
        await leaveQueue();
        setShowLimitModal(true);
        refetchMatchLimits();
        return;
      }

      if (data?.success && data?.chat_id) {
        toast({
          title: "Match Found!",
          description: "Redirecting to your chat...",
        });
        refetchMatchLimits();
        navigate(`/chat/${data.chat_id}`);
      } else if (data?.message && data.message.includes('No other users available')) {
        setNoSinglesAvailable(true);
        setQueuePosition(0);
        toast({
          title: "No Singles Available",
          description: "You're the first in line! We'll notify you when someone else joins.",
        });
      }
    } catch (error) {
      console.error('Queue join error:', error);
      setIsInQueue(false);
      toast({
        title: "Error",
        description: "Failed to join queue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const leaveQueue = async () => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('queue')
        .delete()
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error leaving queue:', error);
        toast({
          title: "Error",
          description: "Failed to leave queue",
          variant: "destructive"
        });
        return;
      }

      setIsInQueue(false);
      setQueuePosition(0);
      setNoSinglesAvailable(false);
      
      toast({
        title: "Left Queue",
        description: "You have successfully left the queue",
      });
    } catch (error) {
      console.error('Leave queue error:', error);
    }
  };

  const refreshQueue = async () => {
    if (!currentUserId) return;
    
    setIsRefreshing(true);
    await fetchActiveUsersCount();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background" style={{
      paddingBottom: 'env(safe-area-inset-bottom, 20px)'
    }}>
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-6">
        <div
          className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm shadow-sm"
          style={{
            paddingTop: 'env(safe-area-inset-top)'
          }}
        >
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-romance fill-romance shrink-0 animate-heartbeat" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">Speed Dating Lobby</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Ready to meet someone special?</p>
              </div>
            </div>
            
            <IOSSafeDropdown
              title="Settings Menu"
              trigger={
                <Button
                  variant="ghost"
                  className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-romance to-purple-accent rounded-lg flex items-center justify-center shadow-lg hover:from-romance/90 hover:to-purple-accent/90 p-0 relative touch-target"
                  aria-label="Open settings menu"
                >
                  <ChevronDown className="h-4 w-4 text-white/70 hover:text-white/90 transition-colors" />
                </Button>
              }
            >
              <IOSSafeDropdownItem className="flex items-center gap-2 p-3">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                  theme === "light" ? "bg-secondary border-2 border-primary/20 shadow-sm" : "bg-transparent"
                )}>
                  <Sun className={cn('h-4 w-4 transition-colors duration-200', theme === "light" ? "text-primary" : "text-muted-foreground")} />
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                  <Moon className={cn('h-4 w-4 transition-colors duration-200', theme === "dark" ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-medium ml-2">
                    {theme === "dark" ? "Dark" : "Light"}
                  </span>
                </div>
              </IOSSafeDropdownItem>
              <IOSSafeDropdownItem
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </IOSSafeDropdownItem>
              <IOSSafeDropdownItem
                onClick={() => navigate("/settings")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </IOSSafeDropdownItem>
            </IOSSafeDropdown>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 pb-24">
          {/* Main Content (Start Speed Dating Now and Your Streak) */}
          <div className="flex-1 lg:flex-[2] space-y-8">
            <Card className="relative overflow-hidden border border-border shadow-lg min-h-[250px] sm:min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-br from-romance/5 to-purple-accent/5" />
              <CardHeader className="relative pt-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-romance mb-2">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-romance" />
                  {isInQueue ? (noSinglesAvailable ? "No Singles Available" : "You're in the queue!") : "Join now and meet someone in minutes!"}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base font-semibold text-muted-foreground leading-relaxed">
                  {isInQueue 
                    ? (noSinglesAvailable 
                      ? "You're the first in line! We'll notify you when someone else joins the queue."
                      : "We're finding you the perfect match. Get ready for an amazing conversation!"
                    )
                    : "Click the button below to join other singles looking for connections"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4 sm:space-y-6">
                {!isInQueue ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-romance to-purple-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <Button
                      className="w-full py-5 sm:py-6 text-base sm:text-lg bg-gradient-to-r from-romance to-purple-accent hover:from-romance/90 hover:to-purple-accent/90 hover:scale-105 text-white px-6 min-h-[44px] rounded-lg transition-all duration-200 shadow-lg"
                      onClick={joinQueue}
                      disabled={noSinglesAvailable}
                    >
                      <Heart className="h-5 w-5 mr-2" />
                      Start Speed Dating →
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    {noSinglesAvailable ? (
                      <>
                        <div className="relative w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-4 sm:mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full" />
                          <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                            <Coffee className="h-10 sm:h-12 w-10 sm:w-12 text-orange-500" />
                          </div>
                        </div>
                        
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-orange-600">
                          No Singles Available Right Now
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4">
                          Don't worry! You're first in line. Someone will join soon.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                          <Button
                            variant="outline"
                            onClick={refreshQueue}
                            disabled={isRefreshing}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            {isRefreshing ? 'Checking...' : 'Check Again'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={leaveQueue}
                          >
                            Leave Queue
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-4 sm:mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-romance to-purple-accent rounded-full animate-pulse" />
                          <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                            <Users className="h-10 sm:h-12 w-10 sm:w-12 text-romance" />
                          </div>
                        </div>
                        
                        {queuePosition > 0 ? (
                          <>
                            <h3 className="text-lg sm:text-xl font-semibold mb-2">
                              You're #{queuePosition} in line
                            </h3>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4">
                              Estimated wait: {estimatedWait}
                            </p>
                            <Progress value={(5 - queuePosition) * 20} className="w-full max-w-xs mx-auto mb-4" />
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-romance">
                              Looking for your match... 💫
                            </h3>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4">
                              Hang tight, we're finding someone perfect for you!
                            </p>
                            <Progress value={75} className="w-full max-w-xs mx-auto mb-4" />
                          </>
                        )}
                        
                        <Button
                          variant="outline"
                          onClick={leaveQueue}
                          className="w-full"
                        >
                          Leave Queue
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-8 min-h-[300px] lg:h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-romance" />
                  Your Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StreakCard streak={dailyStreak} previousStreak={0} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex-1 lg:flex-[1] flex flex-col space-y-6">
            <DailyMatchIndicator />

            <Card className="min-h-[150px] lg:h-[200px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-romance" />
                  Active Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-romance mb-1">{activeUsers}</div>
                  <p className="text-sm text-muted-foreground">singles online</p>
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-[300px] lg:h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-romance" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-romance rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Join the queue</p>
                    <p className="text-xs text-muted-foreground">We'll match you with someone compatible</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-romance rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Chat for 3 minutes</p>
                    <p className="text-xs text-muted-foreground">Get to know each other authentically</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-romance rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Decide together</p>
                    <p className="text-xs text-muted-foreground">Continue chatting or try someone new</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


      <AlertDialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-romance" />
              Daily Match Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've reached your daily limit of 50 matches. Come back tomorrow for more connections and keep finding your perfect match!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowLimitModal(false)}
              className="bg-romance hover:bg-romance/90"
            >
              Got It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Navbar />
    </div>
  );
};

// CSS for heartbeat animation (can be moved to a global stylesheet)
const styles = `
  @keyframes heartbeat {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  .animate-heartbeat {
    animation: heartbeat 1.5s infinite;
  }
`;

export default Lobby;