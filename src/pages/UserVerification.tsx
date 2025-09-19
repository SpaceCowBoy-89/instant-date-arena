import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { UserVerification } from '@/components/UserVerification';
import MediaPipeVerification from '@/components/MediaPipeVerification';

interface UserVerificationPageProps {
  currentStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  onVerificationSubmitted: () => void;
}

const UserVerificationPage = ({ currentStatus, onVerificationSubmitted }: UserVerificationPageProps) => {
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>(currentStatus);
  const [showAIVerification, setShowAIVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user's current verification status
  useEffect(() => {
    const fetchUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('verification_status')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setUserStatus(userData.verification_status as 'unverified' | 'pending' | 'verified' | 'rejected' || 'unverified');
        }
      }
    };
    
    fetchUserStatus();
  }, []);

  const handleVerificationUpdate = () => {
    // Refresh user status after verification
    const fetchUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('verification_status')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setUserStatus(userData.verification_status as 'unverified' | 'pending' | 'verified' | 'rejected' || 'unverified');
        }
      }
    };
    
    fetchUserStatus();
    onVerificationSubmitted();
  };

  const handleAIVerification = async (result: { success: boolean; confidence: number; liveness: boolean }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to submit verification.",
          variant: "destructive",
        });
        return;
      }

      if (result.success) {
        // Submit AI verification
        const { error } = await supabase
          .from('user_verifications')
          .insert({
            user_id: user.id,
            verification_type: 'mediapipe_selfie',
            verification_data: { 
              confidence: result.confidence, 
              liveness: result.liveness,
              method: 'AI Face Detection'
            },
            status: 'approved' // AI verification can be auto-approved for high confidence
          });

        if (error) {
          console.error('Verification submission error:', error);
          toast({
            title: "Submission Failed", 
            description: "Failed to submit verification. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Update user verification status
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            verification_status: 'verified',
            verification_method: 'mediapipe_selfie',
            verification_approved_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('User status update error:', updateError);
        }

        toast({
          title: "Verification Successful",
          description: "Your identity has been verified using AI face detection!",
        });

        setUserStatus('verified');
        setShowAIVerification(false);
        handleVerificationUpdate();
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Face verification was not successful. Please ensure good lighting and face the camera directly, then try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('AI Verification error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during AI verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIVerificationError = (error: string) => {
    toast({
      title: "Verification Error",
      description: error,
      variant: "destructive",
    });
    setShowAIVerification(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--romance))/0.05] via-[hsl(var(--purple-accent))/0.05] to-[hsl(var(--background))]" style={{
      paddingBottom: '5rem'
    }}>
      <div className="mobile-container" style={{
        paddingTop: 'env(safe-area-inset-top)'
      }}>
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
            {/* Show AI Verification if active */}
            {showAIVerification ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAIVerification(false)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to verification options
                </Button>
                <MediaPipeVerification
                  onVerificationComplete={handleAIVerification}
                  onError={handleAIVerificationError}
                />
              </div>
            ) : (
              <>
                {/* Standard Verification Component */}
                <UserVerification
                  currentStatus={userStatus}
                  onVerificationSubmitted={handleVerificationUpdate}
                />

                {/* AI Verification Option */}
                {(userStatus === 'unverified' || userStatus === 'rejected') && (
                  <div className="border border-romance/20 rounded-lg p-6 space-y-4 bg-gradient-to-br from-purple-50/50 to-romance/5">
                    <div className="text-center space-y-3">
                      <div className="text-lg font-semibold text-foreground">
                        🤖 AI Face Verification
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Get instant verification using our advanced AI face detection technology. Simply look at your camera for a few seconds.
                      </div>
                      <Button
                        onClick={() => setShowAIVerification(true)}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-600 to-romance text-white hover:from-purple-700 hover:to-romance/90"
                      >
                        {loading ? "Processing..." : "Start AI Verification"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default UserVerificationPage;