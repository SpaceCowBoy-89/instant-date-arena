import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, ThumbsUp, ThumbsDown, Sparkles, Video, Type, Play } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { VideoUpload } from '@/components/VideoUpload';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useToast } from '@/hooks/use-toast';
import { TweetCard } from '@/components/ui/tweet-card';

interface BurstContent {
  id: string;
  user_group: string;
  user_name: string;
  content: string;
  content_type: 'meme' | 'haiku' | 'video' | 'text';
  thumbs_up: number;
  thumbs_down: number;
  timestamp: string;
  video_file?: File;
  video_thumbnail?: string;
  video_duration?: number;
  video_url?: string;
}

const SpeedBurstArena = () => {
  const [prompt, setPrompt] = useState("Create quick content about meal prep");
  const [userResponse, setUserResponse] = useState("");
  const [userGroup, setUserGroup] = useState("Foodies");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [videoThumbnail, setVideoThumbnail] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [contentType, setContentType] = useState<'text' | 'video'>('text');
  const [contentEntries, setContentEntries] = useState<BurstContent[]>([
    {
      id: "1",
      user_group: "Foodies",
      user_name: "Alex",
      content: "When you find out meal prep doesn't mean ordering takeout for the week 😅\n*surprised pikachu face*",
      content_type: "meme",
      thumbs_up: 23,
      thumbs_down: 2,
      timestamp: "8 min ago"
    },
    {
      id: "2",
      user_group: "Fitness Enthusiasts",
      user_name: "Jamie",
      content: "Sunday prep day vibes:\nChop, dice, season, repeat\nFuture me says thanks! 🥕",
      content_type: "haiku",
      thumbs_up: 18,
      thumbs_down: 1,
      timestamp: "6 min ago"
    },
    {
      id: "3",
      user_group: "Busy Parents",
      user_name: "Casey",
      content: "Me: 'I'll meal prep this Sunday!' Also me: *frantically googling '5 minute dinners' at 6 PM* 😂",
      content_type: "video",
      thumbs_up: 31,
      thumbs_down: 0,
      timestamp: "4 min ago",
      video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      video_thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
      video_duration: 15
    },
    {
      id: "4",
      user_group: "College Students",
      user_name: "Riley",
      content: "Meal prep starter pack: Ramen noodles, hot sauce, and the eternal optimism that you'll actually cook tomorrow",
      content_type: "text",
      thumbs_up: 15,
      thumbs_down: 3,
      timestamp: "2 min ago"
    }
  ]);
  const [timeLeft, setTimeLeft] = useState(1320); // 22 minutes left
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cleanup video URLs on component unmount
  useEffect(() => {
    return () => {
      contentEntries.forEach(entry => {
        if (entry.video_url && entry.video_url.startsWith('blob:')) {
          URL.revokeObjectURL(entry.video_url);
        }
      });
    };
  }, [contentEntries]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (videoFile: File, thumbnail: string, duration: number) => {
    setSelectedVideo(videoFile);
    setVideoThumbnail(thumbnail);
    setVideoDuration(duration);
  };

  const handleSubmitContent = () => {
    if (contentType === 'text' && !userResponse.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter some text content.',
        variant: 'destructive',
      });
      return;
    }

    if (contentType === 'video' && !selectedVideo) {
      toast({
        title: 'Video required',
        description: 'Please upload a video.',
        variant: 'destructive',
      });
      return;
    }

    const videoUrl = selectedVideo ? URL.createObjectURL(selectedVideo) : undefined;

    const newContent: BurstContent = {
      id: Date.now().toString(),
      user_group: userGroup,
      user_name: "You",
      content: contentType === 'video'
        ? `[${Math.floor(videoDuration)}s video] ${userResponse || 'Video submission'}`
        : userResponse,
      content_type: contentType === 'video' ? "video" : "text",
      thumbs_up: 0,
      thumbs_down: 0,
      timestamp: "just now",
      video_file: selectedVideo || undefined,
      video_thumbnail: videoThumbnail || undefined,
      video_duration: videoDuration || undefined,
      video_url: videoUrl
    };

    setContentEntries(prev => [newContent, ...prev]);

    // Reset form
    setUserResponse("");
    setSelectedVideo(null);
    setVideoThumbnail('');
    setVideoDuration(0);
    setContentType('text');

    toast({
      title: 'Content submitted!',
      description: `Your ${contentType} has been added to Speed Burst.`,
    });
  };

  const handleVote = (id: string, voteType: 'up' | 'down') => {
    setContentEntries(prev => prev.map(entry =>
      entry.id === id
        ? {
            ...entry,
            thumbs_up: voteType === 'up' ? entry.thumbs_up + 1 : entry.thumbs_up,
            thumbs_down: voteType === 'down' ? entry.thumbs_down + 1 : entry.thumbs_down
          }
        : entry
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
      "Foodies": "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700",
      "Fitness Enthusiasts": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700",
      "Busy Parents": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700",
      "College Students": "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700",
      "Gamers": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700"
    };
    return colors[group as keyof typeof colors] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600";
  };

  const getContentTypeEmoji = (type: string) => {
    const emojis = {
      "meme": "😂",
      "haiku": "📝",
      "video": "🎥",
      "text": "💭"
    };
    return emojis[type as keyof typeof emojis] || "💭";
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
              <h1 className="text-xl md:text-2xl font-bold ml-4">Speed Burst</h1>
            </div>
          </div>
        </div>

        {/* Banner */}
        <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-700/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <span className="font-bold text-yellow-700">Flash Content Creation ⚡</span>
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
            <p className="text-sm md:text-base text-muted-foreground">Creation time remaining</p>
          </CardContent>
        </Card>

        {/* Prompt */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Creative Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-center font-medium mb-4">{prompt}</p>
            <div className="text-center mb-4">
              <Badge className={getGroupColor(userGroup)}>
                Your Group: {userGroup}
              </Badge>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Create a meme, haiku, video, or any micro-content!
            </div>
          </CardContent>
        </Card>

        {/* Content Creation Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Content Type Selector */}
              <Tabs value={contentType} onValueChange={(value) => setContentType(value as 'text' | 'video')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text Content
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <Textarea
                    placeholder="Create your micro-content here... Be creative! (280 characters max)"
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value.slice(0, 280))}
                    rows={4}
                    className="text-base md:text-lg resize-none"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {userResponse.length}/280 characters
                    </span>
                    <Button
                      onClick={handleSubmitContent}
                      disabled={!userResponse.trim()}
                      className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground w-full sm:w-auto"
                    >
                      Submit Text
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4 mt-4">
                  <VideoUpload
                    onVideoSelect={handleVideoSelect}
                    maxSizeMB={25}
                    maxDurationSeconds={30}
                    acceptedFormats={['video/mp4', 'video/webm', 'video/mov', 'video/quicktime']}
                  />

                  {selectedVideo && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a caption or description for your video... (optional, 140 characters max)"
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value.slice(0, 140))}
                        rows={2}
                        className="text-base resize-none"
                      />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs md:text-sm text-muted-foreground">
                          Caption: {userResponse.length}/140 characters
                        </span>
                        <Button
                          onClick={handleSubmitContent}
                          className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground w-full sm:w-auto"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Submit Video
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Content Entries */}
        <div className="space-y-4 pb-24">
          <h2 className="text-lg md:text-xl font-semibold">Creative Showcase</h2>
          <div className="space-y-4">
            {contentEntries
              .sort((a, b) => (b.thumbs_up - b.thumbs_down) - (a.thumbs_up - a.thumbs_down))
              .map((entry, index) => {
                // Convert BurstContent to TweetCard format
                const tweetCardPost = {
                  id: entry.id,
                  user_id: entry.user_name.toLowerCase().replace(' ', '_'),
                  message: entry.content,
                  created_at: new Date(Date.now() - (parseInt(entry.timestamp.split(' ')[0]) * 60000)).toISOString(),
                  user: {
                    name: entry.user_name,
                    photo_url: `https://api.dicebear.com/6.x/avataaars/svg?seed=${entry.user_name}`
                  },
                  likes: entry.thumbs_up,
                  comments: 0,
                  community_name: entry.user_group,
                  is_pinned: false
                };

                // Enhanced post with video support
                const enhancedPost = {
                  ...tweetCardPost,
                  video_url: entry.video_url,
                  video_thumbnail: entry.video_thumbnail,
                  video_duration: entry.video_duration,
                  content_type: entry.content_type
                };

                return (
                  <TweetCard
                    key={entry.id}
                    post={enhancedPost}
                    currentUserId="current_user"
                    onVoteUp={(postId) => handleVote(postId, 'up')}
                    onVoteDown={(postId) => handleVote(postId, 'down')}
                    thumbsUp={entry.thumbs_up}
                    thumbsDown={entry.thumbs_down}
                    rankingBadge={
                      index < 3 ? (
                        <div className="absolute -top-2 -right-2 z-20 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold shadow-lg">
                          #{index + 1}
                        </div>
                      ) : undefined
                    }
                    contentTypeBadge={
                      <Badge className={getGroupColor(entry.user_group)} variant="secondary">
                        {getContentTypeEmoji(entry.content_type)} {truncateGroupName(entry.user_group)}
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

export default SpeedBurstArena;