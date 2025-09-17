import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Image, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Uploady from '@rpldy/uploady';
import UploadButton from '@rpldy/upload-button';
import axios from 'axios';

interface PostCreationProps {
  communityName: string;
  userAvatar?: string;
  userName: string;
  onCreatePost: (content: string, mentions: string[], hashtags: string[], fileUrls?: string[]) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
}


export const PostCreation = ({
  communityName,
  userAvatar,
  userName,
  onCreatePost,
  placeholder = "What's on your mind?",
  maxLength = 500
}: PostCreationProps) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle viewport changes for native apps
  useEffect(() => {
    const handleViewportChange = () => {
      if (isExpanded && textareaRef.current) {
        // Ensure textarea remains in view when virtual keyboard appears
        textareaRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
    }
  }, [isExpanded]);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Handle scrolling when expanded state changes
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      setTimeout(() => {
        const cardRect = cardRef.current!.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // For native apps, account for virtual keyboard
        const keyboardOffset = window.visualViewport ?
          window.innerHeight - window.visualViewport.height : 0;
        const effectiveViewportHeight = viewportHeight - keyboardOffset;

        if (cardRect.bottom > effectiveViewportHeight - 80) {
          cardRef.current!.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }
      }, 200);
    }
  }, [isExpanded]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
    }
  };


  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Replace with your actual upload endpoint
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileUrl = response.data.url;
      setUploadedFiles(prev => [...prev, fileUrl]);

      toast({
        title: 'File uploaded',
        description: 'Your file has been uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      // Import moderation service
      const { moderateText } = await import('@/services/moderation');
      
      // Check content moderation
      const moderationResult = await moderateText(content);
      
      if (!moderationResult.isAppropriate) {
        toast({
          title: 'Content Not Allowed',
          description: 'Your post contains inappropriate content. Please revise and try again.',
          variant: 'destructive',
        });
        setIsPosting(false);
        return;
      }

      await onCreatePost(content, [], [], uploadedFiles);

      // Reset form
      setContent('');
      setUploadedFiles([]);
      setIsExpanded(false);

      toast({
        title: 'Posted!',
        description: `Your post has been shared with ${communityName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setContent('');
    setUploadedFiles([]);
    setIsExpanded(false);
  };

  const remainingChars = maxLength - content.length;
  const isNearLimit = remainingChars <= 50;
  const isOverLimit = remainingChars < 0;

  return (
    <Uploady
      destination={{
        url: '/api/upload',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }}
      listeners={{
        onItemFinishProgress: (item) => {
          if (item.uploadResponse?.data?.url) {
            setUploadedFiles(prev => [...prev, item.uploadResponse.data.url]);
            toast({
              title: 'File uploaded',
              description: 'Your file has been uploaded successfully.',
            });
          }
        },
        onItemError: () => {
          toast({
            title: 'Upload failed',
            description: 'Failed to upload file. Please try again.',
            variant: 'destructive',
          });
        },
      }}
    >
      <Card
        ref={cardRef}
        className="mb-4 sm:mb-6 border-2 border-muted/20 dark:border-muted/30 shadow-lg rounded-2xl sm:rounded-3xl overflow-visible bg-background/50 dark:bg-background/80 backdrop-blur-sm touch-manipulation"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Main text input area - takes priority */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={`${placeholder} Share with ${communityName}...`}
                value={content}
                onChange={handleContentChange}
                onFocus={handleFocus}
                className={`min-h-[120px] sm:min-h-[140px] border-2 border-muted/40 dark:border-muted/60 resize-none p-4 sm:p-5 text-base sm:text-lg placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-romance/50 bg-background dark:bg-background rounded-xl sm:rounded-2xl transition-all duration-200 w-full ${isExpanded ? 'min-h-[160px] sm:min-h-[180px] border-romance/50 bg-background' : ''}`}
                style={{
                  fontSize: '16px', // Prevents zoom on iOS
                  WebkitAppearance: 'none',
                  WebkitUserSelect: 'text',
                  touchAction: 'manipulation',
                }}
              />
            </div>

            {/* Secondary elements - only shown when expanded */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Avatar and character count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback className="bg-gradient-to-br from-romance/20 to-purple-accent/20 text-romance font-semibold text-sm">
                          {userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">Posting as {userName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Character count */}
                      <span className={`text-sm font-medium ${isNearLimit ? (isOverLimit ? 'text-destructive' : 'text-orange-500') : 'text-muted-foreground/70'}`}>
                        {remainingChars}
                      </span>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center justify-between border-t border-muted/20 pt-4">
                    <div className="flex items-center gap-2">
                      <UploadButton>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-3 text-muted-foreground hover:text-romance hover:bg-romance/10 rounded-lg"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          <span className="text-sm">Photo</span>
                        </Button>
                      </UploadButton>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-muted-foreground hover:text-foreground px-4 py-2"
                        disabled={isPosting}
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isPosting || isOverLimit}
                        className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 font-semibold disabled:opacity-50"
                      >
                        {isPosting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Posting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            <span>Post</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Uploaded files display */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 pt-2 border-t border-muted/10"
                >
                  {uploadedFiles.map((fileUrl, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm"
                    >
                      <span>File {index + 1}</span>
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </Uploady>
  );
};