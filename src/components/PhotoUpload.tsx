import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Send, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

interface PhotoUploadProps {
  onImageUploaded?: (imageUrl: string) => void;
  onSendMessage?: (content: string, imageUrl?: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhotoUpload = ({ 
  onImageUploaded, 
  onSendMessage, 
  placeholder = "Type your message...",
  className = ""
}: PhotoUploadProps) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create filename with user ID and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      
      if (onImageUploaded) {
        onImageUploaded(publicUrl);
      }

      toast({
        title: 'Image Uploaded',
        description: 'Your image has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelection = async () => {
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

        // Show action sheet for camera or gallery
        const result = await ActionSheet.showActions({
          title: 'Select Photo',
          message: 'Choose how you\'d like to add a photo',
          options: [
            {
              title: 'Take Photo',
              style: ActionSheetButtonStyle.Default,
            },
            {
              title: 'Choose from Gallery',
              style: ActionSheetButtonStyle.Default,
            },
            {
              title: 'Cancel',
              style: ActionSheetButtonStyle.Cancel,
            },
          ],
        });

        if (result.index === 2) return; // Cancel selected

        const source = result.index === 0 ? CameraSource.Camera : CameraSource.Photos;

        // Get photo using Capacitor Camera
        const photo = await CapacitorCamera.getPhoto({
          resultType: CameraResultType.Uri,
          source: source,
          quality: 90,
          allowEditing: true,
          correctOrientation: true,
        });

        if (photo.path) {
          // Convert photo to file
          const response = await fetch(photo.path);
          const blob = await response.blob();
          const file = new File([blob], `photo_${Date.now()}.${photo.format || 'jpg'}`, {
            type: `image/${photo.format || 'jpeg'}`
          });

          await handleImageUpload(file);
        }
      } else {
        // Fallback to file input for web
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSend = () => {
    if (onSendMessage) {
      onSendMessage(message, imageUrl);
      setMessage('');
      setImageUrl('');
    }
  };

  return (
    <div className={className}>
      {imageUrl && (
        <div className="mb-3 relative">
          <img 
            src={imageUrl} 
            alt="Uploaded" 
            className="max-h-32 rounded-lg border"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => setImageUrl('')}
          >
            ×
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleImageSelection}
          disabled={uploading}
          className="min-h-[44px] min-w-[44px]"
        >
          <Camera className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() && !imageUrl}
          size="icon"
          className="min-h-[44px] min-w-[44px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};