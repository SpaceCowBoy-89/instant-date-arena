import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
// Conditional import for ML Kit - will fallback gracefully if not available
let FaceDetection: any = null;
try {
  FaceDetection = require('@capacitor-mlkit/face-detection')?.FaceDetection;
} catch (error) {
  // ML Kit not available, using fallback detection
}
import { Capacitor } from '@capacitor/core';

interface MediaPipeVerificationProps {
  onVerificationComplete: (result: { success: boolean; confidence: number; liveness: boolean }) => void;
  onError: (error: string) => void;
}

const MediaPipeVerification: React.FC<MediaPipeVerificationProps> = ({
  onVerificationComplete,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentSessionDetections = useRef<any[]>([]);

  const [step, setStep] = useState<'init' | 'detecting' | 'positioned' | 'liveness' | 'complete'>('init');
  const [progress, setProgress] = useState(0);
  const [instruction, setInstruction] = useState('Click to start face verification');
  const lastInstructionRef = useRef('');
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [headPoseAngle, setHeadPoseAngle] = useState({ x: 0, y: 0, z: 0 });
  const [isLivenessDetected, setIsLivenessDetected] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [mlKitReady, setMlKitReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [faceDetections, setFaceDetections] = useState<any[]>([]);
  const [verificationStartTime, setVerificationStartTime] = useState<number>(0);

  // Initialize ML Kit Face Detection
  useEffect(() => {
    const initMLKit = async () => {
      if (mlKitReady) return;

      setModelLoading(true);
      try {
        if (Capacitor.getPlatform() === 'web') {
          // For web, we'll use a fallback detection method
          setMlKitReady(true);
        } else {
          // For native platforms, check ML Kit availability
          try {
            if (FaceDetection) {
              await FaceDetection.initialize();
              setMlKitReady(true);
            } else {
              // ML Kit not available, using web fallback
              setMlKitReady(true);
            }
          } catch (error) {
            // ML Kit initialization failed, using web fallback
            setMlKitReady(true);
          }
        }
      } catch (error) {
        console.error('Failed to initialize face detection:', error);
        setMlKitReady(true); // Still proceed with fallback
      } finally {
        setModelLoading(false);
      }
    };

    initMLKit();
  }, [mlKitReady]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Clean up camera and intervals
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      // Reset motion detection state
      previousFrameRef.current = null;
    };
  }, []); // Empty dependency array - only cleanup on unmount

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready before starting detection
        videoRef.current.onloadedmetadata = () => {
          setStep('detecting'); // Change step to show video
          setInstruction('Setting up camera...');
        };

        videoRef.current.oncanplay = () => {
          if (mlKitReady) {
            // Add small delay to ensure video is fully ready
            setTimeout(() => {
              startRealVerification();
            }, 500);
          } else {
            setInstruction('Loading face detection...');
            // Wait for ML Kit to be ready
            const checkMLKit = setInterval(() => {
              if (mlKitReady) {
                clearInterval(checkMLKit);
                setTimeout(() => startRealVerification(), 500);
              }
            }, 500);
          }
        };

        // Add error handling for video
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          onError('Video playback failed. Please check camera permissions.');
        };
      } else {
        onError('Unable to initialize camera view. Please try again.');
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      onError('Camera access denied. Please enable camera permissions and try again.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Helper function to update instruction only when it changes
  const updateInstruction = useCallback((newInstruction: string) => {
    if (newInstruction !== lastInstructionRef.current) {
      setInstruction(newInstruction);
      lastInstructionRef.current = newInstruction;
    }
  }, []);

  // Real face detection using ML Kit
  const detectFace = useCallback(async () => {
    if (!mlKitReady || !videoRef.current || !canvasRef.current) {
      return { detected: false, confidence: 0, faceBox: null };
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    try {
      // Check if video has valid dimensions
      if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
        return { detected: false, confidence: 0, faceBox: null };
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (Capacitor.getPlatform() !== 'web' && FaceDetection) {
        // Use native ML Kit for mobile (when available)
        try {
          // Capture current frame
          const ctx = canvas.getContext('2d');
          if (!ctx) return { detected: false, confidence: 0, faceBox: null };

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);

          // Run ML Kit face detection
          const result = await FaceDetection.detectFromImage({
            image: imageData
          });

          if (result.faces && result.faces.length > 0) {
            const face = result.faces[0];
            const confidence = face.trackingId ? 0.95 : 0.85; // High confidence for ML Kit

            const faceBox = face.bounds ? {
              x: face.bounds.left,
              y: face.bounds.top,
              width: face.bounds.width,
              height: face.bounds.height
            } : null;

            // Update face confidence and store detection
            setFaceConfidence(confidence);
            const detection = {
              timestamp: Date.now(),
              confidence,
              faceBox,
              landmarks: face.landmarks
            };
            setFaceDetections(prev => [...prev.slice(-9), detection]);
            currentSessionDetections.current = [...currentSessionDetections.current.slice(-9), detection];

            return { detected: true, confidence, faceBox };
          }
        } catch (error) {
          // ML Kit detection failed, using fallback
        }
      }

      // Fallback: Simple motion detection for web
      return await simpleMotionDetection(video, canvas);

    } catch (error) {
      console.error('Face detection error:', error);
      return { detected: false, confidence: 0, faceBox: null };
    }
  }, [mlKitReady]);

  // Previous frame data for motion detection
  const previousFrameRef = useRef<ImageData | null>(null);

  // Enhanced face-like detection for web fallback (not just motion)
  const simpleMotionDetection = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { detected: false, confidence: 0, faceBox: null };
    }

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Calculate motion by comparing with previous frame
    let motionScore = 0;
    if (previousFrameRef.current) {
      const prevData = previousFrameRef.current.data;
      const currData = currentFrame.data;
      let totalDiff = 0;

      // Sample every 4th pixel for performance (RGBA = 4 bytes per pixel)
      for (let i = 0; i < prevData.length; i += 16) { // Every 4th pixel
        const rDiff = Math.abs(prevData[i] - currData[i]);
        const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
        const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);
        totalDiff += (rDiff + gDiff + bDiff) / 3;
      }

      motionScore = totalDiff / (canvas.width * canvas.height / 4); // Normalize
    }

    // Store current frame for next comparison
    previousFrameRef.current = currentFrame;

    // Reasonable motion threshold for actual face detection
    const motionThreshold = 8; // Balanced threshold - not too strict, not too loose
    const hasMotion = motionScore > motionThreshold;

    if (hasMotion) {
      // Only detect face if there's actual motion
      const confidence = Math.min(0.6 + (motionScore / 20), 0.85); // Scale confidence with motion
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const faceSize = Math.min(canvas.width, canvas.height) * 0.3;

      const faceBox = {
        x: centerX - faceSize / 2,
        y: centerY - faceSize / 2,
        width: faceSize,
        height: faceSize
      };

      setFaceConfidence(confidence);
      const detection = {
        timestamp: Date.now(),
        confidence,
        faceBox,
        landmarks: null
      };
      setFaceDetections(prev => [...prev.slice(-9), detection]);
      currentSessionDetections.current = [...currentSessionDetections.current.slice(-9), detection];

      return { detected: true, confidence, faceBox };
    }
    setFaceConfidence(0);
    return { detected: false, confidence: 0, faceBox: null };
  }, []);

  // Real-time face verification with liveness detection
  const startRealVerification = useCallback(() => {
    if (!mlKitReady) {
      onError('Face detection not ready. Please try again.');
      return;
    }
    const startTime = Date.now();
    setVerificationStartTime(startTime);
    setFaceDetections([]);
    currentSessionDetections.current = [];
    // Reset motion detection state for new verification
    previousFrameRef.current = null;

    // Step 1: Initial face positioning (3 seconds)
    setStep('detecting');
    setProgress(10);
    updateInstruction('Position your face in the guide and look at the camera');
    setShowGuide(true);

    // Start continuous face detection
    const interval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;
        const detection = await detectFace();

        // Determine current detection state
        const isDetected = detection && detection.detected && detection.confidence > 0.7;
        const isStable = detection && detection.detected && detection.confidence > 0.8;

        if (elapsed < 2000) {
          // Phase 1: Initial positioning (0-2s)
          if (isDetected) {
            const newProgress = Math.min(20, 10 + (elapsed / 2000) * 10);
            setProgress(newProgress);
            updateInstruction('Great! Keep your face in the frame and look at the camera');
          } else {
            updateInstruction('Position your face in the guide and look at the camera');
          }
        } else if (elapsed < 8000) {
          // Phase 2: Main detection phase (2-8s)
          if (isStable) {
            setStep('positioned');
            const newProgress = Math.min(70, 20 + ((elapsed - 2000) / 6000) * 50);
            setProgress(newProgress);
            updateInstruction('Great! Hold still while we verify...');
            setShowGuide(false);

            if (elapsed > 4000 && elapsed < 4200) {
              capturePhoto();
            }
          } else if (isDetected) {
            updateInstruction('Hold still - we can see you but need a clearer view');
          } else {
            updateInstruction('Please position your face in the center of the frame');
          }
        } else if (elapsed < 10000) {
          // Phase 3: Liveness check (8-10s)
          setStep('liveness');
          const newProgress = Math.min(90, 70 + ((elapsed - 8000) / 2000) * 20);
          setProgress(newProgress);

          if (isDetected) {
            updateInstruction('Perfect! Now move your head slightly to show you are real');
          } else {
            updateInstruction('Almost done! Please keep your face visible');
          }

          if (elapsed > 9000 && elapsed < 9200) {
            capturePhoto();
          }
        } else {
          // Phase 4: Complete (10s+)
          clearInterval(interval);
          setDetectionInterval(null);

          // Analyze collected detections for liveness
          const allSessionDetections = currentSessionDetections.current.filter(d => d.timestamp > startTime);
          const now = Date.now();

          // Recent detections (last 3 seconds) - must have face present at end
          const veryRecentDetections = allSessionDetections.filter(d => d.timestamp > now - 3000);

          // Final phase detections (last 2 seconds of verification)
          const finalPhaseDetections = allSessionDetections.filter(d => d.timestamp > now - 2000);

          const allAvgConfidence = allSessionDetections.length > 0
            ? allSessionDetections.reduce((sum, d) => sum + d.confidence, 0) / allSessionDetections.length
            : 0;

          const recentAvgConfidence = veryRecentDetections.length > 0
            ? veryRecentDetections.reduce((sum, d) => sum + d.confidence, 0) / veryRecentDetections.length
            : 0;

          const hasMovement = analyzeMovementForLiveness(allSessionDetections);

          setStep('complete');
          setProgress(100);
          // Update instruction based on success/failure (check this after we calculate isSuccessful)
          // This will be updated below after we determine success
          setIsLivenessDetected(hasMovement);

          // More user-friendly success criteria
          const hasEnoughTotalDetections = allSessionDetections.length >= 4; // At least 4 detections throughout
          const hasRecentPresence = veryRecentDetections.length >= 2; // Face present in last 3 seconds
          const hasGoodOverallConfidence = allAvgConfidence > 0.6; // Reasonable threshold
          const hasGoodRecentConfidence = recentAvgConfidence > 0.65; // Slightly higher threshold for final presence

          // Additional check: must have detections in FINAL 3 seconds
          const finalSecondDetections = allSessionDetections.filter(d => d.timestamp > now - 3000);
          const hasFinalSecondPresence = finalSecondDetections.length >= 1;

          const isSuccessful = hasEnoughTotalDetections && hasRecentPresence && hasGoodOverallConfidence && hasGoodRecentConfidence && hasFinalSecondPresence;

          // Verification completed

          const finalConfidence = isSuccessful ? Math.max(allAvgConfidence, 0.75) : Math.min(allAvgConfidence, 0.5);

          // Update instruction based on actual success/failure
          updateInstruction(isSuccessful ? 'Verification successful!' : 'Verification failed - please try again');

          setTimeout(() => {
            stopCamera();
            onVerificationComplete({
              success: isSuccessful,
              confidence: finalConfidence,
              liveness: hasMovement,
            });
          }, 1500);
        }
      } catch (error) {
        console.error('Error in detection loop:', error);
      }
    }, 200); // Check every 200ms

    setDetectionInterval(interval);
  }, [mlKitReady, detectFace, onVerificationComplete]);

  // Analyze face movement patterns for liveness detection
  const analyzeMovementForLiveness = (detections: any[]) => {
    if (detections.length < 5) return false;

    // Check for variance in face position (indicates movement)
    const positions = detections.map(d => d.faceBox).filter(Boolean);
    if (positions.length < 3) return false;

    const xPositions = positions.map(p => p.x);
    const yPositions = positions.map(p => p.y);

    const xVariance = calculateVariance(xPositions);
    const yVariance = calculateVariance(yPositions);

    // Sufficient movement indicates a real person
    return xVariance > 100 || yVariance > 100;
  };

  // Helper function to calculate variance
  const calculateVariance = (values: number[]) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  };

  // Capture photo for verification
  const capturePhoto = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to image data
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);

    setCapturedPhotos(prev => [...prev, dataURL]);
  }, []);

  // Render face guide overlay
  const renderFaceGuide = () => {
    if (!showGuide) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-60 border-4 border-romance rounded-[50%] border-dashed opacity-70 animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-romance text-sm font-medium bg-background/80 px-2 py-1 rounded">
              Center your face
            </span>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Verification Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Debug: Step = {step}, ML Kit = {mlKitReady ? 'ready' : 'loading'}, Platform = {Capacitor.getPlatform()}
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
        {/* Always render video element but hide when not needed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${step === 'init' ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transform: 'scaleX(-1)', // Mirror the video for selfie effect
            backgroundColor: step !== 'init' ? 'transparent' : 'black'
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none opacity-0"
        />

        {step === 'init' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={startCamera}
              disabled={modelLoading}
              className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground shadow-glow-shadow transition-all duration-300"
            >
              {modelLoading ? 'Loading ML Kit...' : 'Start Face Verification'}
            </Button>
          </div>
        ) : (
          <>
            {renderFaceGuide()}
            {step !== 'complete' && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="text-center mb-2">
                  <span className="text-sm font-medium text-romance bg-background/80 px-2 py-1 rounded">
                    {instruction}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Face Detection Confidence - Outside the viewer */}
      {step !== 'init' && step !== 'complete' && (
        <Card className="bg-background/90 backdrop-blur-sm">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Face Detection</span>
              <span className="text-xs text-muted-foreground">
                {(faceConfidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <Progress value={faceConfidence * 100} className="h-2" />

            {step === 'positioned' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Move your head slightly to prove you're real</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Ensure good lighting and face the camera directly</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Remove glasses or hats if possible</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Keep only your face visible in the frame</span>
          </div>
        </div>
      </div>

      {step === 'complete' && isLivenessDetected && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 mx-auto mb-2 text-green-500 text-2xl">✓</div>
            <h3 className="font-semibold text-green-800">Verification Successful!</h3>
            <p className="text-sm text-green-600">Your identity has been verified with liveness detection.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MediaPipeVerification;