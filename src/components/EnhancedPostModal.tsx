import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IOSSafeDropdown, IOSSafeDropdownItem } from '@/components/ui/ios-safe-dropdown';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Flag,
  Bookmark,
  Send,
  X,
  Clock,
  MapPin,
  Users,
  Flame,
  Reply
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Post {
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
  community_name?: string;
  is_trending?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  likes: number;
}

interface EnhancedPostModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (postId: string) => void;
  onReport?: (postId: string) => void;
}

export const EnhancedPostModal: React.FC<EnhancedPostModalProps> = ({
  post,
  open,
  onOpenChange,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onReport
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [showFullComments, setShowFullComments] = useState(false);
  const [showCommentersList, setShowCommentersList] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Fetch real comments from database  
  const fetchPostComments = async (postId: string): Promise<Comment[]> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, content, created_at, user_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      if (!commentsData || commentsData.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      
      // Get user information
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, photo_url')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Create a user lookup map
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

      return commentsData.map(comment => {
        const user = usersMap.get(comment.user_id);
        return {
          id: comment.id,
          user_id: comment.user_id,
          user_name: user?.name || 'Unknown User',
          user_avatar: user?.photo_url || '',
          content: comment.content,
          created_at: comment.created_at,
          likes: 0 // We'll add this later if needed
        };
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  // Generate post-specific mock comments based on post ID (fallback)
  const generatePostComments = (postId: string): Comment[] => {
    const commentsMap: { [key: string]: Comment[] } = {
      'post_001': [
        {
          id: 'comment_1_001',
          user_id: 'user_002',
          user_name: 'Marcus Chen',
          user_avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
          content: 'This is so relatable! I had the exact same experience last week 😅',
          created_at: '2024-01-15T14:20:00Z',
          likes: 12
        },
        {
          id: 'comment_2_001',
          user_id: 'user_003',
          user_name: 'Sophie Martinez',
          user_avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
          content: 'Thanks for sharing! This really speaks to my experience as well.',
          created_at: '2024-01-15T14:35:00Z',
          likes: 8
        }
      ],
      'post_002': [
        {
          id: 'comment_1_002',
          user_id: 'user_001',
          user_name: 'Emma Thompson',
          user_avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          content: 'Beautiful haiku! The imagery really captures the essence of Sunday prep.',
          created_at: '2024-01-15T15:10:00Z',
          likes: 15
        },
        {
          id: 'comment_2_002',
          user_id: 'user_004',
          user_name: 'Jake Rodriguez',
          user_avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
          content: 'This is poetry! Mind if I share this with my meal prep group?',
          created_at: '2024-01-15T15:25:00Z',
          likes: 6
        }
      ],
      'post_003': [
        {
          id: 'comment_1_003',
          user_id: 'user_005',
          user_name: 'Zoe Kim',
          user_avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
          content: 'OMG this is literally me every Sunday! 😂 The struggle is real',
          created_at: '2024-01-15T16:00:00Z',
          likes: 22
        },
        {
          id: 'comment_2_003',
          user_id: 'user_006',
          user_name: 'David Park',
          user_avatar: 'https://randomuser.me/api/portraits/men/6.jpg',
          content: 'Haha! At least you think about meal prep. I just order takeout 🙈',
          created_at: '2024-01-15T16:15:00Z',
          likes: 18
        },
        {
          id: 'comment_3_003',
          user_id: 'user_007',
          user_name: 'Isabella Santos',
          user_avatar: 'https://randomuser.me/api/portraits/women/7.jpg',
          content: 'This needs to be a whole series! More relatable content please! 🎥',
          created_at: '2024-01-15T16:30:00Z',
          likes: 9
        }
      ]
    };

    // Return post-specific comments or generic ones for unknown posts
    return commentsMap[postId] || [
      {
        id: `comment_generic_${postId}`,
        user_id: 'user_generic',
        user_name: 'Community Member',
        user_avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
        content: 'Great post! Thanks for sharing this with the community.',
        created_at: new Date().toISOString(),
        likes: Math.floor(Math.random() * 10) + 1
      }
    ];
  };

  useEffect(() => {
    if (post) {
      setLikeCount(post.likes || 0);
      setLiked(false); // Reset like state for new post
      setBookmarked(false); // Reset bookmark state for new post
      setCommentText(''); // Clear comment input for new post
      
      // Fetch real comments from database
      fetchPostComments(post.id).then(realComments => {
        if (realComments.length > 0) {
          setComments(realComments);
        } else {
          // Fallback to mock comments if no real comments exist
          setComments(generatePostComments(post.id));
        }
      });
    }
  }, [post]);

  // Hide chatbot trigger when modal is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [open]);

  useEffect(() => {
    if (open && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [open]);

  if (!post) return null;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwnPost = post.user_id === currentUserId;

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    if (onLike) {
      onLike(post.id);
    }

    toast({
      title: newLiked ? 'Post liked' : 'Like removed',
      description: newLiked
        ? `You liked ${post.user?.name}'s post`
        : `You removed your like from ${post.user?.name}'s post`,
    });
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast({
      title: bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks',
      description: bookmarked
        ? `${post.user?.name}'s post removed from your saved items`
        : `${post.user?.name}'s post saved for later`,
    });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post.id);
    } else {
      navigator.clipboard.writeText(`Check out ${post.user?.name}'s post from ${post.community_name}!`).then(() => {
        toast({
          title: 'Link copied',
          description: `${post.user?.name}'s post link copied to clipboard`,
        });
      });
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(post.id);
    } else {
      toast({
        title: 'Post reported',
        description: 'This post has been reported for review.',
      });
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);

    try {
      // Save to database first
      if (onComment) {
        await onComment(post.id, commentText);
      }

      // Refresh comments from database to get the latest data
      const updatedComments = await fetchPostComments(post.id);
      setComments(updatedComments);
      setCommentText('');

      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    ));
  };

  // Parse content for mentions and hashtags
  const parseContent = (content: string) => {
    const parts = [];
    const regex = /(@\w+|#\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      const matchContent = match[0];
      parts.push({
        type: matchContent.startsWith('@') ? 'mention' : 'hashtag',
        content: matchContent,
        key: `${matchContent.startsWith('@') ? 'mention' : 'hashtag'}-${match.index}`
      });

      lastIndex = match.index + matchContent.length;
    }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[90vw] sm:w-[95vw] max-w-2xl max-h-[80vh] sm:max-h-[90vh] p-0 overflow-hidden rounded-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        hideCloseButton={true}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <AvatarImage src={post.user?.photo_url} alt={post.user?.name} />
                <AvatarFallback>{post.user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{post.user?.name || 'Unknown User'}</h3>
                  {post.is_trending && (
                    <Badge variant="secondary" className="flex-shrink-0 bg-romance/10 text-romance border-romance/20">
                      <Flame className="h-3 w-3 text-romance" />
                      <span className="hidden sm:inline sm:ml-1">Trending</span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{timeAgo}</span>
                  {post.community_name && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-romance truncate hidden sm:inline">in {post.community_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IOSSafeDropdown
                title="Post Options"
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 min-h-[44px] min-w-[44px] touch-target">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <IOSSafeDropdownItem onClick={handleBookmark}>
                  <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? 'Remove bookmark' : 'Bookmark post'}
                </IOSSafeDropdownItem>
                {!isOwnPost && (
                  <IOSSafeDropdownItem onClick={handleReport} className="text-destructive">
                    <Flag className="h-4 w-4 mr-2" />
                    Report post
                  </IOSSafeDropdownItem>
                )}
              </IOSSafeDropdown>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Post Content */}
          <div className="overflow-y-auto">
            <div className="p-3 sm:p-6">

              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {contentParts.map((part) => {
                    if (part.type === 'mention') {
                      return (
                        <span key={part.key} className="text-romance hover:underline cursor-pointer font-medium">
                          {part.content}
                        </span>
                      );
                    } else if (part.type === 'hashtag') {
                      return (
                        <span key={part.key} className="text-purple-accent hover:underline cursor-pointer font-medium">
                          {part.content}
                        </span>
                      );
                    } else {
                      return <span key={part.key}>{part.content}</span>;
                    }
                  })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
                <div className="flex items-center gap-3 sm:gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-3 ${liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="font-medium text-xs sm:text-sm">{likeCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-3 text-muted-foreground hover:text-blue-500"
                    onClick={() => setShowFullComments(!showFullComments)}
                  >
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-xs sm:text-sm">{comments.length}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-3 text-muted-foreground hover:text-green-500"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-xs sm:text-sm hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  {/* Commenters List (Always Visible) */}
                  {!showFullComments && !showCommentersList && comments.length > 0 && (
                    <div className="p-3 sm:p-4 bg-muted/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Comments from:</span>
                      </div>
                      <div className="flex -space-x-2 overflow-hidden">
                        {comments.slice(0, 5).map((comment, index) => (
                          <Avatar key={comment.id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
                            <AvatarFallback className="text-xs">{comment.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {comments.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">+{comments.length - 5}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowCommentersList(true)}
                        className="text-xs text-romance hover:underline mt-2"
                      >
                        Click here to view comments
                      </button>
                    </div>
                  )}

                  {/* Commenters List (Read-only comments view) */}
                  {showCommentersList && !showFullComments && (
                    <div className="border-t border-border">
                      <div className="p-3 sm:p-4 border-b border-border bg-muted/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-foreground">
                            Comments on {post.user?.name}'s post
                          </h4>
                          <button
                            onClick={() => setShowCommentersList(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Hide
                          </button>
                        </div>
                      </div>

                      {/* Comments List (Read-only) */}
                      <ScrollArea className="max-h-60 sm:max-h-80 overflow-y-auto">
                        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                          {comments.map((comment) => (
                            <motion.div
                              key={comment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-3 items-start"
                            >
                              <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                                <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
                                <AvatarFallback>{comment.user_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-muted rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{comment.user_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm leading-relaxed">{comment.content}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Full Comments Section (Only when expanded) */}
                  {showFullComments && (
                    <>
                      {/* Comment Input */}
                      <div className="p-3 sm:p-4 border-b border-border bg-muted/30">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-foreground">
                        Comments on {post.user?.name}'s post
                      </h4>
                    </div>
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>Y</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <Textarea
                          ref={commentInputRef}
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[60px] resize-none bg-background border-2 border-muted hover:border-romance/30 focus-visible:border-romance focus-visible:ring-0 placeholder:text-muted-foreground/70 rounded-lg px-3 py-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              handleCommentSubmit();
                            }
                          }}
                        />
                        <div className="flex items-center justify-end">
                          <Button
                            onClick={handleCommentSubmit}
                            disabled={!commentText.trim() || isSubmittingComment}
                            size="sm"
                            className="bg-romance hover:bg-romance-dark text-primary-foreground"
                          >
                            {isSubmittingComment ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Posting...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Post
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <ScrollArea className="max-h-60 sm:max-h-80 overflow-y-auto">
                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                      {comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 items-start"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                            <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
                            <AvatarFallback>{comment.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-4 ml-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-red-500"
                                onClick={() => handleCommentLike(comment.id)}
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                {comment.likes > 0 && comment.likes}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setReplyingTo(comment.id)}
                              >
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};