import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Preferences } from '@capacitor/preferences';
import { useToast } from '@/hooks/use-toast';
import { Heart, User, Globe, Star } from 'lucide-react';
import Confetti from 'react-confetti';

interface OnboardingProps {
  userId: string;
  setShowChatbot: (show: boolean) => void;
}

const FeaturePreviewModal = ({ isOpen, onClose, feature, chatbotNudge, onExplore }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discover {feature.title}</DialogTitle>
          <DialogDescription>
            <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            <p className="mt-2 italic text-pink-500">{chatbotNudge}</p>
          </DialogDescription>
        </DialogHeader>
        {/* Optional: Add a screenshot or icon preview of the feature */}
        <div className="flex justify-center my-4">
          <feature.icon className="h-12 w-12 text-pink-500" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Skip</Button>
          <Button onClick={onExplore}>Explore Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Onboarding: React.FC<OnboardingProps> = ({ userId, setShowChatbot }) => {
  const [step, setStep] = useState(1);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [previewFeature, setPreviewFeature] = useState(null); // State for modal
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkProgress = async () => {
      // ... (keep the original progress check logic unchanged)
    };
    checkProgress();
  }, [userId, navigate, toast]);

  const handleNext = async () => {
    if (step === 1) {
      const { data: profile } = await supabase
        .from('users')
        .select('photos, age, gender, location, preferences')
        .eq('id', userId)
        .maybeSingle();
      if (
        !profile ||
        !profile.photos?.length ||
        !profile.age ||
        !profile.gender ||
        !profile.location ||
        !profile.preferences?.interests?.length
      ) {
        toast({
          title: 'Incomplete Profile',
          description: 'Please complete your profile with a photo, age, gender, location, and at least one interest.',
          variant: 'destructive',
        });
        setShowChatbot(true);
        return;
      }
      setProfileCompleted(true);
      setStep(2);
      // Show preview modal instead of navigate
      setPreviewFeature({
        title: 'Communities & AI Quiz',
        description: 'Take the AI Quiz to discover your vibe and join a fun community!',
        icon: Globe,
        nudge: 'Ready to spark some magic? Let’s find your perfect crew! 🚀',
        path: '/communities',
      });
      setShowChatbot(true);
    } else if (step === 2) {
      const { value } = await Preferences.get({ key: `user_progress_${userId}` });
      const progress = value ? JSON.parse(value) : { quizCompleted: 0 };
      if (progress.quizCompleted < 1) {
        toast({
          title: 'Quiz Not Completed',
          description: 'Please complete the AI Quiz first.',
          variant: 'destructive',
        });
        setShowChatbot(true);
        return;
      }
      setQuizCompleted(true);
      setStep(3);
      // Show preview modal for Date/Compatibility Test
      setPreviewFeature({
        title: 'Date & Compatibility Test',
        description: 'Take the Compatibility Test to find your perfect match!',
        icon: Heart,
        nudge: 'Let’s uncover your soulmate potential! 💖',
        path: '/date',
      });
      setShowChatbot(true);
    } else if (step === 3) {
      setStep(4);
      // Show preview modal for Matches/Speed Dating
      setPreviewFeature({
        title: 'Matches & Speed Dating',
        description: 'Check out potential matches or jump into speed dating!',
        icon: Star,
        nudge: 'Who’s caught your eye? Let’s get connecting! 😎',
        path: '/matches', // Or '/lobby' as primary
      });
      setShowChatbot(true);
    } else if (step === 4) {
      await Preferences.set({ key: `onboarding_${userId}`, value: 'completed' });
      setShowSuccessModal(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const handleExplore = (path) => {
    setPreviewFeature(null);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900 dark:to-purple-900 p-6 flex flex-col justify-center items-center">
      {showConfetti && <Confetti />}
      <Card className="w-full max-w-md bg-white/80 dark:bg-black/30 backdrop-blur-sm shadow-xl rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">Welcome to SpeedHeart!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={(step / 4) * 100} className="w-full" />

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold">Step 1: Complete Your Profile</h2>
              <p className="text-gray-600 dark:text-gray-300">Add a photo, your details, and interests to shine! 💖</p>
              <Button
                onClick={() => {
                  navigate('/profile');
                  setShowChatbot(true);
                }}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white relative overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-[-100%] after:w-full after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:left-0"
              >
                Go to Profile
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold">Step 2: Discover Your Vibe</h2>
              <p className="text-gray-600 dark:text-gray-300">Take the AI Quiz to find a fun group to join! 🚀</p>
              <Button
                onClick={() => handleNext()}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white relative overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-[-100%] after:w-full after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:left-0"
              >
                Take AI Quiz
              </Button>
            </>
          )}
          {step === 3 && communityName && (
            <>
              <h2 className="text-lg font-semibold">Step 3: You’ve Joined a Community!</h2>
              <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2 justify-center">
                <Heart className="h-5 w-5 text-red-500 animate-bounce" aria-hidden="true" />
                Congrats! You’ve joined the <strong>{communityName}</strong> crew! 🎉 Ready to find your perfect match?
              </p>
              <Button
                onClick={handleNext}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white relative overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-[-100%] after:w-full after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:left-0"
              >
                Continue to Compatibility Test
              </Button>
            </>
          )}
          {step === 3 && !communityName && (
            <>
              <h2 className="text-lg font-semibold">Step 3: Find Your Match</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Take the Compatibility Test to discover potential matches. You’re almost ready to meet someone special!
              </p>
              <Button
                onClick={handleNext}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white relative overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-[-100%] after:w-full after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:left-0"
              >
                Take Compatibility Test
              </Button>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-lg font-semibold">Step 4: Start Connecting!</h2>
              <p className="text-gray-600 dark:text-gray-300">
                You’re all set! Check out <strong>Meet your Matches</strong> to see who’s waiting for you, or jump into <strong>Go Speed Dating</strong> for instant connections!
              </p>
              <Button
                onClick={() => handleExplore('/matches')}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white relative overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-[-100%] after:w-full after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:left-0"
              >
                Meet Your Matches
              </Button>
              <Button
                onClick={() => handleExplore('/lobby')}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white relative overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-[-100%] after:w-full after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:left-0"
              >
                Go Speed Dating
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setShowChatbot(true)}
            className="w-full mt-4 border-pink-500 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900"
            aria-label="Open help chatbot"
          >
            Need help? Click here!
          </Button>
        </CardContent>
      </Card>

      {previewFeature && (
        <FeaturePreviewModal
          isOpen={!!previewFeature}
          onClose={() => setPreviewFeature(null)}
          feature={{ title: previewFeature.title, description: previewFeature.description, icon: previewFeature.icon }}
          chatbotNudge={previewFeature.nudge}
          onExplore={() => handleExplore(previewFeature.path)}
        />
      )}

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Congratulations! 🎉</DialogTitle>
            <DialogDescription>
              You've completed onboarding! Unlock your first match boost and start connecting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => { setShowSuccessModal(false); navigate('/lobby'); }} className="bg-pink-500 hover:bg-pink-600 text-white">
              Get Started
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Onboarding;