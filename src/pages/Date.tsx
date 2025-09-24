import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Brain, Clock, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { CompatibilityTest } from '@/components/CompatibilityTest';
import { RequirementsModal } from '@/components/RequirementsModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import ScrollToTop from '@/components/ScrollToTop';
import Spinner from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';

export default function DatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompatibilityTest, setShowCompatibilityTest] = useState(false);
  const [hasCompletedTest, setHasCompletedTest] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [requirements, setRequirements] = useState({
    hasInterests: false,
    hasPhoto: false,
    hasAge: false,
    hasGender: false,
    hasLocation: false,
    hasBio: false,
    hasCompletedAIQuiz: false,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUser(user);

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setUserProfile(profile);

      // Check requirements
      if (profile) {
        const preferences = profile.preferences as any;
        const interests = preferences?.interests || [];
        const bio = profile.bio || '';
        
        // Check if user has completed AI Quiz (check if they've joined any community groups)
        const { data: userGroups } = await supabase
          .from('user_connections_groups')
          .select('*')
          .eq('user_id', user.id);
        
        setRequirements({
          hasInterests: Array.isArray(interests) && interests.length >= 3,
          hasPhoto: !!profile.photo_url,
          hasAge: !!profile.age,
          hasGender: !!profile.gender,
          hasLocation: !!profile.location,
          hasBio: bio.length >= 25,
          hasCompletedAIQuiz: userGroups && userGroups.length > 0,
        });
      }

      // Check if user has compatibility scores (completed test)
      const { data: scores } = await supabase
        .from('user_compatibility_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasCompletedTest(!!scores);

      // Show feedback modal if test completed over a week ago
      if (scores && scores.created_at) {
        const testDate = new window.Date(String(scores.created_at));
        const oneWeekAgo = new window.Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        if (testDate <= oneWeekAgo) {
          // Check if feedback already given this week
          const lastFeedback = localStorage.getItem(`feedback_${user.id}`);
          const lastFeedbackDate = lastFeedback ? new window.Date(lastFeedback) : null;
          const oneWeekAgoFromNow = new window.Date();
          oneWeekAgoFromNow.setDate(oneWeekAgoFromNow.getDate() - 7);
          
          if (!lastFeedbackDate || lastFeedbackDate <= oneWeekAgoFromNow) {
            setTimeout(() => setShowFeedbackModal(true), 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedDate = () => {
    navigate('/lobby');
  };

  const handleCompatibilityTest = () => {
    // Check if already completed the test
    if (hasCompletedTest) {
      toast({
        title: "Test Already Completed",
        description: "You can only take the Compatibility Test once. Check your matches instead!",
        variant: "destructive",
      });
      return;
    }
    
    // Check if requirements are met
    const allRequirementsMet = Object.values(requirements).every(req => req);
    
    if (!allRequirementsMet) {
      setShowRequirementsModal(true);
      return;
    }
    
    setShowCompatibilityTest(true);
  };

  const handleTestComplete = () => {
    setShowCompatibilityTest(false);
    setHasCompletedTest(true);
  };

  const handleFeedbackSubmit = () => {
    if (user) {
      localStorage.setItem(`feedback_${user.id}`, (new window.Date()).toISOString());
    }
    setShowFeedbackModal(false);
  };

  if (loading) {
    return <Spinner message="Loading dating features..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access dating features.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (showCompatibilityTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <CompatibilityTest 
            userId={user.id} 
            onComplete={handleTestComplete}
            onBack={() => setShowCompatibilityTest(false)}
          />
        </div>
        <ScrollToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navbar />
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-16 sm:pb-20 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 py-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-date-pink mb-4 px-2">
              Choose Your Dating Experience
            </h1>
            <p className="text-sm sm:text-base text-date-dark-gray px-4 mb-3">
              Find meaningful connections through speed dating or discover compatibility through our personality test
            </p>
            <p className="text-xs sm:text-sm italic text-date-dark-gray px-4">
              Take the first step to find your match today!
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 w-full max-w-4xl mx-auto px-2 sm:px-4">
            {/* Speed Date Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 border border-date-border hover:border-date-pink/30 touch-manipulation w-full max-w-[90%] md:max-w-none mx-auto shadow-md hover:shadow-xl">
              <CardHeader className="text-center pb-4 sm:pb-6 px-3 sm:px-6">
                <div className="mx-auto w-12 h-12 bg-date-pink rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-white fill-current" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-foreground">Speed Date</CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed text-date-dark-gray">
                  Quick 5-minute conversations with potential matches. Jump right into exciting connections!
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-3 sm:px-6">
                <ul className="text-sm sm:text-base text-date-dark-gray mb-6 space-y-3 text-left">
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-date-pink mt-0.5 flex-shrink-0" />
                    <span><strong>5-minute timed conversations</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-date-pink mt-0.5 flex-shrink-0" />
                    <span>Instant, real-time matches with nearby users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-date-pink mt-0.5 flex-shrink-0" />
                    <span><strong>Mutual likes create lasting connections</strong></span>
                  </li>
                </ul>
                <div className="flex justify-center">
                  <Button
                    onClick={handleSpeedDate}
                    className="w-full sm:w-[200px] h-12 text-base font-medium bg-date-pink hover:bg-date-pink/90 text-white hover:scale-105 transition-all duration-200 rounded-lg flex items-center justify-center gap-2 min-h-[44px] step-speed-dating"
                  >
                    Start Speed Dating
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Compatibility Test or Finding Connection Card */}
            {hasCompletedTest ? (
              <Card className="group hover:shadow-lg transition-all duration-300 border border-date-border hover:border-date-purple/30 bg-gradient-to-r from-date-purple/5 to-date-light-pink/5 touch-manipulation w-full max-w-[90%] md:max-w-none mx-auto shadow-md hover:shadow-xl">
                <CardHeader className="text-center pb-4 sm:pb-6 px-3 sm:px-6">
                  <div className="mx-auto w-12 h-12 bg-date-purple rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-6 h-6 text-white fill-current" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">Finding Your Deeper Connection</CardTitle>
                  <CardDescription className="text-sm sm:text-base leading-relaxed text-date-dark-gray">
                    We use advanced machine learning to suggest matches based on personality, communication, and emotional compatibility.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center px-3 sm:px-6">
                  <div className="text-left mb-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-date-purple mt-0.5 flex-shrink-0" />
                      <div className="text-sm sm:text-base text-date-dark-gray">
                        <span className="font-semibold">Personality-Driven Matches:</span> Aligned core traits
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-date-purple mt-0.5 flex-shrink-0" />
                      <div className="text-sm sm:text-base text-date-dark-gray">
                        <span className="font-semibold">In-Depth Compatibility Report:</span> Know the "why" you match
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-date-purple mt-0.5 flex-shrink-0" />
                      <div className="text-sm sm:text-base text-date-dark-gray">
                        <span className="font-semibold">Dynamic Matching:</span> Learns from your interactions
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => navigate('/matches')}
                      className="w-full sm:w-[200px] h-12 text-base font-medium bg-date-purple hover:bg-date-purple/90 text-white hover:scale-105 transition-all duration-200 rounded-lg flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      Meet Your Matches
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-4 p-3 bg-date-light-pink/10 rounded-lg border border-date-light-pink/20">
                    <div className="flex items-center gap-2 text-xs text-date-dark-gray">
                      <Star className="w-3 h-3 text-date-light-pink" />
                      <span className="italic">"Found my match in a week!" – Sarah</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="group hover:shadow-lg transition-all duration-300 border border-date-border hover:border-date-light-pink/30 touch-manipulation w-full max-w-[90%] md:max-w-none mx-auto shadow-md hover:shadow-xl">
                <CardHeader className="text-center pb-4 sm:pb-6 px-3 sm:px-6">
                  <div className="mx-auto w-12 h-12 bg-date-light-pink rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-6 h-6 text-white fill-current" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">Compatibility Test</CardTitle>
                  <CardDescription className="text-sm sm:text-base leading-relaxed text-date-dark-gray">
                    Discover your personality traits and find highly compatible matches based on science
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center px-3 sm:px-6">
                  <ul className="text-sm sm:text-base text-date-dark-gray mb-6 space-y-3 text-left">
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-date-light-pink mt-0.5 flex-shrink-0" />
                      <span>15 personality-based questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-date-light-pink mt-0.5 flex-shrink-0" />
                      <span><strong>Scientific compatibility scoring</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-date-light-pink mt-0.5 flex-shrink-0" />
                      <span>Detailed trait analysis</span>
                    </li>
                  </ul>
                  <div className="flex justify-center">
                    <Button
                      onClick={handleCompatibilityTest}
                      className="w-full sm:w-[200px] h-12 text-base font-medium bg-date-light-pink hover:bg-date-pink text-white hover:scale-105 transition-all duration-200 rounded-lg flex items-center justify-center gap-2 min-h-[44px] step-compatibility-test"
                      disabled={hasCompletedTest}
                    >
                      {hasCompletedTest ? "Test Completed" : "Take Compatibility Test"}
                      {!hasCompletedTest && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>
                  {hasCompletedTest && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        ✓ Compatibility test can only be taken once
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <RequirementsModal
        open={showRequirementsModal}
        onOpenChange={setShowRequirementsModal}
        requirements={requirements}
      />
      
      <FeedbackModal
        open={showFeedbackModal}
        onOpenChange={(open) => {
          if (!open) handleFeedbackSubmit();
          setShowFeedbackModal(open);
        }}
        type="match"
      />
      
      <ScrollToTop />
    </div>
  );
}