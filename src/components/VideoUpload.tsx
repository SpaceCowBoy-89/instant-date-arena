import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Video,
  Play,
  Pause,
  RotateCcw,
  X,
  FileVideo,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

interface VideoUploadProps {
  onVideoSelect: (videoFile: File, thumbnail: string, duration: number) => void;
  maxSizeMB?: number;
  maxDurationSeconds?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  type: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoSelect,
  maxSizeMB = 50, // 50MB default max size
  maxDurationSeconds = 60, // 60 seconds default max duration
  acceptedFormats = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'],
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Generate video thumbnail
  const generateThumbnail = useCallback((video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve('');

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(thumbnailDataUrl);
    });
  }, []);

  // Get video metadata
  const getVideoMetadata = useCallback((video: HTMLVideoElement): VideoMetadata => {
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      size: selectedVideo?.size || 0,
      type: selectedVideo?.type || ''
    };
  }, [selectedVideo]);

  // Validate video file
  const validateVideo = useCallback((file: File, metadata: VideoMetadata): string[] => {
    const errors: string[] = [];

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      errors.push(`File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum (${maxSizeMB}MB)`);
    }

    // Check duration
    if (metadata.duration > maxDurationSeconds) {
      errors.push(`Video duration (${Math.round(metadata.duration)}s) exceeds maximum (${maxDurationSeconds}s)`);
    }

    // Check format
    if (!acceptedFormats.includes(file.type)) {
      errors.push(`Format ${file.type} not supported. Use: ${acceptedFormats.join(', ')}`);
    }

    // Check dimensions (optional - for very small videos)
    if (metadata.width < 240 || metadata.height < 240) {
      errors.push('Video resolution too low (minimum 240x240)');
    }

    return errors;
  }, [maxSizeMB, maxDurationSeconds, acceptedFormats]);

  // Handle video file selection and processing
  const processVideoFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    setUploadProgress(0);

    try {
      // Create video URL
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setSelectedVideo(file);

      // Create video element for metadata extraction
      const video = document.createElement('video');
      video.src = url;

      // Wait for video to load metadata
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video metadata'));
      });

      // Get metadata
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        type: file.type
      };
      setVideoMetadata(metadata);

      // Validate video
      const errors = validateVideo(file, metadata);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsProcessing(false);
        return;
      }

      // Generate thumbnail
      video.currentTime = Math.min(1, metadata.duration / 2); // Get frame from middle or 1s
      video.onseeked = async () => {
        const thumbnailUrl = await generateThumbnail(video);
        setThumbnail(thumbnailUrl);

        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        setIsProcessing(false);

        // Call parent callback
        onVideoSelect(file, thumbnailUrl, metadata.duration);

        toast({
          title: 'Video ready!',
          description: 'Your video has been processed and is ready to submit.',
        });
      };

    } catch (error) {
      console.error('Error processing video:', error);
      setValidationErrors(['Failed to process video file']);
      setIsProcessing(false);
      toast({
        title: 'Error',
        description: 'Failed to process video. Please try again.',
        variant: 'destructive',
      });
    }
  }, [validateVideo, generateThumbnail, onVideoSelect]);

  // Handle video selection (Capacitor Camera or file input)
  const handleVideoSelection = async () => {
    try {
      // Check if we're on a native platform
      if (Capacitor.isNativePlatform()) {
        // Check camera permissions first
        const permission = await CapacitorCamera.checkPermissions();
        if (permission.camera !== 'granted' || permission.photos !== 'granted') {
          const requested = await CapacitorCamera.requestPermissions();
          if (requested.camera !== 'granted' || requested.photos !== 'granted') {
            toast({
              title: 'Permission Required',
              description: 'Please allow camera and photo library access in Settings > SpeedHeart',
              variant: 'destructive',
            });
            return;
          }
        }

        // For iOS, use file picker directly since video handling through Camera plugin is problematic
        toast({
          title: 'Select Video',
          description: 'Choose a video file from your device.',
        });
        fileInputRef.current?.click();
      } else {
        // Fallback to file input for web
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Video selection error:', error);
      toast({
        title: 'Selection Error',
        description: 'Failed to access video options. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));

    if (videoFile) {
      processVideoFile(videoFile);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a video file.',
        variant: 'destructive',
      });
    }
  }, [processVideoFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Reset video selection
  const resetVideo = () => {
    setSelectedVideo(null);
    setVideoUrl('');
    setThumbnail('');
    setIsPlaying(false);
    setIsProcessing(false);
    setUploadProgress(0);
    setVideoMetadata(null);
    setValidationErrors([]);

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle video playback
  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence mode="wait">
        {!selectedVideo ? (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card
              className={`border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? 'border-romance bg-romance/5 scale-[1.02]'
                  : 'border-border hover:border-romance/50 hover:bg-muted/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && handleVideoSelection()}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  {isDragging ? (
                    <motion.div
                      animate={{ scale: 1.1 }}
                      transition={{ repeat: Infinity, duration: 0.8, repeatType: 'reverse' }}
                    >
                      <Upload className="h-16 w-16 text-romance" />
                    </motion.div>
                  ) : (
                    <Video className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragging ? 'Drop your video here!' : 'Upload a Video'}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Drag and drop or click to select a video file
                  </p>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-center gap-4 flex-wrap">
                      <span>• Max size: {maxSizeMB}MB</span>
                      <span>• Max duration: {maxDurationSeconds}s</span>
                    </div>
                    <div>
                      Supported: MP4, WebM, MOV
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className="mt-4"
                >
                  <FileVideo className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="video-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Processing indicator */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Processing video...
                          </p>
                          <Progress value={uploadProgress} className="mt-2 h-2" />
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {uploadProgress}% complete
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation errors */}
            <AnimatePresence>
              {validationErrors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive mb-1">
                            Video validation failed:
                          </p>
                          <ul className="text-sm text-destructive/80 space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video preview */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black aspect-video">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* Video controls overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={togglePlayback}
                      className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video metadata */}
            {videoMetadata && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Video Details</h4>
                    {validationErrors.length === 0 && !isProcessing && (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{formatDuration(videoMetadata.duration)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <p className="font-medium">{formatFileSize(videoMetadata.size)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resolution:</span>
                      <p className="font-medium">{videoMetadata.width}×{videoMetadata.height}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <p className="font-medium">{videoMetadata.type.split('/')[1].toUpperCase()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetVideo}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Choose Different Video
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={resetVideo}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};