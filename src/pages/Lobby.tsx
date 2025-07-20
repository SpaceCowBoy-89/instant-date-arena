
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Users, Clock, Settings, User, MessageCircle, Sparkles, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Lobby = () => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [activeUsers, setActiveUsers] = useState(142);
  const [estimatedWait, setEstimatedWait] = useState("2-3 minutes");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadUserProfile();
    getCurrentUser();
  }, []);

  // Set up real-time subscription for queue status changes
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
        (payload) => {
          console.log('Queue status changed:', payload);
          if (payload.eventType === 'DELETE') {
            setIsInQueue(false);
            setQueuePosition(0);
          } else if (payload.new && payload.new.status === 'matched') {
            // User has been matched, matchmaker will handle navigation
            setIsInQueue(false);
          }
        }
      )
      .subscribe();

    // Check initial queue status
    checkQueueStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Simulate active users count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
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
      // Simulate queue position (in a real app, this would be calculated)
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

      setUserProfile(profile);
      
      console.log('Loaded user profile:', profile);
      console.log('Photo URL:', profile?.photo_url);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const joinQueue = async () => {
    if (!currentUserId) return;

    try {
      // First, add user to queue
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
      
      // Now call matchmaker
      const { data, error } = await supabase.functions.invoke('matchmaker');
      
      if (error) {
        console.error('Matchmaker error:', error);
        toast({
          title: "Error",
          description: "Failed to find match. Please try again.",
          variant: "destructive"
        });
        await leaveQueue(); // Remove from queue on error
        return;
      }

      if (data?.daily_limit_reached) {
        await leaveQueue(); // Remove from queue
        setShowLimitModal(true);
        return;
      }

      if (data?.success && data?.chat_id) {
        toast({
          title: "Match Found!",
          description: "Redirecting to your chat...",
        });
        navigate(`/chat/${data.chat_id}`);
      }
      // If no immediate match, user stays in queue and waits for real-time updates
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
      
      toast({
        title: "Left Queue",
        description: "You have successfully left the queue",
      });
    } catch (error) {
      console.error('Leave queue error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Heart className="h-8 w-8 text-romance fill-romance" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Speed Dating Lobby</h1>
              <p className="text-muted-foreground">Ready to meet someone special?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
              <Moon className="h-4 w-4" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 pb-24">
          {/* Main Queue Card */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-romance/5 to-purple-accent/5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-romance" />
                  {isInQueue ? "You're in the queue!" : "Ready to start?"}
                </CardTitle>
                <CardDescription className="text-base">
                  {isInQueue 
                    ? "We're finding you the perfect match. Get ready for an amazing conversation!"
                    : "Join the speed dating queue and get matched with someone special in minutes."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {!isInQueue ? (
                  <>
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-romance to-purple-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-muted-foreground mb-6">
                        Click the button below to join {activeUsers} other singles looking for connections
                      </p>
                      <Button
                        variant="romance"
                        size="lg"
                        onClick={joinQueue}
                        className="text-lg px-8 py-6 h-auto"
                      >
                        <Heart className="h-5 w-5 mr-2" />
                        Start Speed Dating
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center py-6">
                      <div className="relative w-32 h-32 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-romance to-purple-accent rounded-full animate-pulse" />
                        <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                          <Users className="h-12 w-12 text-romance" />
                        </div>
                      </div>
                      
                      {queuePosition > 0 ? (
                        <>
                          <h3 className="text-xl font-semibold mb-2">
                            You're #{queuePosition} in line
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Estimated wait: {estimatedWait}
                          </p>
                          <Progress value={(5 - queuePosition) * 20} className="w-full max-w-xs mx-auto mb-4" />
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-semibold mb-2 text-romance">
                            Looking for your match... 💫
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Hang tight, we're finding someone perfect for you!
                          </p>
                          <Progress value={75} className="w-full max-w-xs mx-auto mb-4" />
                        </>
                      )}
                      
                      <Button
                        variant="soft"
                        onClick={leaveQueue}
                      >
                        Leave Queue
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Users */}
            <Card>
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

            {/* How It Works */}
            <Card>
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

            {/* Profile Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading profile...</div>
                  </div>
                ) : userProfile ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={userProfile.photo_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white">
                          {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{userProfile.name || "Your Name"}</p>
                        {userProfile.age && (
                          <p className="text-sm text-muted-foreground">{userProfile.age} years old</p>
                        )}
                        {userProfile.location && (
                          <p className="text-xs text-muted-foreground">{userProfile.location}</p>
                        )}
                      </div>
                    </div>
                    {userProfile.preferences?.interests && userProfile.preferences.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {userProfile.preferences.interests.slice(0, 3).map((interest: string) => (
                          <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                        ))}
                        {userProfile.preferences.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{userProfile.preferences.interests.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No interests added yet</div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Complete your profile to get started</p>
                  </div>
                )}
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="w-full"
                >
                  {userProfile ? "Edit Profile" : "Create Profile"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Daily Limit Modal */}
      <AlertDialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You've hit the limit!</AlertDialogTitle>
            <AlertDialogDescription>
              Slide to billing to recharge?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLimitModal(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowLimitModal(false);
                navigate('/billing');
              }}
              className="bg-romance hover:bg-romance/90 text-primary-foreground font-semibold"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Navbar />
    </div>
  );
};

export default Lobby;
