import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Heart, Laugh, Clock, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { TweetCard } from '@/components/ui/tweet-card';
import { Badge } from '@/components/ui/badge';
import { useArenaSession } from '@/hooks/useArenaSession';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SparkResponse {
  id: string;
  user_group: string;
  user_name: string;
  user_avatar?: string;
  response: string;
  likes: number;
  laughs: number;
  timestamp: string;
}

const SpeedSparkArena = () => {
  const { arena, isActive, timeLeft, sessionEnding } = useArenaSession('speed-spark');
  const [prompt, setPrompt] = useState("Quickest way to make friends in a new city?");
  const [userGroup, setUserGroup] = useState("Social & Cultural");
  const [userResponse, setUserResponse] = useState("");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [responses, setResponses] = useState<SparkResponse[]>([
    {
      id: "1",
      user_group: "Sports Enthusiasts",
      user_name: "Alex",
      response: "Join a local sports club or gym - instant common ground!",
      likes: 12,
      laughs: 3,
      timestamp: "2 min ago"
    },
    {
      id: "2",
      user_group: "Social & Cultural",
      user_name: "Jamie",
      response: "Volunteer at community events - you'll meet like-minded people",
      likes: 8,
      laughs: 1,
      timestamp: "3 min ago"
    },
    {
      id: "3",
      user_group: "Foodies",
      user_name: "Casey",
      response: "Take a cooking class - everyone's hungry for connections 😄",
      likes: 15,
      laughs: 7,
      timestamp: "4 min ago"
    }
  ]);
  const navigate = useNavigate();

  const handleSubmitResponse = () => {
    if (userResponse.trim()) {
      const newResponse: SparkResponse = {
        id: Date.now().toString(),
        user_group: userGroup,
        user_name: "You",
        response: userResponse,
        likes: 0,
        laughs: 0,
        timestamp: "just now"
      };
      setResponses(prev => [newResponse, ...prev]);
      setUserResponse("");
    }
  };

  const handleLike = (id: string) => {
    setResponses(prev => prev.map(response =>
      response.id === id
        ? { ...response, likes: response.likes + 1 }
        : response
    ));
  };

  const handleLaugh = (id: string) => {
    setResponses(prev => prev.map(response =>
      response.id === id
        ? { ...response, laughs: response.laughs + 1 }
        : response
    ));
  };

  const truncateGroupName = (groupName: string) => {
    const words = groupName.split(' ');
    if (words.length === 1) {
      // Single word - show full if 10 chars or less, otherwise truncate
      return groupName.length <= 10 ? groupName : groupName.substring(0, 8) + "..";
    }
    // Multiple words - show first word + ".."
    return words[0] + " ..";
  };

  const getGroupColor = (group: string) => {
    const colors = {
      "Book Lovers": "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700",
      "Movie Aficionados": "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700",
      "Foodies": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700",
      "Gamers": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700",
      "Anime Addicts": "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-700",
      "Creators": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700",
      "Adventurers": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
      "Sports Enthusiasts": "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700",
      "Collectors": "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700",
      "Tech Hobbyists": "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700",
      "Music & Performance": "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-700",
      "Nature Lovers": "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200 border-lime-200 dark:border-lime-700",
      "Social & Cultural": "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700"
    };
    return colors[group as keyof typeof colors] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 mb-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold ml-4">Speed Spark</h1>
            </div>
          </div>
        </div>

        {/* Session Ending Warning */}
        {sessionEnding && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              ⚠️ Session ending soon! Submit your final responses quickly.
            </AlertDescription>
          </Alert>
        )}

        {/* Countdown Timer */}
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className={`h-5 w-5 md:h-6 md:w-6 ${sessionEnding ? 'text-orange-500 animate-pulse' : 'text-romance'}`} />
              <span className={`text-xl md:text-3xl font-bold ${sessionEnding ? 'text-orange-500' : 'text-romance'}`}>
                {timeLeft || '0:00'}
              </span>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Session time remaining</p>
            {!isActive && (
              <p className="text-xs text-red-500 mt-2">Session not active - redirecting...</p>
            )}
          </CardContent>
        </Card>

        {/* Prompt */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Weekly Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-center font-medium mb-4">{prompt}</p>
            <div className="text-center">
              <Badge className={getGroupColor(userGroup)}>
                Your Group: {userGroup}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Response Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <Input
                placeholder="Type your quick response..."
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                maxLength={280}
                className="text-base md:text-lg"
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">
                  {userResponse.length}/280 characters
                </span>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!userResponse.trim() || !isActive}
                  className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground w-full sm:w-auto"
                >
                  {!isActive ? 'Session Ended' : 'Submit Response'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responses */}
        <div className="space-y-4 pb-24">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Community Responses</h2>
          <div className="space-y-4">
            {responses.map((response) => {
              // Convert SparkResponse to TweetCard format
              const tweetCardPost = {
                id: response.id,
                user_id: response.user_name.toLowerCase().replace(' ', '_'),
                message: response.response,
                created_at: new Date(Date.now() - (parseInt(response.timestamp.split(' ')[0]) * 60000)).toISOString(),
                user: {
                  name: response.user_name,
                  photo_url: `https://api.dicebear.com/6.x/avataaars/svg?seed=${response.user_name}`
                },
                likes: response.likes,
                comments: response.laughs, // Using laughs as comments for additional interaction
                community_name: response.user_group,
                is_pinned: false
              };

              return (
                <TweetCard
                  key={response.id}
                  post={tweetCardPost}
                  currentUserId="current_user"
                  onLike={async (postId) => handleLike(postId)}
                  onComment={(postId) => handleLaugh(postId)} // Using laugh handler for comment clicks
                  contentTypeBadge={
                    <Badge className={getGroupColor(response.user_group)} variant="secondary">
                      {truncateGroupName(response.user_group)}
                    </Badge>
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default SpeedSparkArena;