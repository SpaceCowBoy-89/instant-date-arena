import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Share2, MoreVertical, Flag, Bookmark, Users, Hash, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    media_urls?: string[];
    user?: {
      name: string;
      photo_url?: string;
    };
    likes?: number;
    comments?: number;
    is_pinned?: boolean;
    user_liked?: boolean;
    user_bookmarked?: boolean;
  };
  currentUserId: string;
  communityName: string;
  onLike?: (postId: string) => Promise<void>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onBookmark?: (postId: string) => Promise<void>;
  onDelete?: (postId: string, postUserId: string) => Promise<void>;
  className?: string;
}

export const PostCard = ({
  post,
  currentUserId,
  communityName,
  onLike,
  onComment,
  onShare,
  onReport,
  onBookmark,
  onDelete,
  className = ''
}: PostCardProps) => {
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [bookmarked, setBookmarked] = useState(post.user_bookmarked || false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const isOwnPost = post.user_id === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

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
      navigator.clipboard.writeText(`Check out this post in ${communityName}!`).then(() => {
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

  const handleBookmark = async () => {
    if (isBookmarking) return;

    setIsBookmarking(true);
    try {
      if (bookmarked) {
        setBookmarked(false);
      } else {
        setBookmarked(true);
      }

      if (onBookmark) {
        await onBookmark(post.id);
      }

      toast({
        title: bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks',
        description: bookmarked ? 'Post removed from your saved items' : 'Post saved for later',
      });
    } catch (error) {
      // Revert on error
      setBookmarked(!bookmarked);

      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBookmarking(false);
    }
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

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(post.id, post.user_id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-border/50 hover:border-border transition-colors duration-200 shadow-sm hover:shadow-md">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-romance/10">
                <AvatarImage src={post.user?.photo_url} alt={post.user?.name} />
                <AvatarFallback className="bg-romance/10 text-romance font-medium">
                  {post.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground text-sm hover:underline cursor-pointer">
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
                </div>

                <p className="text-muted-foreground text-xs mt-1">
                  in {communityName}
                </p>
              </div>
            </div>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleBookmark} disabled={isBookmarking}>
                  <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? 'Remove bookmark' : 'Bookmark post'}
                </DropdownMenuItem>

                {isOwnPost && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete post
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this post? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

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
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
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

            {/* Media Content */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-3 grid gap-2" style={{
                gridTemplateColumns: post.media_urls.length === 1 
                  ? '1fr' 
                  : post.media_urls.length === 2 
                    ? 'repeat(2, 1fr)'
                    : 'repeat(auto-fit, minmax(150px, 1fr))'
              }}>
                {post.media_urls.map((url, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden bg-muted">
                    <img
                      src={url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        maxHeight: post.media_urls!.length === 1 ? '400px' : '200px'
                      }}
                      onClick={() => {
                        // Open image in new tab for now
                        window.open(url, '_blank');
                      }}
                      onError={(e) => {
                        // Hide broken images
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 gap-2 transition-colors ${
                  liked
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
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
                className="h-8 px-3 gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                onClick={handleComment}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{post.comments || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 gap-2 text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Share</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};