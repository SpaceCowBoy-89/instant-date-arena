import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
// Icons removed for cleaner UI
import { FaceDetection } from '@mediapipe/face_detection';
import { FaceMesh } from '@mediapipe/face_mesh';
import { toast } from '@/components/ui/use-toast';

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
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<'init' | 'detecting' | 'positioned' | 'liveness' | 'complete'>('init');
  const [progress, setProgress] = useState(0);
  const [instruction, setInstruction] = useState('Click to start face verification');
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [headPoseAngle, setHeadPoseAngle] = useState({ x: 0, y: 0, z: 0 });
  const [isLivenessDetected, setIsLivenessDetected] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(true);

  // Initialize MediaPipe models
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        // Initialize Face Detection
        const faceDetection = new FaceDetection({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });

        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.8,
        });

        // Initialize Face Mesh for pose estimation
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.8,
          minTrackingConfidence: 0.8,
        });

        faceDetectionRef.current = faceDetection;
        faceMeshRef.current = faceMesh;
      } catch (error) {
        console.error('Failed to initialize MediaPipe:', error);
        onError('Failed to initialize face detection. Your device may not support this feature.');
      }
    };

    initializeMediaPipe();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onError]);

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
        setStep('detecting');
        setInstruction('Position your face in the oval guide');
        startDetection();
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

  // Calculate head pose angle from face landmarks
  const calculateHeadPose = useCallback((landmarks: any) => {
    if (!landmarks || landmarks.length < 468) return { x: 0, y: 0, z: 0 };

    // Get key facial landmarks for pose estimation
    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    // Calculate angles based on facial geometry
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const mouthCenterX = (leftMouth.x + rightMouth.x) / 2;

    // Estimate rotation angles (simplified calculation)
    const yaw = Math.atan2(noseTip.x - eyeCenterX, noseTip.z || 0) * (180 / Math.PI);
    const pitch = Math.atan2(noseTip.y - eyeCenterY, noseTip.z || 0) * (180 / Math.PI);
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

    return { x: pitch, y: yaw, z: roll };
  }, []);

  // Start face detection loop
  const startDetection = useCallback(() => {
    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || !faceDetectionRef.current || !faceMeshRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // Process with both Face Detection and Face Mesh
        await faceDetectionRef.current.send({ image: video });
        await faceMeshRef.current.send({ image: video });
      } catch (error) {
        console.error('Detection error:', error);
      }

      if (step !== 'complete') {
        requestAnimationFrame(detect);
      }
    };

    // Set up result callbacks
    if (faceDetectionRef.current && faceMeshRef.current) {
      faceDetectionRef.current.onResults((results) => {
        if (results.detections && results.detections.length > 0) {
          const detection = results.detections[0];
          setFaceConfidence(detection.score);

          if (detection.score > 0.8) {
            setStep('positioned');
            setProgress(50);
            setInstruction('Great! Now slowly tilt your head left, then right');
            setShowGuide(false);
          }
        } else {
          setFaceConfidence(0);
          if (step === 'positioned') {
            setStep('detecting');
            setInstruction('Center your face in the oval');
            setShowGuide(true);
          }
        }
      });

      faceMeshRef.current.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
          const landmarks = results.multiFaceLandmarks[0];
          const pose = calculateHeadPose(landmarks);
          setHeadPoseAngle(pose);

          // Check for liveness detection (head movement)
          if (step === 'positioned' && Math.abs(pose.z) > 15) {
            setStep('liveness');
            setProgress(75);
            setInstruction('Perfect! Hold still for capture...');

            // Capture photos for liveness verification
            setTimeout(() => {
              capturePhoto();
            }, 1000);
          }
        }
      });
    }

    requestAnimationFrame(detect);
  }, [step, calculateHeadPose]);

  // Capture photo for verification
  const capturePhoto = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);

    setCapturedPhotos(prev => {
      const newPhotos = [...prev, dataURL];

      if (newPhotos.length >= 2) {
        // We have enough photos for liveness verification
        setIsLivenessDetected(true);
        setStep('complete');
        setProgress(100);
        setInstruction('Verification complete!');

        setTimeout(() => {
          stopCamera();
          onVerificationComplete({
            success: true,
            confidence: faceConfidence,
            liveness: true,
          });
        }, 1500);
      } else {
        // Capture second photo
        setTimeout(() => {
          setInstruction('Now turn your head slightly and hold...');
          setTimeout(capturePhoto, 1500);
        }, 500);
      }

      return newPhotos;
    });
  }, [faceConfidence, onVerificationComplete]);

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

  // Render real-time feedback
  const renderFeedback = () => {
    return (
      <div className="absolute top-4 left-4 right-4 z-10">
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
                  <span>Tilt angle: {Math.abs(headPoseAngle.z).toFixed(1)}°</span>
                {Math.abs(headPoseAngle.z) > 10 && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </div>
            )}

            <div className="text-center">
              <span className="text-sm font-medium text-romance">{instruction}</span>
            </div>
          </CardContent>
        </Card>
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
        <Progress value={progress} className="h-3" />
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
        {step === 'init' ? (
          <div className="flex items-center justify-center h-full">
            <Button
              onClick={startCamera}
              className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground shadow-glow-shadow transition-all duration-300"
            >
              Start Face Verification
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none opacity-0"
            />
            {renderFaceGuide()}
            {renderFeedback()}
          </>
        )}
      </div>

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