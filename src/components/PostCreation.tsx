import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Image, Smile, MapPin, Calendar, Hash, AtSign, Send, X } from 'lucide-react';
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

interface Mention {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
}

interface Hashtag {
  tag: string;
  startIndex: number;
  endIndex: number;
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
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
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

  // Mock data for mentions (in real app, this would come from API)
  const mockUsers = [
    { id: '1', name: 'Alex Thompson', avatar: '' },
    { id: '2', name: 'Sarah Chen', avatar: '' },
    { id: '3', name: 'Marcus Rodriguez', avatar: '' },
    { id: '4', name: 'Emma Wilson', avatar: '' },
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

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

      // Handle mentions
      const atIndex = newContent.lastIndexOf('@');
      if (atIndex !== -1 && atIndex === newContent.length - 1) {
        setShowMentionSuggestions(true);
        setMentionQuery('');
      } else if (atIndex !== -1) {
        const query = newContent.slice(atIndex + 1);
        if (query.includes(' ')) {
          setShowMentionSuggestions(false);
        } else {
          setMentionQuery(query);
          setShowMentionSuggestions(true);
        }
      } else {
        setShowMentionSuggestions(false);
      }

      // Extract hashtags
      const hashtagRegex = /#[\w]+/g;
      const foundHashtags = Array.from(newContent.matchAll(hashtagRegex)).map(match => ({
        tag: match[0].slice(1),
        startIndex: match.index!,
        endIndex: match.index! + match[0].length
      }));
      setHashtags(foundHashtags);
    }
  };

  const handleMentionSelect = (user: { id: string; name: string }) => {
    const atIndex = content.lastIndexOf('@');
    const beforeMention = content.slice(0, atIndex);
    const afterMention = content.slice(atIndex + mentionQuery.length + 1);
    const newContent = `${beforeMention}@${user.name} ${afterMention}`;

    setContent(newContent);
    setShowMentionSuggestions(false);
    setMentionQuery('');

    // Add to mentions array
    const newMention: Mention = {
      id: user.id,
      name: user.name,
      startIndex: atIndex,
      endIndex: atIndex + user.name.length + 1
    };
    setMentions(prev => [...prev, newMention]);

    textareaRef.current?.focus();
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
      const { moderateText } = await import('../services/moderation');
      
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

      const mentionNames = mentions.map(m => m.name);
      const hashtagNames = hashtags.map(h => h.tag);

      await onCreatePost(content, mentionNames, hashtagNames, uploadedFiles);

      // Reset form
      setContent('');
      setMentions([]);
      setHashtags([]);
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
    setMentions([]);
    setHashtags([]);
    setUploadedFiles([]);
    setIsExpanded(false);
    setShowMentionSuggestions(false);
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
        <CardContent className="p-3 sm:p-6">
          <div className="flex gap-2 sm:gap-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 ring-2 ring-romance/20 dark:ring-romance/30">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-romance/20 to-purple-accent/20 dark:from-romance/30 dark:to-purple-accent/30 text-romance dark:text-romance font-semibold text-sm sm:text-lg">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3 sm:space-y-4">
              {/* Main content area */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={`${placeholder} Share with ${communityName}...`}
                  value={content}
                  onChange={handleContentChange}
                  onFocus={handleFocus}
                  className={`min-h-[120px] sm:min-h-[80px] border-2 border-muted/40 dark:border-muted/60 resize-none p-4 sm:p-4 text-base sm:text-base placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-romance/50 bg-background dark:bg-background rounded-xl sm:rounded-2xl transition-all duration-200 max-h-[200px] sm:max-h-[200px] ${isExpanded ? 'min-h-[140px] sm:min-h-[140px] border-romance/50 bg-background' : ''}`}
                  style={{
                    fontSize: '16px', // Prevents zoom on iOS
                    WebkitAppearance: 'none', // Removes native styling on iOS
                    WebkitUserSelect: 'text', // Enables text selection
                    touchAction: 'manipulation', // Improves touch responsiveness
                  }}
                />

                {/* Mention suggestions */}
                <AnimatePresence>
                  {showMentionSuggestions && filteredUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 bg-background/95 dark:bg-background/90 backdrop-blur-md border-2 border-muted/30 dark:border-muted/40 rounded-xl sm:rounded-2xl shadow-xl z-50 max-h-32 sm:max-h-40 overflow-y-auto mt-2"
                    >
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleMentionSelect(user)}
                          className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-romance/10 dark:hover:bg-romance/20 text-left transition-colors duration-200 first:rounded-t-xl first:sm:rounded-t-2xl last:rounded-b-xl last:sm:rounded-b-2xl min-h-[44px]"
                        >
                          <Avatar className="h-8 w-8 sm:h-8 sm:w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs bg-romance/20 dark:bg-romance/30 text-romance dark:text-romance">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs sm:text-sm font-medium truncate">{user.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hashtags display */}
              <AnimatePresence>
                {hashtags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-1 sm:gap-2"
                  >
                    {hashtags.map((hashtag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-romance/20 dark:bg-romance/30 text-romance dark:text-romance border-romance/30 dark:border-romance/40 rounded-full px-2 sm:px-3 py-1">
                        <Hash className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
                        <span className="truncate max-w-[80px] sm:max-w-none">{hashtag.tag}</span>
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded options */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <Separator className="bg-muted/40 dark:bg-muted/60" />

                    {/* Action buttons */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <UploadButton>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-14 w-14 sm:h-12 sm:w-12 p-0 text-muted-foreground hover:text-romance dark:hover:text-romance hover:bg-romance/10 dark:hover:bg-romance/20 rounded-full transition-all duration-200"
                            >
                              <Image className="h-7 w-7 sm:h-6 sm:w-6" />
                            </Button>
                          </UploadButton>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-14 w-14 sm:h-12 sm:w-12 p-0 text-muted-foreground hover:text-romance dark:hover:text-romance hover:bg-romance/10 dark:hover:bg-romance/20 rounded-full transition-all duration-200"
                            onClick={() => {
                              toast({
                                title: "Emoji picker coming soon!",
                                description: "We're working on this feature.",
                              });
                            }}
                          >
                            <Smile className="h-7 w-7 sm:h-6 sm:w-6" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-14 w-14 sm:h-12 sm:w-12 p-0 text-muted-foreground hover:text-romance dark:hover:text-romance hover:bg-romance/10 dark:hover:bg-romance/20 rounded-full transition-all duration-200"
                            onClick={() => {
                              toast({
                                title: "Location tagging coming soon!",
                                description: "We're working on this feature.",
                              });
                            }}
                          >
                            <MapPin className="h-7 w-7 sm:h-6 sm:w-6" />
                          </Button>

                          <div className="text-xs text-muted-foreground/70 dark:text-muted-foreground/80 flex items-center gap-3 ml-2">
                            <div className="flex items-center gap-1">
                              <AtSign className="h-4 w-4" />
                              <span className="hidden sm:inline">@mention</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="h-4 w-4" />
                              <span className="hidden sm:inline">#hashtag</span>
                            </div>
                          </div>
                        </div>

                        {/* Character count */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`font-medium ${isNearLimit ? (isOverLimit ? 'text-destructive' : 'text-orange-500 dark:text-orange-400') : 'text-muted-foreground/70 dark:text-muted-foreground/80'}`}>
                            {remainingChars}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Uploaded files display */}
                    {uploadedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {uploadedFiles.map((fileUrl, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-green-500/20 text-green-800 dark:text-green-200 border-green-500/30 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 sm:gap-2"
                          >
                            <span className="truncate max-w-[80px] sm:max-w-none">File {index + 1}</span>
                            <button
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 ml-1 min-h-[20px] min-w-[20px] flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Submit buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex-1 text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted/20 dark:hover:bg-muted/30 rounded-xl px-6 py-3 font-medium transition-all duration-200 min-h-[48px]"
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isPosting || isOverLimit}
                        className="flex-1 bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent dark:from-romance dark:to-purple-accent dark:hover:from-romance-dark dark:hover:to-purple-accent text-white dark:text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                        size="sm"
                      >
                        {isPosting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Posting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            <span>Post</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </Uploady>
  );
};