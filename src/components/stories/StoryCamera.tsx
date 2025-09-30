import React, { useState, useRef, useCallback } from 'react';
import { Camera, Video, Type, X, Check, RotateCcw, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StoryCameraProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

type StoryMode = 'camera' | 'text' | 'recording';
type ContentType = 'image' | 'video' | 'text';

const BACKGROUND_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#90EE90', '#FFB6C1', '#87CEEB', '#DDA0DD'
];

export const StoryCamera: React.FC<StoryCameraProps> = ({ onClose, onStoryCreated }) => {
  const [mode, setMode] = useState<StoryMode>('camera');
  const [contentType, setContentType] = useState<ContentType>('image');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: contentType === 'video'
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [contentType, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedMedia(imageDataUrl);
    setMode('camera');
  }, []);

  const startVideoRecording = useCallback(() => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setCapturedMedia(videoUrl);
      setMode('camera');
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Auto-stop after 15 seconds (story limit)
    setTimeout(() => {
      if (isRecording) {
        stopVideoRecording();
      }
    }, 15000);
  }, [isRecording]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const uploadStory = async () => {
    if (!capturedMedia && !textContent.trim()) {
      toast({
        title: "No Content",
        description: "Please capture media or add text for your story.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let mediaUrl = null;

      // Upload media if it exists
      if (capturedMedia && contentType !== 'text') {
        // Convert data URL to blob for upload
        const response = await fetch(capturedMedia);
        const blob = await response.blob();

        const fileExt = contentType === 'image' ? 'jpg' : 'webm';
        const fileName = `story_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `stories/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
      }

      // Create story record
      const { error: storyError } = await supabase
        .from('user_stories')
        .insert({
          user_id: user.id,
          content_type: contentType,
          media_url: mediaUrl,
          text_content: contentType === 'text' ? textContent : null,
          background_color: contentType === 'text' ? backgroundColor : null,
        });

      if (storyError) throw storyError;

      toast({
        title: "Story Posted",
        description: "Your story has been shared successfully!",
      });

      onStoryCreated();
      onClose();

    } catch (error) {
      console.error('Error uploading story:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to post your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Initialize camera when component mounts
  React.useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant={mode === 'camera' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('camera')}
          >
            <Camera className="h-4 w-4 mr-1" />
            Camera
          </Button>
          <Button
            variant={mode === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('text')}
          >
            <Type className="h-4 w-4 mr-1" />
            Text
          </Button>
        </div>

        {(capturedMedia || textContent.trim()) && (
          <Button variant="default" size="sm" onClick={uploadStory} disabled={isUploading}>
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {mode === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {capturedMedia ? (
                // Preview captured media
                <div className="relative w-full h-full">
                  {contentType === 'image' ? (
                    <img
                      src={capturedMedia}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={capturedMedia}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={() => setCapturedMedia(null)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // Live camera view
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </motion.div>
          )}

          {mode === 'text' && (
            <motion.div
              key="text"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 p-8 flex flex-col"
              style={{ backgroundColor }}
            >
              <div className="flex-1 flex items-center justify-center">
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Share what's on your mind..."
                  className="bg-transparent border-none text-white text-xl text-center resize-none focus:ring-0 placeholder-white/60"
                  style={{ color: backgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF' }}
                  rows={4}
                />
              </div>

              {/* Color Palette */}
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {BACKGROUND_COLORS.map((color) => (
                  <Button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Camera Controls */}
      {mode === 'camera' && !capturedMedia && (
        <div className="flex justify-center items-center p-8 space-x-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setContentType(contentType === 'image' ? 'video' : 'image')}
            className="text-white border-white"
          >
            {contentType === 'image' ? <Video className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </Button>

          {contentType === 'image' ? (
            <Button
              size="lg"
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full"
            >
              <Camera className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={isRecording ? stopVideoRecording : startVideoRecording}
              className={`w-16 h-16 rounded-full ${isRecording ? 'bg-red-500' : ''}`}
            >
              <Video className="h-6 w-6" />
            </Button>
          )}

          <div className="w-8" /> {/* Spacer for symmetry */}
        </div>
      )}
    </div>
  );
};