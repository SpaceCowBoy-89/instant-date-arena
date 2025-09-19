import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Swords, ThumbsUp, ThumbsDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { TweetCard } from '@/components/ui/tweet-card';

interface ClashResponse {
  id: string;
  user_group: string;
  user_name: string;
  response: string;
  thumbs_up: number;
  thumbs_down: number;
  timestamp: string;
}

const SpeedClashArena = () => {
  const [debateTopic, setDebateTopic] = useState("Best quick hangout: Bar or park?");
  const [userResponse, setUserResponse] = useState("");
  const [userGroup, setUserGroup] = useState("Movie Aficionados"); // User's primary group

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [responses, setResponses] = useState<ClashResponse[]>([
    {
      id: "1",
      user_group: "Adventurers",
      user_name: "Alex",
      response: "Parks all the way! Fresh air, natural vibes, and you can actually hear each other talk. Plus it's free! 🌳",
      thumbs_up: 15,
      thumbs_down: 3,
      timestamp: "5 min ago"
    },
    {
      id: "2",
      user_group: "Social & Cultural",
      user_name: "Jamie",
      response: "Bars create instant energy! Music, drinks, and that social buzz that breaks the ice faster than anything else 🍻",
      thumbs_up: 12,
      thumbs_down: 6,
      timestamp: "4 min ago"
    },
    {
      id: "3",
      user_group: "Sports Enthusiasts",
      user_name: "Casey",
      response: "Park meetups are versatile - throw a frisbee, have a picnic, go for a walk. Way more activities than just sitting around!",
      thumbs_up: 18,
      thumbs_down: 2,
      timestamp: "3 min ago"
    },
    {
      id: "4",
      user_group: "Foodies",
      user_name: "Riley",
      response: "Bars have the food and drink variety! Parks are great but limited options for foodies who want to explore flavors together",
      thumbs_up: 9,
      thumbs_down: 8,
      timestamp: "2 min ago"
    }
  ]);
  const [timeLeft, setTimeLeft] = useState(420); // 7 minutes left
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitResponse = () => {
    if (userResponse.trim()) {
      const newResponse: ClashResponse = {
        id: Date.now().toString(),
        user_group: userGroup,
        user_name: "You",
        response: userResponse,
        thumbs_up: 0,
        thumbs_down: 0,
        timestamp: "just now"
      };
      setResponses(prev => [newResponse, ...prev]);
      setUserResponse("");
    }
  };

  const handleVote = (id: string, voteType: 'up' | 'down') => {
    setResponses(prev => prev.map(response =>
      response.id === id
        ? {
            ...response,
            thumbs_up: voteType === 'up' ? response.thumbs_up + 1 : response.thumbs_up,
            thumbs_down: voteType === 'down' ? response.thumbs_down + 1 : response.thumbs_down
          }
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
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 mb-6" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold ml-4">Speed Clash</h1>
            </div>
          </div>
        </div>

        {/* Banner */}
        <Card className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-700/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Swords className="h-5 w-5 text-red-500" />
              <span className="font-bold text-red-600">Speed Clash Alert ⚔️</span>
            </div>
          </CardContent>
        </Card>

        {/* Countdown Timer */}
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-romance" />
              <span className="text-xl md:text-3xl font-bold text-romance">{formatTime(timeLeft)}</span>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Debate time remaining</p>
          </CardContent>
        </Card>

        {/* Debate Topic */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Debate Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-center font-medium mb-4">{debateTopic}</p>
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
              <Textarea
                placeholder="Share your group's stance on this debate... (280 characters max)"
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value.slice(0, 280))}
                rows={3}
                className="text-base md:text-lg resize-none"
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">
                  {userResponse.length}/280 characters
                </span>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!userResponse.trim()}
                  className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground w-full sm:w-auto"
                >
                  Join Debate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debate Responses */}
        <div className="space-y-4 pb-24">
          <h2 className="text-lg md:text-xl font-semibold">Battle of Ideas</h2>
          <div className="space-y-4">
            {responses.map((response) => {
              // Convert ClashResponse to TweetCard format
              const tweetCardPost = {
                id: response.id,
                user_id: response.user_name.toLowerCase().replace(' ', '_'),
                message: response.response,
                created_at: new Date(Date.now() - (parseInt(response.timestamp.split(' ')[0]) * 60000)).toISOString(),
                user: {
                  name: response.user_name,
                  photo_url: `https://api.dicebear.com/6.x/avataaars/svg?seed=${response.user_name}`
                },
                likes: response.thumbs_up,
                comments: 0,
                community_name: response.user_group,
                is_pinned: false
              };

              return (
                <TweetCard
                  key={response.id}
                  post={tweetCardPost}
                  currentUserId="current_user"
                  onVoteUp={(postId) => handleVote(postId, 'up')}
                  onVoteDown={(postId) => handleVote(postId, 'down')}
                  thumbsUp={response.thumbs_up}
                  thumbsDown={response.thumbs_down}
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

export default SpeedClashArena;