import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Clock, Link as LinkIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { TweetCard } from '@/components/ui/tweet-card';
import { Badge } from '@/components/ui/badge';

interface RallyChain {
  id: string;
  user_group: string;
  user_name: string;
  user_avatar?: string;
  response: string;
  timestamp: string;
  chain_position: number;
}

const SpeedRallyArena = () => {
  const [prompt, setPrompt] = useState("Add to our quick workout relay - share your 5-minute energy booster!");
  const [userGroup, setUserGroup] = useState("Sports Enthusiasts");
  const [userResponse, setUserResponse] = useState("");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [chainResponses, setChainResponses] = useState<RallyChain[]>([
    {
      id: "1",
      user_group: "Sports Enthusiasts",
      user_name: "Alex",
      response: "Start with 30 jumping jacks to get your heart pumping!",
      timestamp: "8 min ago",
      chain_position: 1
    },
    {
      id: "2",
      user_group: "Sports Enthusiasts",
      user_name: "Jamie",
      response: "Follow up with 20 push-ups - feel that strength building!",
      timestamp: "6 min ago",
      chain_position: 2
    },
    {
      id: "3",
      user_group: "Adventurers",
      user_name: "Casey",
      response: "Mountain climbers for 45 seconds - core engagement time!",
      timestamp: "4 min ago",
      chain_position: 3
    },
    {
      id: "4",
      user_group: "Sports Enthusiasts",
      user_name: "Taylor",
      response: "Finish with a 1-minute plank hold - you've got this! 💪",
      timestamp: "2 min ago",
      chain_position: 4
    }
  ]);
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes left
  const [responseTime, setResponseTime] = useState(120); // 2 minutes per response
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    const responseTimer = setInterval(() => {
      setResponseTime(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(responseTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitResponse = () => {
    if (userResponse.trim()) {
      const newResponse: RallyChain = {
        id: Date.now().toString(),
        user_group: userGroup,
        user_name: "You",
        response: userResponse,
        timestamp: "just now",
        chain_position: chainResponses.length + 1
      };
      setChainResponses(prev => [...prev, newResponse]);
      setUserResponse("");
      setResponseTime(120); // Reset response timer
    }
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
              <h1 className="text-xl md:text-2xl font-bold ml-4">Speed Rally</h1>
            </div>
          </div>
        </div>

        {/* Banner */}
        <Card className="mb-6 bg-gradient-to-r from-romance/10 to-purple-accent/10 border-romance/20 dark:from-romance/20 dark:to-purple-accent/20 dark:border-romance/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <LinkIcon className="h-5 w-5 text-romance" />
              <span className="font-bold text-romance">Build a chain in 10min! 🔗</span>
            </div>
          </CardContent>
        </Card>

        {/* Countdown Timer */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-romance" />
                  <span className="text-lg md:text-2xl font-bold text-romance">{formatTime(timeLeft)}</span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">Event time left</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                  <span className="text-lg md:text-2xl font-bold text-orange-500">{formatTime(responseTime)}</span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">Your response time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prompt */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Rally Challenge</CardTitle>
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
              <Textarea
                placeholder="Add your link to the chain... (280 characters max)"
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
                  disabled={!userResponse.trim() || responseTime === 0}
                  className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground w-full sm:w-auto"
                >
                  Add to Chain
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chain Responses */}
        <div className="space-y-4 pb-24">
          <h2 className="text-lg md:text-xl font-semibold">Chain Progress</h2>
          {chainResponses.map((response, index) => {
            // Convert RallyChain to TweetCard format
            const tweetCardPost = {
              id: response.id,
              user_id: response.user_name.toLowerCase().replace(' ', '_'),
              message: response.response,
              created_at: new Date(Date.now() - (parseInt(response.timestamp.split(' ')[0]) * 60000)).toISOString(),
              user: {
                name: response.user_name,
                photo_url: `https://api.dicebear.com/6.x/avataaars/svg?seed=${response.user_name}`
              },
              likes: 0,
              comments: 0,
              community_name: response.user_group,
              is_pinned: false
            };

            return (
              <div key={response.id} className="relative">
                <TweetCard
                  post={tweetCardPost}
                  currentUserId="current_user"
                  rankingBadge={
                    <div className="absolute -top-2 -left-2 z-20 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-romance to-purple-accent text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold shadow-lg">
                      #{response.chain_position}
                    </div>
                  }
                  contentTypeBadge={
                    <Badge className={getGroupColor(response.user_group)} variant="secondary">
                      {truncateGroupName(response.user_group)}
                    </Badge>
                  }
                />
                {/* Chain Link Indicator */}
                {index < chainResponses.length - 1 && (
                  <div className="absolute -bottom-2 left-6 w-0.5 h-4 bg-romance/30 z-30"></div>
                )}
              </div>
            );
          })}

          {/* Next Link Placeholder */}
          <Card className="border-dashed border-2 border-romance/30 bg-romance/5 relative">
            <CardContent className="p-4 text-center">
              <div className="absolute -top-2 -left-2 z-20 w-8 h-8 bg-gray-300 dark:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                #{chainResponses.length + 1}
              </div>
              <p className="text-muted-foreground ml-4">Your turn to add to the chain!</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default SpeedRallyArena;