import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } = '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  user_id: string;
  content_type: 'image' | 'video' | 'text';
  media_url?: string;
  text_content?: string;
  background_color?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  has_viewed: boolean;
  user?: {
    name: string;
    photo_url?: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
  onStoryChange?: (storyIndex: number) => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStoryIndex,
  onClose,
  onStoryChange,
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const currentStory = stories[currentStoryIndex];

  // Auto-progress to next story
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (STORY_DURATION / 100));

        if (newProgress >= 100) {
          // Move to next story
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            setProgress(0);
          } else {
            onClose();
          }
          return 0;
        }

        return newProgress;
      });
    }, 100);

    progressIntervalRef.current = interval;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStoryIndex, isPaused, stories.length, onClose]);

  // Mark story as viewed
  useEffect(() => {
    const markAsViewed = async () => {
      if (!currentStory || currentStory.has_viewed) return;

      try {
        await supabase
          .from('story_views')
          .insert({
            story_id: currentStory.id,
            viewer_id: (await supabase.auth.getUser()).data.user?.id,
          });
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    };

    markAsViewed();
  }, [currentStory]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousStory();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNextStory();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStoryIndex]);

  const goToNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
      onStoryChange?.(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
      onStoryChange?.(currentStoryIndex - 1);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !currentStory) return;

    try {
      // Send as a direct message to the story owner
      // This would integrate with your existing messaging system
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a story reaction/reply
      await supabase
        .from('story_reactions')
        .insert({
          story_id: currentStory.id,
          user_id: user.id,
          emoji: '💬', // Using chat emoji for text replies
        });

      toast({
        title: "Reply Sent",
        description: "Your reply was sent to the story owner.",
      });

      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentStory) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('story_reactions')
        .upsert({
          story_id: currentStory.id,
          user_id: user.id,
          emoji,
        });

      // Show quick feedback
      toast({
        title: "Reaction Sent",
        description: `You reacted with ${emoji}`,
      });
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress bars */}
      <div className="flex gap-1 p-2">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: `${
                  index < currentStoryIndex
                    ? 100
                    : index === currentStoryIndex
                    ? progress
                    : 0
                }%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentStory.user?.photo_url} />
            <AvatarFallback>
              {currentStory.user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{currentStory.user?.name}</p>
            <p className="text-xs text-white/70">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Story Content */}
      <div
        className="flex-1 relative flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            {currentStory.content_type === 'text' ? (
              <div
                className="w-full h-full flex items-center justify-center p-8"
                style={{ backgroundColor: currentStory.background_color || '#000000' }}
              >
                <p
                  className="text-2xl text-center font-medium leading-relaxed max-w-md"
                  style={{
                    color: currentStory.background_color === '#FFFFFF' ? '#000000' : '#FFFFFF'
                  }}
                >
                  {currentStory.text_content}
                </p>
              </div>
            ) : currentStory.content_type === 'image' ? (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentStory.media_url}
                autoPlay
                muted
                className="max-w-full max-h-full object-contain"
                onLoadedData={() => {
                  // Adjust story duration based on video length
                  if (videoRef.current) {
                    const videoDuration = videoRef.current.duration * 1000;
                    // Use video duration or default, whichever is longer
                    // This would require adjusting the progress logic
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation areas */}
        <div className="absolute inset-0 flex">
          <div className="flex-1" onClick={goToPreviousStory} />
          <div className="flex-1" onClick={goToNextStory} />
        </div>

        {/* Navigation arrows (desktop) */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 hidden md:block">
          {currentStoryIndex > 0 && (
            <Button variant="ghost" size="sm" onClick={goToPreviousStory}>
              <ChevronLeft className="h-6 w-6 text-white" />
            </Button>
          )}
        </div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
          {currentStoryIndex < stories.length - 1 && (
            <Button variant="ghost" size="sm" onClick={goToNextStory}>
              <ChevronRight className="h-6 w-6 text-white" />
            </Button>
          )}
        </div>
      </div>

      {/* Interaction Bar */}
      <div className="p-4 flex items-center gap-3">
        {showReplyInput ? (
          <div className="flex-1 flex gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to story..."
              className="bg-white/10 border-white/20 text-white placeholder-white/60"
              onKeyPress={(e) => e.key === 'Enter' && sendReply()}
            />
            <Button size="sm" onClick={sendReply} disabled={!replyText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('❤️')}
              className="text-white"
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Send message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/60"
              onFocus={() => setShowReplyInput(true)}
              readOnly
            />
          </>
        )}
      </div>
    </div>
  );
};