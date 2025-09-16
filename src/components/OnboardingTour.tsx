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
        // Profile completion steps
        {
          target: '.step-profile-photo',
          content: 'Upload your best photo here! This helps others see the real you. 📸',
          placement: 'bottom',
          disableBeacon: true,
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
          content: 'Discover amazing communities that match your vibe! Join groups with people who share your passions. 🚀',
          placement: 'bottom',
          showProgress: true,
        },
        {
          target: '.step-quiz-button',
          content: 'Take our AI-powered quiz to get personalized community suggestions and unlock your dating potential! 🧠✨',
          placement: 'bottom',
          showProgress: true,
        },

        // Matches page steps
        {
          target: '.step-matches-list',
          content: 'Here are your potential matches! Swipe through and see who catches your eye. 💕',
          placement: 'top',
          showProgress: true,
        },
        {
          target: '.step-speed-dating',
          content: 'Ready for some excitement? Jump into speed dating for instant connections! ⚡',
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
      if (location.pathname === '/profile') {
        return baseSteps.slice(0, 3);
      } else if (location.pathname === '/communities') {
        return baseSteps.slice(3, 5);
      } else if (location.pathname === '/matches') {
        return baseSteps.slice(5, 7);
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
      if (index === 2 && currentPath === '/profile') {
        setTimeout(() => navigate('/communities'), 500);
      } else if (index === 4 && currentPath === '/communities') {
        setTimeout(() => navigate('/matches'), 500);
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