import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Heart, Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { TweetCard } from '@/components/ui/tweet-card';

interface PulseResponse {
  id: string;
  user_group: string;
  user_name: string;
  response: string;
  likes: number;
  timestamp: string;
}

const SpeedPulseArena = () => {
  const [prompt, setPrompt] = useState("Maximum number of books to have in your TBR (To Be Read) pile?");
  const [userGroup, setUserGroup] = useState("Book Lovers");
  const [userResponse, setUserResponse] = useState("");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [responses, setResponses] = useState<PulseResponse[]>([
    {
      id: "1",
      user_group: "Book Lovers",
      user_name: "Alex",
      response: "25 books max! Any more and I get overwhelmed by choice paralysis 📚",
      likes: 8,
      timestamp: "3 min ago"
    },
    {
      id: "2",
      user_group: "Collectors",
      user_name: "Jamie",
      response: "No limit! My TBR pile is basically a small library at this point 😅",
      likes: 12,
      timestamp: "2 min ago"
    },
    {
      id: "3",
      user_group: "Book Lovers",
      user_name: "Casey",
      response: "10 books is my sweet spot - enough variety but not overwhelming",
      likes: 6,
      timestamp: "2 min ago"
    },
    {
      id: "4",
      user_group: "Nature Lovers",
      user_name: "Riley",
      response: "5 books only! I like to focus and really savor each one ✨",
      likes: 4,
      timestamp: "1 min ago"
    }
  ]);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes left
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
      const newResponse: PulseResponse = {
        id: Date.now().toString(),
        user_group: userGroup,
        user_name: "You",
        response: userResponse,
        likes: 0,
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

  // Sample poll results data
  const pollResults = [
    { range: "1-5 books", votes: 15, percentage: 25 },
    { range: "6-15 books", votes: 18, percentage: 30 },
    { range: "16-25 books", votes: 12, percentage: 20 },
    { range: "26-50 books", votes: 9, percentage: 15 },
    { range: "50+ books", votes: 6, percentage: 10 }
  ];

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
              <h1 className="text-xl md:text-2xl font-bold ml-4">Speed Pulse</h1>
            </div>
          </div>
        </div>

        {/* Banner */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span className="font-bold text-blue-600">Community Pulse Check 📊</span>
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
            <p className="text-sm md:text-base text-muted-foreground">Poll time remaining</p>
          </CardContent>
        </Card>

        {/* Prompt */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Community Question</CardTitle>
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

        {/* Poll Results */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-lg md:text-xl">Live Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pollResults.map((result, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between text-sm md:text-base gap-1">
                    <span className="font-medium">{result.range}</span>
                    <span className="text-muted-foreground">{result.votes} votes ({result.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 md:h-3">
                    <div
                      className="bg-gradient-to-r from-romance to-purple-accent h-2 md:h-3 rounded-full transition-all duration-500"
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <Textarea
                placeholder="Share your thoughts on this question... (280 characters max)"
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
                  Share Pulse
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Responses */}
        <div className="space-y-4 pb-24">
          <h2 className="text-lg md:text-xl font-semibold">Community Thoughts</h2>
          <div className="space-y-4">
            {responses.map((response) => {
              // Convert PulseResponse to TweetCard format
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
                comments: 0,
                community_name: response.user_group,
                is_pinned: false
              };

              return (
                <TweetCard
                  key={response.id}
                  post={tweetCardPost}
                  currentUserId="current_user"
                  onLike={async (postId) => handleLike(postId)}
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

        {/* Community Pulse Dashboard Preview */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700/30">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-green-800 mb-2">Community Pulse Dashboard</h3>
            <p className="text-sm text-green-700">
              Results from this poll will contribute to our {userGroup} community insights!
            </p>
          </CardContent>
        </Card>
      </div>

      <Navbar />
    </div>
  );
};

export default SpeedPulseArena;