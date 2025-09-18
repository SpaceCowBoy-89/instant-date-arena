import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, Step } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTourProps {
  userId: string;
  isRunning: boolean;
  onTourComplete: () => void;
  onTourSkip: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  userId,
  isRunning,
  onTourComplete,
  onTourSkip
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Dynamic steps based on current page and progress
  useEffect(() => {
    const generateSteps = () => {
      const baseSteps: Step[] = [
        // Onboarding page steps
        {
          target: '.step-onboarding-progress',
          content: 'Welcome to SpeedHeart! This progress bar shows your onboarding journey. Let\'s get you set up! 🚀',
          placement: 'bottom',
          disableBeacon: true,
          showProgress: true,
        },
        {
          target: '.step-profile-button',
          content: 'First, let\'s complete your profile! Add your photo, details, and interests to attract great matches. 💖',
          placement: 'top',
          showProgress: true,
        },

        // Profile completion steps
        {
          target: '.step-profile-photo',
          content: 'Upload your best photo here! This helps others see the real you. 📸',
          placement: 'bottom',
          showProgress: true,
        },
        {
          target: '.step-profile-details',
          content: 'Fill in your gender, age, and location details. This helps us find compatible matches nearby! 👤',
          placement: 'top',
          showProgress: true,
        },
        {
          target: '.step-profile-interests',
          content: 'Select your interests to find like-minded people. The more you add, the better matches we can find! ✨',
          placement: 'top',
          showProgress: true,
        },
        {
          target: '.step-profile-save',
          content: 'Don\'t forget to save your changes! Your profile is your dating passport. 💫',
          placement: 'top',
          showProgress: true,
        },

        // Communities page steps
        {
          target: '.step-communities-explore',
          content: 'Click "Explore Communities" to view all the communities we offer! Discover groups that match your interests. 🚀',
          placement: 'bottom',
          showProgress: true,
        },
        {
          target: '.step-quiz-button',
          content: 'Click "AI Quiz" to be assigned to a specific community that perfectly matches your personality! 🧠✨',
          placement: 'bottom',
          showProgress: true,
        },

        // Date page steps
        {
          target: '.step-compatibility-test',
          content: 'Click "Take Compatibility Test" to find compatible matches based on personality and values! 💖',
          placement: 'bottom',
          showProgress: true,
        },
        {
          target: '.step-speed-dating',
          content: 'Click "Start Speed Dating" to find quick dates and instant connections! ⚡',
          placement: 'top',
          showProgress: true,
        },

        // Final step
        {
          target: '.step-navbar',
          content: 'You\'re all set! Use the navigation to explore SpeedHeart. Welcome to your dating adventure! 🎉',
          placement: 'top',
          showProgress: true,
        }
      ];

      // Filter steps based on current page
      if (location.pathname === '/onboarding') {
        return baseSteps.slice(0, 2);
      } else if (location.pathname === '/profile') {
        return baseSteps.slice(2, 6);
      } else if (location.pathname === '/communities') {
        return baseSteps.slice(6, 8);
      } else if (location.pathname === '/date') {
        return baseSteps.slice(8, 10);
      } else {
        return [baseSteps[baseSteps.length - 1]]; // Show final step
      }
    };

    setSteps(generateSteps());
  }, [location.pathname]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, type, index, action } = data;

    if (type === 'step:after' || type === 'error:target_not_found') {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    } else if (status === 'finished' || status === 'skipped') {
      if (status === 'skipped') {
        // Save user preference to skip tours
        await Preferences.set({
          key: `tour_preference_${userId}`,
          value: 'skip'
        });
        toast({
          title: 'Tour Skipped',
          description: 'You can always restart the tour from Settings!',
        });
        onTourSkip();
      } else {
        // Mark tour as completed
        await Preferences.set({
          key: `tour_completed_${userId}`,
          value: 'true'
        });
        toast({
          title: 'Welcome to SpeedHeart! 🎉',
          description: 'You\'re ready to start your dating journey!',
        });
        onTourComplete();
      }
    }

    // Handle navigation for multi-page tour
    if (type === EVENTS.STEP_AFTER && action === 'next') {
      const currentPath = location.pathname;

      // Navigate between pages based on step progression
      if (index === 1 && currentPath === '/onboarding') {
        setTimeout(() => navigate('/profile'), 500);
      } else if (index === 5 && currentPath === '/profile') {
        setTimeout(() => navigate('/communities'), 500);
      } else if (index === 7 && currentPath === '/communities') {
        setTimeout(() => navigate('/date'), 500);
      }
    }
  };

  // Custom styles matching SpeedHeart theme
  const joyrideStyles = {
    options: {
      primaryColor: 'hsl(var(--romance))',
      backgroundColor: 'hsl(var(--card))',
      textColor: 'hsl(var(--foreground))',
      overlayColor: 'rgba(0, 0, 0, 0.4)',
      spotlightShadow: '0 0 15px rgba(255, 105, 180, 0.6)',
      beaconSize: 36,
      zIndex: 10000,
    },
    tooltip: {
      fontSize: 16,
      padding: 20,
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(255, 105, 180, 0.2)',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipTitle: {
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 8,
      color: 'hsl(var(--romance))',
    },
    tooltipContent: {
      lineHeight: 1.5,
    },
    buttonNext: {
      backgroundColor: 'hsl(var(--romance))',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      padding: '8px 16px',
    },
    buttonBack: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 14,
      fontWeight: 500,
    },
    buttonSkip: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 14,
    },
    beacon: {
      backgroundColor: 'hsl(var(--romance))',
    },
    beaconInner: {
      backgroundColor: 'hsl(var(--romance))',
    },
    beaconOuter: {
      backgroundColor: 'hsl(var(--romance))',
      opacity: 0.3,
    },
    spotlight: {
      backgroundColor: 'transparent',
      border: '2px solid hsl(var(--romance))',
      borderRadius: 8,
    }
  };

  if (!isRunning || steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={isRunning}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      styles={joyrideStyles}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      floaterProps={{
        disableAnimation: false,
      }}
      scrollToFirstStep={true}
      scrollOffset={100}
    />
  );
};

export default OnboardingTour;