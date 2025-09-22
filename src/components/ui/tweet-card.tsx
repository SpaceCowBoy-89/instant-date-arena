import React, { useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Share2, MoreVertical, Flag, Bookmark, Users, ThumbsUp, ThumbsDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TweetCardProps {
  post: {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    user?: {
      name: string;
      photo_url?: string;
    };
    likes?: number;
    comments?: number;
    is_pinned?: boolean;
    community_name?: string;
    video_url?: string;
    video_thumbnail?: string;
    video_duration?: number;
    content_type?: string;
  };
  currentUserId: string;
  onLike?: (postId: string) => Promise<void>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onVoteUp?: (postId: string) => void;
  onVoteDown?: (postId: string) => void;
  thumbsUp?: number;
  thumbsDown?: number;
  rankingBadge?: React.ReactNode;
  contentTypeBadge?: React.ReactNode;
  className?: string;
}

export const TweetCard = React.memo<TweetCardProps>(({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onReport,
  onVoteUp,
  onVoteDown,
  thumbsUp,
  thumbsDown,
  rankingBadge,
  contentTypeBadge,
  className = ''
}) => {
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(post.likes || 0);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [isLiking, setIsLiking] = React.useState(false);
  const [votedUp, setVotedUp] = React.useState(false);
  const [votedDown, setVotedDown] = React.useState(false);
  const { toast } = useToast();

  const isOwnPost = post.user_id === currentUserId;
  const timeAgo = useMemo(() => 
    formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
    [post.created_at]
  );

  // Parse content for mentions and hashtags
  const parseContent = (content: string) => {
    const parts = [];
    const regex = /(@\w+|#\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      // Add the match (mention or hashtag)
      const matchContent = match[0];
      parts.push({
        type: matchContent.startsWith('@') ? 'mention' : 'hashtag',
        content: matchContent,
        key: `${matchContent.startsWith('@') ? 'mention' : 'hashtag'}-${match.index}`
      });

      lastIndex = match.index + matchContent.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return parts;
  };

  const contentParts = parseContent(post.message);

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (liked) {
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }

      if (onLike) {
        await onLike(post.id);
      }
    } catch (error) {
      // Revert on error
      if (liked) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        setLiked(false);
        setLikeCount(prev => prev - 1);
      }

      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(post.id);
    } else {
      toast({
        title: 'Comments coming soon',
        description: 'The comment feature will be available soon!',
      });
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post.id);
    } else {
      navigator.clipboard.writeText(`Check out this post from ${post.community_name || 'the community'}!`).then(() => {
        toast({
          title: 'Link copied',
          description: 'Post link copied to clipboard',
        });
      }).catch(() => {
        toast({
          title: 'Share',
          description: 'Share feature coming soon!',
        });
      });
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast({
      title: bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks',
      description: bookmarked ? 'Post removed from your saved items' : 'Post saved for later',
    });
  };

  const handleReport = () => {
    if (onReport) {
      onReport(post.id);
    } else {
      toast({
        title: 'Reported',
        description: 'This post has been reported for review.',
      });
    }
  };

  const handleVoteUp = () => {
    if (votedUp) return; // Prevent multiple votes
    if (votedDown) {
      setVotedDown(false);
    }
    setVotedUp(true);
    if (onVoteUp) {
      onVoteUp(post.id);
    }
  };

  const handleVoteDown = () => {
    if (votedDown) return; // Prevent multiple votes
    if (votedUp) {
      setVotedUp(false);
    }
    setVotedDown(true);
    if (onVoteDown) {
      onVoteDown(post.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
    >
      <Card className="border border-border/50 hover:border-border transition-colors duration-200 shadow-none hover:shadow-sm bg-card relative">
        {/* Ranking Badge */}
        {rankingBadge}

        <CardContent className="p-4 relative">
          {/* Content Type Badge - now moved inline with timestamp */}
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 ring-2 ring-romance/5">
                <AvatarImage src={post.user?.photo_url} alt={post.user?.name} />
                <AvatarFallback className="bg-romance/5 text-romance font-medium">
                  {post.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground text-sm hover:underline cursor-pointer truncate">
                    {post.user?.name || 'Unknown User'}
                  </h4>

                  {post.is_pinned && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      <Users className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}

                  <span className="text-muted-foreground text-xs">•</span>
                  <time className="text-muted-foreground text-xs" title={new Date(post.created_at).toLocaleString()}>
                    {timeAgo}
                  </time>

                  {/* Community Group Badge - moved to right of timestamp */}
                  {post.community_name && contentTypeBadge && (
                    <>
                      <span className="text-muted-foreground text-xs">•</span>
                      <div className="max-w-[80px]">
                        {contentTypeBadge}
                      </div>
                    </>
                  )}
                </div>

                {/* Removed duplicate community name display */}
              </div>
            </div>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleBookmark}>
                  <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? 'Remove bookmark' : 'Bookmark post'}
                </DropdownMenuItem>

                {!isOwnPost && (
                  <DropdownMenuItem onClick={handleReport} className="text-destructive">
                    <Flag className="h-4 w-4 mr-2" />
                    Report post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="mb-4">
            {/* Video Content */}
            {post.video_url && (
              <div className="mb-3 rounded-lg overflow-hidden bg-muted">
                <video
                  controls
                  className="w-full aspect-video object-cover"
                  poster={post.video_thumbnail}
                  preload="metadata"
                >
                  <source src={post.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Text Content */}
            {post.message && (
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                {contentParts.map((part) => {
                  if (part.type === 'mention') {
                    return (
                      <span
                        key={part.key}
                        className="text-romance hover:underline cursor-pointer font-medium"
                      >
                        {part.content}
                      </span>
                    );
                  } else if (part.type === 'hashtag') {
                    return (
                      <span
                        key={part.key}
                        className="text-purple-accent hover:underline cursor-pointer font-medium"
                      >
                        {part.content}
                      </span>
                    );
                  } else {
                    return <span key={part.key}>{part.content}</span>;
                  }
                })}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-1">
              {/* Arena Voting (if provided) */}
              {(onVoteUp || onVoteDown) ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 gap-2 transition-colors rounded-full ${
                      votedUp
                        ? 'text-green-700 bg-green-50 dark:bg-green-950/30 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-950/40'
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20'
                    }`}
                    onClick={handleVoteUp}
                  >
                    <ThumbsUp className={`h-4 w-4 transition-all ${votedUp ? 'fill-current scale-110' : ''}`} />
                    <span className="text-sm font-medium">{thumbsUp || 0}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 gap-2 transition-colors rounded-full ${
                      votedDown
                        ? 'text-red-700 bg-red-50 dark:bg-red-950/30 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-950/40'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                    }`}
                    onClick={handleVoteDown}
                  >
                    <ThumbsDown className={`h-4 w-4 transition-all ${votedDown ? 'fill-current scale-110' : ''}`} />
                    <span className="text-sm font-medium">{thumbsDown || 0}</span>
                  </Button>

                  <div className="text-xs text-muted-foreground ml-2">
                    Score: +{(thumbsUp || 0) - (thumbsDown || 0)}
                  </div>
                </>
              ) : (
                <>
                  {/* Regular Social Actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 gap-2 transition-colors rounded-full ${
                      liked
                        ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                        : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                    }`}
                    onClick={handleLike}
                    disabled={isLiking}
                  >
                    <Heart className={`h-4 w-4 transition-all ${liked ? 'fill-current scale-110' : ''}`} />
                    <span className="text-sm font-medium">{likeCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors rounded-full"
                    onClick={handleComment}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{post.comments || 0}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 gap-2 text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors rounded-full"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});