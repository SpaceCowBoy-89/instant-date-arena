// UserVerification.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, CameraResultType } from '@capacitor/camera';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface'; // Should resolve after installation

// Initialize Supabase client with Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not configured. Check your .env file or Vite configuration.');
}

// Function to compute cosine similarity
const cosineSimilarity = (a: number[], b: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Image compression function
const compressImage = async (base64: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
    };
  });
};

interface UserVerificationProps {
  currentStatus: 'unverified' | 'pending' | 'verified';
  onVerificationSubmitted: () => void;
}

const UserVerification = ({ currentStatus, onVerificationSubmitted }: UserVerificationProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'selfie' | 'otp' | 'social' | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [faceModel, setFaceModel] = useState<tf.GraphModel | null>(null); // MobileFaceNet model
  const [detectionModel, setDetectionModel] = useState<blazeface.BlazeFaceModel | null>(null); // BlazeFace

  // Load models when 'selfie' method is selected
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      if (selectedMethod === 'selfie' && !faceModel && !detectionModel && isMounted) {
        setLoading(true);
        try {
          await tf.ready();
          await tf.setBackend('webgl'); // Optimize for mobile/web
          const loadedFaceModel = await tf.loadGraphModel('/assets/models/mobilefacenet/model.json');
          const loadedDetectionModel = await blazeface.load();
          if (isMounted) {
            setFaceModel(loadedFaceModel);
            setDetectionModel(loadedDetectionModel);
          }
        } catch (error) {
          console.error('Model loading error:', error);
          toast({ title: 'Error', description: 'Failed to load models. Ensure files are in /assets/models/mobilefacenet/.' });
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, [selectedMethod, faceModel, detectionModel]);

  if (currentStatus === 'verified') {
    return <Badge variant="success">Verified ✓</Badge>;
  }

  const handleSelfieVerification = async () => {
    if (!faceModel || !detectionModel) {
      toast({ title: 'Error', description: 'Models not loaded. Please select Selfie Verification again.' });
      return;
    }
    setLoading(true);
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
      });

      // Compress image
      const compressedBase64 = await compressImage(photo.base64String!);

      // Load image for detection
      const img = new Image();
      img.src = `data:image/jpeg;base64,${compressedBase64}`;
      await new Promise((resolve) => (img.onload = resolve));

      // Detect faces with BlazeFace
      const predictions = await detectionModel.estimateFaces(img, false);
      if (predictions.length === 0) {
        throw new Error('No face detected. Please try again with your face in frame.');
      } else if (predictions.length > 1) {
        throw new Error('Multiple faces detected. Ensure only one face is in the frame.');
      }

      // Crop to detected face
      const face = predictions[0];
      const topLeft = face.topLeft as [number, number];
      const bottomRight = face.bottomRight as [number, number];
      const padding = 20;
      const cropX = Math.max(0, topLeft[0] - padding);
      const cropY = Math.max(0, topLeft[1] - padding);
      const cropWidth = bottomRight[0] - topLeft[0] + 2 * padding;
      const cropHeight = bottomRight[1] - topLeft[1] + 2 * padding;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx?.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      // Resize to MobileFaceNet input (160x160)
      const resizeCanvas = document.createElement('canvas');
      resizeCanvas.width = 160; // MobileFaceNet expects 160x160
      resizeCanvas.height = 160;
      const resizeCtx = resizeCanvas.getContext('2d');
      resizeCtx?.drawImage(cropCanvas, 0, 0, 160, 160);

      // Prepare tensor
      let tensor = tf.browser.fromPixels(resizeCanvas).toFloat();
      tensor = tensor.div(127.5).sub(1); // Normalize to [-1, 1]
      tensor = tensor.expandDims(0); // Add batch dimension [1, 160, 160, 3]

      // Get embedding from MobileFaceNet
      const prediction = faceModel.predict(tensor) as tf.Tensor;
      const selfieEmbedding = Array.from(await prediction.data()) as number[];
      console.log('Selfie embedding shape:', prediction.shape); // Should be [1, 512]

      // Fetch profile embedding from Supabase
      const user = await supabase.auth.getUser();
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('face_embedding')
        .eq('user_id', user?.data.user?.id)
        .single();

      if (fetchError || !profileData?.face_embedding) {
        throw new Error('No profile embedding found.');
      }

      const profileEmbedding: number[] = profileData.face_embedding;
      if (profileEmbedding.length !== selfieEmbedding.length) {
        throw new Error('Embedding dimension mismatch.');
      }

      const similarity = cosineSimilarity(selfieEmbedding, profileEmbedding);
      console.log('Similarity score:', similarity); // Debug similarity score

      if (similarity > 0.4) { // Adjust threshold if needed
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ verification_status: 'verified' })
          .eq('user_id', user?.data.user?.id);

        if (updateError) throw updateError;

        toast({ title: 'Success', description: 'Selfie verified!' });
        onVerificationSubmitted();
      } else {
        toast({ title: 'Error', description: 'Face does not match profile photo.' });
      }
    } catch (error: any) {
      console.error('Selfie verification error:', error);
      toast({ title: 'Error', description: error.message || 'Selfie verification failed. Try again.' });
    } finally {
      setLoading(false);
      setSelectedMethod(null);
    }
  };

  // OTP and Social verification unchanged
  const handleOtpSend = async () => {
    setLoading(true);
    try {
      toast({ title: 'Info', description: 'OTP sent to your phone/email.' });
      // Implement OTP sending logic here
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'verified' })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Phone/Email verified!' });
      onVerificationSubmitted();
    } catch (error) {
      toast({ title: 'Error', description: 'Invalid OTP or verification failed.' });
    } finally {
      setLoading(false);
      setSelectedMethod(null);
    }
  };

  const handleSocialVerification = async () => {
    setLoading(true);
    try {
      toast({ title: 'Success', description: 'Social media verified!' });
      // Implement social media verification logic here
      onVerificationSubmitted();
    } catch (error) {
      toast({ title: 'Error', description: 'Social verification failed.' });
    } finally {
      setLoading(false);
      setSelectedMethod(null);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your Identity</CardTitle>
        <CardDescription>Choose a method to get a verified badge and better matches.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Button onClick={() => setSelectedMethod('selfie')} disabled={loading}>
            Selfie Verification
          </Button>
          <Button onClick={() => setSelectedMethod('otp')} disabled={loading}>
            Verify Phone/Email
          </Button>
          <Button onClick={() => setSelectedMethod('social')} disabled={loading}>
            Link Social Media
          </Button>
        </div>

        {selectedMethod === 'selfie' && (
          <div className="space-y-4">
            <p>Take a selfie to match with your profile photo.</p>
            <Button onClick={handleSelfieVerification} disabled={loading}>
              {loading ? 'Processing...' : 'Take Selfie'}
            </Button>
          </div>
        )}

        {selectedMethod === 'otp' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-email">Phone or Email</Label>
              <Input
                id="phone-email"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="Enter phone or email"
              />
            </div>
            <Button onClick={handleOtpSend} disabled={loading || !phoneOrEmail}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
            <div className="space-y-2">
              <Label htmlFor="otp-code">OTP Code</Label>
              <Input
                id="otp-code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP"
              />
            </div>
            <Button onClick={handleOtpVerify} disabled={loading || !otpCode}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </div>
        )}

        {selectedMethod === 'social' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="social-link">Social Media Link</Label>
              <Input
                id="social-link"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                placeholder="Enter social media URL"
              />
            </div>
            <Button onClick={handleSocialVerification} disabled={loading || !socialLink}>
              {loading ? 'Verifying...' : 'Verify Social'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserVerification;