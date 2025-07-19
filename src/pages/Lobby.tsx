import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Clock, Settings, User, MessageCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [activeUsers, setActiveUsers] = useState(142);
  const [estimatedWait, setEstimatedWait] = useState("2-3 minutes");
  const navigate = useNavigate();

  useEffect(() => {
    if (isInQueue) {
      const interval = setInterval(() => {
        setActiveUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
        if (queuePosition > 0) {
          setQueuePosition(prev => Math.max(0, prev - 1));
        }
        if (queuePosition === 0 && isInQueue) {
          // Simulate finding a match
          setTimeout(() => {
            navigate("/chat");
          }, 2000);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isInQueue, queuePosition, navigate]);

  const joinQueue = () => {
    setIsInQueue(true);
    setQueuePosition(Math.floor(Math.random() * 8) + 1);
  };

  const leaveQueue = () => {
    setIsInQueue(false);
    setQueuePosition(0);
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
          <div className="flex gap-2">
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

        <div className="grid lg:grid-cols-3 gap-8">
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
                            Match found! 🎉
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Connecting you to your chat room...
                          </p>
                          <Progress value={100} className="w-full max-w-xs mx-auto mb-4" />
                        </>
                      )}
                      
                      <Button
                        variant="soft"
                        onClick={leaveQueue}
                        disabled={queuePosition === 0}
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
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white">
                      AJ
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Alex Johnson</p>
                    <p className="text-sm text-muted-foreground">28 years old</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Hiking</Badge>
                  <Badge variant="secondary" className="text-xs">Coffee</Badge>
                  <Badge variant="secondary" className="text-xs">Travel</Badge>
                </div>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;