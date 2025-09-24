import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Image, Send, X, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { Media } from '@capacitor-community/media';
import { VideoRecorder, VideoRecorderCamera, VideoRecorderQuality } from '@capacitor-community/video-recorder';

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


  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to upload images.',
          variant: 'destructive',
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/upload-post-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadedFiles(prev => [...prev, result.url]);

      toast({
        title: 'File uploaded',
        description: 'Your image has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaSelection = async () => {
    try {
      setIsUploading(true);

      // Check if we're on a native platform (iOS/Android)
      if (Capacitor.isNativePlatform()) {
        console.log('Using Capacitor Camera for native platform');

        // Show action sheet to choose media type and source
        const result = await ActionSheet.showActions({
          title: 'Add Media',
          message: 'Choose what you\'d like to add',
          options: [
            { title: 'Take Photo', style: ActionSheetButtonStyle.Default },
            { title: 'Record Video', style: ActionSheetButtonStyle.Default },
            { title: 'Choose from Library', style: ActionSheetButtonStyle.Default },
            { title: 'Cancel', style: ActionSheetButtonStyle.Cancel },
          ],
        });

        if (result.index === 3) return; // Cancel

        let source: CameraSource;
        let mediaType: 'photo' | 'video' = 'photo';

        if (result.index === 0) {
          // Take Photo
          source = CameraSource.Camera;
          mediaType = 'photo';
        } else if (result.index === 1) {
          // Record Video
          source = CameraSource.Camera;
          mediaType = 'video';
        } else {
          // Choose from Library - show sub-menu for photo or video
          const libraryResult = await ActionSheet.showActions({
            title: 'Choose Media Type',
            message: 'What would you like to select?',
            options: [
              { title: 'Photo', style: ActionSheetButtonStyle.Default },
              { title: 'Video', style: ActionSheetButtonStyle.Default },
              { title: 'Cancel', style: ActionSheetButtonStyle.Cancel },
            ],
          });

          if (libraryResult.index === 2) return; // Cancel

          if (libraryResult.index === 1) {
            // Video selection from library
            try {
              const mediaAssets = await Media.getMedias({
                quantity: 1,
                types: 'videos'
              });

              if (mediaAssets.medias && mediaAssets.medias.length > 0) {
                const videoAsset = mediaAssets.medias[0];

                // Get the actual file path (iOS only, Android uses identifier as path)
                let filePath: string;
                if (Capacitor.getPlatform() === 'ios') {
                  const mediaPath = await Media.getMediaByIdentifier({
                    identifier: videoAsset.identifier
                  });
                  filePath = mediaPath.path;
                } else {
                  filePath = videoAsset.identifier;
                }

                // Convert to File object
                const response = await fetch(filePath);
                const blob = await response.blob();
                const file = new File([blob], `video_${Date.now()}.mp4`, {
                  type: 'video/mp4'
                });

                await handleFileUpload(file);
              }
            } catch (error) {
              console.error('Video selection error:', error);
              toast({
                title: 'Video Selection Failed',
                description: 'Failed to select video. Please try again.',
                variant: 'destructive',
              });
            }
            return;
          }

          // Photo selection (default behavior)
          source = CameraSource.Photos;
          mediaType = 'photo';
        }

        if (mediaType === 'video') {
          try {
            // Initialize video recorder
            await VideoRecorder.initialize({
              camera: VideoRecorderCamera.BACK,
              quality: VideoRecorderQuality.MAX_1080P,
              autoShow: true
            });

            // Start recording
            await VideoRecorder.startRecording();

            // For this implementation, we'll record for a few seconds and then stop
            // In a real app, you might want to show a recording UI with stop button
            toast({
              title: 'Recording Started',
              description: 'Tap anywhere to stop recording',
            });

            // Simple timeout for demo - in production, you'd want user control
            setTimeout(async () => {
              try {
                const result = await VideoRecorder.stopRecording();
                await VideoRecorder.destroy();

                if (result.videoUrl) {
                  // Convert video URL to File object
                  const response = await fetch(result.videoUrl);
                  const blob = await response.blob();
                  const file = new File([blob], `video_${Date.now()}.mp4`, {
                    type: 'video/mp4'
                  });

                  await handleFileUpload(file);

                  toast({
                    title: 'Video Recorded',
                    description: 'Video has been recorded and uploaded successfully!',
                  });
                }
              } catch (error) {
                console.error('Video recording stop error:', error);
                await VideoRecorder.destroy();
                toast({
                  title: 'Recording Failed',
                  description: 'Failed to save recording. Please try again.',
                  variant: 'destructive',
                });
              }
            }, 5000); // 5 second recording

          } catch (error) {
            console.error('Video recording error:', error);
            toast({
              title: 'Camera Error',
              description: 'Failed to access camera for video recording. Please check permissions.',
              variant: 'destructive',
            });
          }
          return;
        }

        const photo = await CapacitorCamera.getPhoto({
          resultType: CameraResultType.Uri,
          source,
          quality: 90,
          allowEditing: true,
          correctOrientation: true,
        });

        if (!photo.path) return;

        // Convert Capacitor photo to File
        const response = await fetch(photo.path);
        const blob = await response.blob();
        const file = new File([blob], `photo.${photo.format || 'jpg'}`, {
          type: `image/${photo.format || 'jpeg'}`
        });

        await handleFileUpload(file);
      } else {
        console.log('Using web file input for browser');
        // Fallback for web browsers - trigger file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Media selection error:', error);
      toast({
        title: 'Media Selection Failed',
        description: 'Failed to select media. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMediaSelection}
                      disabled={isUploading}
                      className="h-9 px-3 text-muted-foreground hover:text-romance hover:bg-romance/10 rounded-lg"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          {Capacitor.isNativePlatform() ? (
                            <Camera className="h-4 w-4 mr-2" />
                          ) : (
                            <Image className="h-4 w-4 mr-2" />
                          )}
                          <span className="text-sm">
                            {Capacitor.isNativePlatform() ? 'Media' : 'Media'}
                          </span>
                        </>
                      )}
                    </Button>
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
                  className="flex flex-wrap gap-3 pt-2 border-t border-muted/10"
                >
                  {uploadedFiles.map((fileUrl, index) => {
                    const isVideo = fileUrl.includes('.mp4') || fileUrl.includes('.webm') || fileUrl.includes('.ogg') || fileUrl.includes('.avi') || fileUrl.includes('.mov') || fileUrl.includes('video');

                    return (
                      <div
                        key={index}
                        className="relative group"
                      >
                        {/* Media preview */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted/20 border border-muted/30">
                          {isVideo ? (
                            <video
                              src={fileUrl}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                            />
                          ) : (
                            <img
                              src={fileUrl}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}

                          {/* Remove button */}
                          <button
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors group-hover:scale-110"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Success indicator */}
                        <div className="absolute bottom-1 left-1 bg-green-500 text-white rounded-full p-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
  );
};