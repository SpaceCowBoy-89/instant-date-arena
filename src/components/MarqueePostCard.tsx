import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface MarqueePostCardProps {
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
    community_name?: string;
    is_trending?: boolean;
  };
  onClick?: () => void;
  className?: string;
  hideDate?: boolean;
}

export const MarqueePostCard: React.FC<MarqueePostCardProps> = ({
  post,
  onClick,
  className = '',
  hideDate = false
}) => {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <motion.div
      className={`cursor-pointer select-none ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-80 h-44 border-border/50 hover:border-romance/30 transition-all duration-300 shadow-sm hover:shadow-lg relative overflow-hidden bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Trending indicator */}
          {post.is_trending && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-romance/10 text-romance border-romance/20">
                <Flame className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8 ring-2 ring-romance/10">
              <AvatarImage src={post.user?.photo_url} alt={post.user?.name} />
              <AvatarFallback className="bg-romance/10 text-romance font-medium text-xs">
                {post.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground text-sm truncate">
                  {post.user?.name || 'Unknown User'}
                </h4>
                {!hideDate && (
                  <>
                    <span className="text-muted-foreground text-xs">•</span>
                    <time className="text-muted-foreground text-xs" title={new Date(post.created_at).toLocaleString()}>
                      {timeAgo}
                    </time>
                  </>
                )}
              </div>

              {post.community_name && (
                <p className="text-muted-foreground text-xs mt-1 truncate">
                  in {post.community_name}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 mb-3">
            <p className="text-foreground text-sm leading-relaxed line-clamp-3">
              {post.message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-border/30">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
              <Heart className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{post.likes || 0}</span>
            </button>

            <button className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{post.comments || 0}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};