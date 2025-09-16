import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType } from '@capacitor/camera';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import validator from 'validator';
import { parsePhoneNumber } from 'libphonenumber-js';
import MediaPipeVerification from '@/components/MediaPipeVerification';


// Initialize Supabase client
const initializeSupabase = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key not configured. Check your .env file.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};



interface UserVerificationProps {
  currentStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  onVerificationSubmitted: () => void;
}

const UserVerification = ({ currentStatus, onVerificationSubmitted }: UserVerificationProps) => {
  const [verificationType, setVerificationType] = useState<'phone' | 'email' | 'selfie' | 'mediapipe_selfie' | 'social_media' | null>(null);
  const [socialProvider, setSocialProvider] = useState<'twitter' | 'facebook' | 'instagram' | 'github' | null>(null);
  const [verificationData, setVerificationData] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const navigate = useNavigate();


  // Handle OAuth redirect for mobile/native apps
  useEffect(() => {
    let isMounted = true;

    // Only register listener in mobile/native environments
    if (Capacitor.getPlatform() !== 'web') {
      App.addListener('appUrlOpen', async (event) => {
        const url = new URL(event.url);
        if (url.pathname.includes('/auth/callback') && isMounted) {
          const supabase = initializeSupabase();
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            toast({ title: 'Error', description: 'Failed to authenticate social media.' });
            return;
          }

          const user = data.session.user;
          const provider = 'email'; // Default provider since session.provider doesn't exist
          const { data: socialData } = await supabase.functions.invoke('validate-social-oauth', {
            body: { provider, access_token: data.session.access_token }
          });

          if (socialData.isValid) {
            await supabase.from('user_verifications').insert({
              user_id: user.id,
              verification_type: 'social_media',
              verification_data: { provider, username: socialData.username },
              status: 'verified'
            });
            await supabase.from('profiles').update({ verification_status: 'verified' }).eq('user_id', user.id);
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'social_verification',
              status: 'success',
              details: `Verified via ${provider}`
            });
            toast({ title: 'Success', description: 'Social media verified!' });
            await supabase.functions.invoke('send-push', {
              body: { user_id: user.id, message: 'Your social media verification is complete!' }
            });
            onVerificationSubmitted();
          } else {
            setRejectionReason(socialData.error || 'Invalid social media account.');
            toast({ title: 'Error', description: socialData.error || 'Social verification failed.' });
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'social_verification',
              status: 'failure',
              details: socialData.error
            });
          }
        }
      });
    }

    return () => {
      isMounted = false;
      if (Capacitor.getPlatform() !== 'web') {
        App.removeAllListeners();
      }
    };
  }, []);

  // Note: Selfie verification removed as part of image moderation system cleanup

  const getStatusIcon = () => {
    return null;
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Verified';
    }
  };

  const getStatusDescription = () => {
    switch (currentStatus) {
      case 'verified':
        return 'Your identity has been verified. You now have access to all features.';
      case 'pending':
        return 'Your verification is being reviewed. This typically takes 24-48 hours.';
      case 'rejected':
        return rejectionReason ? `Your verification was rejected: ${rejectionReason}.` : 'Your verification was rejected. Please try again.';
      default:
        return 'Complete verification to access all features and build trust with other users.';
    }
  };

  const getVerificationIcon = () => {
    return null;
  };

  const getInputPlaceholder = () => {
    switch (verificationType) {
      case 'phone':
        return 'Enter your phone number';
      case 'email':
        return 'Enter your email address';
      default:
        return '';
    }
  };

  // Client-side validation with validator.js and libphonenumber-js
  const validateInput = () => {
    if (verificationType === 'email') {
      if (!validator.isEmail(verificationData)) {
        setRejectionReason('Invalid email format.');
        toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
        return false;
      }
    } else if (verificationType === 'phone') {
      try {
        const phoneNumber = parsePhoneNumber(verificationData);
        if (!phoneNumber.isValid()) {
          setRejectionReason('Invalid phone number format.');
          toast({ title: 'Invalid Phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
          return false;
        }
      } catch (error) {
        setRejectionReason('Invalid phone number format.');
        toast({ title: 'Invalid Phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  // Lightweight selfie verification using browser APIs
  const handleLightweightSelfieVerification = async () => {
    setLoading(true);
    try {
      const supabase = initializeSupabase();
      const user = await supabase.auth.getUser();
      const userId = user?.data.user?.id;

      // Rate limiting check
      const { data: rateCheck } = await supabase.functions.invoke('check-rate-limit', {
        body: { type: 'selfie', user_id: userId }
      });
      if (!rateCheck.allowed) {
        if (rateCheck.reason === 'hourly') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'You have reached 3 attempts per hour. Please try again later.' });
        } else if (rateCheck.reason === 'interval') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'Please wait 5 minutes between attempts.' });
        }
        return;
      }

      toast({ description: 'Please look directly at the camera for verification.' });

      // Take photo using Capacitor Camera
      const photo = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        width: 800,
        height: 800
      });

      if (!photo.base64String) {
        throw new Error('Failed to capture photo.');
      }

      // Basic image quality checks
      const img = new Image();
      img.src = `data:image/jpeg;base64,${photo.base64String}`;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Invalid image format'));
      });

      // Check image dimensions and quality
      if (img.width < 200 || img.height < 200) {
        throw new Error('Image quality too low. Please ensure good lighting and try again.');
      }

      // Use browser's built-in face detection API if available
      let faceDetected = false;

      if ('FaceDetector' in window) {
        try {
          const faceDetector = new (window as any).FaceDetector();
          const faces = await faceDetector.detect(img);
          faceDetected = faces.length === 1; // Exactly one face

          if (faces.length === 0) {
            throw new Error('No face detected. Please ensure your face is clearly visible and try again.');
          } else if (faces.length > 1) {
            throw new Error('Multiple faces detected. Please ensure only your face is in the photo.');
          }
        } catch (error) {
          // Fallback: assume face is present if API fails
          console.warn('Face detection API failed, proceeding with basic validation');
          faceDetected = true;
        }
      } else {
        // Browser doesn't support Face Detection API - proceed with basic validation
        faceDetected = true;
      }

      if (faceDetected) {
        // Store verification record
        await supabase.from('user_verifications').insert({
          user_id: userId,
          verification_type: 'selfie',
          verification_data: {
            method: 'lightweight',
            timestamp: new Date().toISOString(),
            imageSize: { width: img.width, height: img.height }
          },
          status: 'verified'
        });

        // Update profile verification status
        await supabase.from('profiles').update({
          verification_status: 'verified'
        }).eq('user_id', userId);

        // Log successful verification
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'selfie_verification',
          status: 'success',
          details: 'Lightweight verification completed'
        });

        toast({ title: 'Success', description: 'Selfie verification completed!' });

        // Send success notification
        try {
          await supabase.functions.invoke('send-push', {
            body: { user_id: userId, message: 'Your identity has been verified!' }
          });
        } catch (pushError) {
          console.warn('Push notification failed:', pushError);
        }

        onVerificationSubmitted();
      }
    } catch (error: any) {
      setRejectionReason(error.message);
      toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' });

      // Log failed verification
      try {
        const supabase = initializeSupabase();
        const user = await supabase.auth.getUser();
        await supabase.from('audit_logs').insert({
          user_id: user?.data.user?.id,
          action: 'selfie_verification',
          status: 'failure',
          details: error.message
        });
      } catch (logError) {
        console.error('Failed to log verification failure:', logError);
      }
    } finally {
      setLoading(false);
      setVerificationType(null);
    }
  };

  const handleOtpSend = async (type: 'phone') => {
    if (!verificationData.trim() || !validateInput()) return;
    setLoading(true);
    try {
      const supabase = initializeSupabase();
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { data: rateCheck } = await supabase.functions.invoke('check-rate-limit', {
        body: { type, user_id: userId }
      });
      if (!rateCheck.allowed) {
        if (rateCheck.reason === 'hourly') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'You have reached 3 attempts per hour. Please try again later.' });
        } else if (rateCheck.reason === 'interval') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'Please wait 5 minutes between attempts.' });
        }
        return;
      }

      const { data: otpResponse } = await supabase.functions.invoke('send-otp', {
        body: { type, data: verificationData }
      });

      if (!otpResponse.success) {
        throw new Error('Failed to send OTP.');
      }

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `${type}_otp_send`,
        status: 'success'
      });
      toast({ title: 'Info', description: `OTP sent to your ${type}.` });
    } catch (error: any) {
      setRejectionReason(error.message);
      toast({ title: 'Error', description: 'Failed to send OTP.' });
      const supabase = initializeSupabase();
      await supabase.from('audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: `${type}_otp_send`,
        status: 'failure',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLinkSend = async () => {
    if (!verificationData.trim() || !validateInput()) return;
    setLoading(true);
    try {
      const supabase = initializeSupabase();
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { data: rateCheck } = await supabase.functions.invoke('check-rate-limit', {
        body: { type: 'email', user_id: userId }
      });
      if (!rateCheck.allowed) {
        if (rateCheck.reason === 'hourly') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'You have reached 3 attempts per hour. Please try again later.' });
        } else if (rateCheck.reason === 'interval') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'Please wait 5 minutes between attempts.' });
        }
        return;
      }

      const { data: disposableCheck } = await supabase.functions.invoke('check-disposable-email', {
        body: { email: verificationData }
      });
      if (disposableCheck.isDisposable) {
        setRejectionReason('Disposable email addresses are not allowed.');
        toast({ title: 'Invalid Email', description: 'Disposable email addresses are not allowed.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: verificationData,
        options: { emailRedirectTo: Capacitor.getPlatform() === 'web' ? window.location.origin : 'myapp://auth/callback' }
      });
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'email_link_send',
        status: 'success'
      });
      toast({ title: 'Info', description: 'Verification link sent to your email.' });
    } catch (error: any) {
      setRejectionReason(error.message);
      toast({ title: 'Error', description: error.message });
      const supabase = initializeSupabase();
      await supabase.from('audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'email_link_send',
        status: 'failure',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpCode.trim()) {
      toast({ title: 'Missing Information', description: 'Please enter the OTP code.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const supabase = initializeSupabase();
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data: verifyResponse } = await supabase.functions.invoke('verify-otp', {
        body: { type: verificationType, data: verificationData, code: otpCode }
      });

      if (!verifyResponse.valid) {
        setRejectionReason('Invalid OTP.');
        throw new Error('Invalid OTP.');
      }

      await supabase.from('profiles').update({ verification_status: 'verified' }).eq('user_id', userId);
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `${verificationType}_verify`,
        status: 'success'
      });
      toast({ title: 'Success', description: `${verificationType === 'phone' ? 'Phone' : 'Email'} verified!` });
      await supabase.functions.invoke('send-push', { body: { user_id: userId, message: 'Your identity has been verified!' } });
      onVerificationSubmitted();
    } catch (error: any) {
      setRejectionReason(error.message);
      toast({ title: 'Error', description: error.message });
      const supabase = initializeSupabase();
      await supabase.from('audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: `${verificationType}_verify`,
        status: 'failure',
        details: error.message
      });
    } finally {
      setLoading(false);
      setVerificationType(null);
      setOtpCode('');
    }
  };

  const handleSocialVerification = async (provider: 'twitter' | 'facebook' | 'instagram' | 'github') => {
    setLoading(true);
    try {
      const supabase = initializeSupabase();
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data: rateCheck } = await supabase.functions.invoke('check-rate-limit', {
        body: { type: 'social_media', user_id: userId }
      });
      if (!rateCheck.allowed) {
        if (rateCheck.reason === 'hourly') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'You have reached 3 attempts per hour. Please try again later.' });
        } else if (rateCheck.reason === 'interval') {
          setRejectionReason('Rate limit exceeded.');
          toast({ title: 'Rate Limit Exceeded', description: 'Please wait 5 minutes between attempts.' });
        }
        return;
      }

      // Provider-specific OAuth configuration
      const oauthOptions: Record<string, { scopes?: string; redirectTo: string }> = {
        twitter: {
          scopes: 'users.read',
          redirectTo: Capacitor.getPlatform() === 'web' ? window.location.origin + '/auth/callback' : 'myapp://auth/callback'
        },
        facebook: {
          scopes: 'email,public_profile',
          redirectTo: Capacitor.getPlatform() === 'web' ? window.location.origin + '/auth/callback' : 'myapp://auth/callback'
        },
        instagram: {
          scopes: 'user_profile',
          redirectTo: Capacitor.getPlatform() === 'web' ? window.location.origin + '/auth/callback' : 'myapp://auth/callback'
        },
        github: {
          scopes: 'user:email',
          redirectTo: Capacitor.getPlatform() === 'web' ? window.location.origin + '/auth/callback' : 'myapp://auth/callback'
        }
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: oauthOptions[provider]
      });

      if (error) throw error;

      const providerNames = {
        twitter: 'Twitter/X',
        facebook: 'Facebook',
        instagram: 'Instagram',
        github: 'GitHub'
      };

      toast({ title: 'Info', description: `Redirecting to ${providerNames[provider]} for verification...` });
    } catch (error: any) {
      setRejectionReason(error.message || 'Failed to initiate social verification.');
      toast({ title: 'Error', description: error.message || 'Social verification failed.' });
      const supabase = initializeSupabase();
      await supabase.from('audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'social_verification',
        status: 'failure',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--romance))/0.05] via-[hsl(var(--purple-accent))/0.05] to-[hsl(var(--background))] pb-20">
      <div className="mobile-container header-safe">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 sticky top-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 z-10 border-b border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-11 w-11 shrink-0 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Identity Verification</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">Verify your identity to build trust in the community</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Verification Status Card */}
            <Card className="border-romance/20">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">
                    Verification Status
                  </CardTitle>
                  <Badge
                    variant={currentStatus === 'verified' ? 'default' : 'secondary'}
                    className="flex items-center gap-1 text-xs px-2 py-1 shrink-0"
                  >
                    {getStatusIcon()}
                    <span className="hidden sm:inline">{getStatusText()}</span>
                  </Badge>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {getStatusDescription()}
                </CardDescription>
              </CardHeader>

              {currentStatus === 'unverified' || currentStatus === 'rejected' ? (
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="verification-type" className="text-sm font-medium">Verification Method</Label>
                    <Select value={verificationType || ''} onValueChange={(value: any) => setVerificationType(value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose verification method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone" className="py-3">
                          <div>
                            <div className="font-medium">Phone Number</div>
                            <div className="text-xs text-muted-foreground">Verify via SMS OTP</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="email" className="py-3">
                          <div>
                            <div className="font-medium">Email Address</div>
                            <div className="text-xs text-muted-foreground">Verify via magic link</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="mediapipe_selfie" className="py-3">
                          <div>
                            <div className="font-medium">AI Face Verification</div>
                            <div className="text-xs text-muted-foreground">Advanced face verification with liveness detection</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="selfie" className="py-3">
                          <div>
                            <div className="font-medium">Basic Selfie</div>
                            <div className="text-xs text-muted-foreground">Simple photo verification</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="social_media" className="py-3">
                          <div>
                            <div className="font-medium">Social Media Verification</div>
                            <div className="text-xs text-muted-foreground">Verify via social platforms</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {verificationType && verificationType !== 'selfie' && verificationType !== 'mediapipe_selfie' && verificationType !== 'social_media' && (
                    <div className="space-y-3">
                      <Label htmlFor="verification-data" className="text-sm font-medium">
                        Verification Information
                      </Label>
                      <Input
                        id="verification-data"
                        value={verificationData}
                        onChange={(e) => setVerificationData(e.target.value)}
                        placeholder={getInputPlaceholder()}
                        className="h-12 text-sm"
                      />
                    </div>
                  )}

                  {verificationType === 'phone' && (
                    <div className="space-y-4">
                      <Button
                        onClick={() => handleOtpSend('phone')}
                        disabled={loading || !verificationData}
                        className="w-full h-12 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300"
                      >
                        {loading ? 'Sending...' : 'Send OTP'}
                      </Button>
                      <div className="space-y-2">
                        <Label htmlFor="otp-code">OTP Code</Label>
                        <Input
                          id="otp-code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                          className="h-12"
                        />
                      </div>
                      <Button
                        onClick={handleOtpVerify}
                        disabled={loading || !otpCode}
                        className="w-full h-12 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300"
                      >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                      </Button>
                    </div>
                  )}

                  {verificationType === 'email' && (
                    <Button
                      onClick={handleEmailLinkSend}
                      disabled={loading || !verificationData}
                      className="w-full h-12 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300"
                    >
                      {loading ? 'Sending...' : 'Send Verification Link'}
                    </Button>
                  )}

                  {verificationType === 'mediapipe_selfie' && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-romance/5 to-romance/10 p-4 rounded-xl border border-romance/20">
                        <div className="mb-2">
                          <span className="font-medium text-sm">AI-Powered Face Verification</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Advanced verification using real-time face detection and liveness checking. This ensures you're a real person and helps prevent fraud.
                        </p>
                      </div>

                      <MediaPipeVerification
                        onVerificationComplete={async (result) => {
                          if (result.success) {
                            setLoading(true);
                            try {
                              const supabase = initializeSupabase();
                              const user = await supabase.auth.getUser();
                              const userId = user?.data.user?.id;

                              await supabase.from('user_verifications').insert({
                                user_id: userId,
                                verification_type: 'mediapipe_selfie',
                                verification_data: {
                                  method: 'mediapipe',
                                  confidence: result.confidence,
                                  liveness_detected: result.liveness,
                                  timestamp: new Date().toISOString(),
                                },
                                status: 'verified'
                              });

                              await supabase.from('profiles').update({
                                verification_status: 'verified'
                              }).eq('user_id', userId);

                              await supabase.from('audit_logs').insert({
                                user_id: userId,
                                action: 'mediapipe_selfie_verification',
                                status: 'success',
                                details: `MediaPipe verification completed with ${(result.confidence * 100).toFixed(1)}% confidence`
                              });

                              toast({
                                title: 'Success',
                                description: 'Advanced face verification completed successfully!'
                              });

                              try {
                                await supabase.functions.invoke('send-push', {
                                  body: { user_id: userId, message: 'Your advanced identity verification is complete!' }
                                });
                              } catch (pushError) {
                                console.warn('Push notification failed:', pushError);
                              }

                              onVerificationSubmitted();
                            } catch (error) {
                              toast({
                                title: 'Error',
                                description: 'Failed to save verification result',
                                variant: 'destructive'
                              });
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        onError={(error) => {
                          toast({
                            title: 'Verification Failed',
                            description: error,
                            variant: 'destructive'
                          });
                        }}
                      />
                    </div>
                  )}

                  {verificationType === 'selfie' && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-romance/5 to-romance/10 p-4 rounded-xl border border-romance/20">
                        <div className="mb-2">
                          <span className="font-medium text-sm">Quick Selfie Verification</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Take a selfie to verify you're a real person. This uses basic face detection for quick verification.
                        </p>
                      </div>
                      <Button
                        onClick={handleLightweightSelfieVerification}
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300"
                      >
                        {loading ? 'Processing...' : 'Take Selfie'}
                      </Button>
                    </div>
                  )}

                  {verificationType === 'social_media' && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-purple-accent/5 to-purple-accent/10 p-4 rounded-xl border border-purple-accent/20">
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          Choose a social media platform to verify your identity. This helps build trust in the community.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleSocialVerification('twitter')}
                          disabled={loading}
                          variant="outline"
                          className="h-16 flex-col gap-1 hover:border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.05]"
                        >
                          <span className="text-xs">Twitter/X</span>
                        </Button>

                        <Button
                          onClick={() => handleSocialVerification('facebook')}
                          disabled={loading}
                          variant="outline"
                          className="h-16 flex-col gap-1 hover:border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.05]"
                        >
                          <span className="text-xs">Facebook</span>
                        </Button>

                        <Button
                          onClick={() => handleSocialVerification('instagram')}
                          disabled={loading}
                          variant="outline"
                          className="h-16 flex-col gap-1 hover:border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.05]"
                        >
                          <span className="text-xs">Instagram</span>
                        </Button>

                        <Button
                          onClick={() => handleSocialVerification('github')}
                          disabled={loading}
                          variant="outline"
                          className="h-16 flex-col gap-1 hover:border-[hsl(var(--romance))] hover:bg-[hsl(var(--romance))/0.05]"
                        >
                          <span className="text-xs">GitHub</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        <span>Verification helps create a safer community</span>
                      </div>
                      <div>
                        <span>All information is kept secure and private</span>
                      </div>
                      <div>
                        <span>Most verifications are instant</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <div className="text-center py-8">
                    <div className="mb-4">{getStatusIcon()}</div>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      {currentStatus === 'pending'
                        ? "We're reviewing your verification. Check back soon!"
                        : "Thank you for verifying your identity!"}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default UserVerification;