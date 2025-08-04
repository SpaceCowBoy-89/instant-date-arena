import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { CompatibilityTest } from '@/components/CompatibilityTest';
import ScrollToTop from '@/components/ScrollToTop';

export default function Date() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompatibilityTest, setShowCompatibilityTest] = useState(false);
  const [hasCompletedTest, setHasCompletedTest] = useState(false);

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

      // Check if user has compatibility scores (completed test)
      const { data: scores } = await supabase
        .from('user_compatibility_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasCompletedTest(!!scores);
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
    setShowCompatibilityTest(true);
  };

  const handleTestComplete = () => {
    setShowCompatibilityTest(false);
    setHasCompletedTest(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Choose Your Dating Experience
            </h1>
            <p className="text-lg text-muted-foreground">
              Find meaningful connections through speed dating or discover compatibility through our personality test
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Speed Date Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Speed Date</CardTitle>
                <CardDescription className="text-base">
                  Quick 5-minute conversations with potential matches. Jump right into exciting connections!
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                  <li>• 5-minute timed conversations</li>
                  <li>• Instant matching with nearby users</li>
                  <li>• Real-time chat experience</li>
                  <li>• Mutual likes create lasting connections</li>
                </ul>
                <Button 
                  onClick={handleSpeedDate}
                  className="w-full"
                  size="lg"
                >
                  Start Speed Dating
                </Button>
              </CardContent>
            </Card>

            {/* Compatibility Test Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary/20">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Compatibility Test</CardTitle>
                <CardDescription className="text-base">
                  Discover your personality traits and find highly compatible matches based on science
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                  <li>• 15 personality-based questions</li>
                  <li>• Scientific compatibility scoring</li>
                  <li>• Match with similar personalities</li>
                  <li>• Detailed trait analysis</li>
                </ul>
                {hasCompletedTest ? (
                  <div className="space-y-3">
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Test completed! Your compatibility profile is active.
                    </div>
                    <Button 
                      onClick={handleCompatibilityTest}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Retake Test
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleCompatibilityTest}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                  >
                    Take Compatibility Test
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {hasCompletedTest && (
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl mb-2">Finding Your Deeper Connection</CardTitle>
                  <CardDescription className="text-base">
                    We use advanced machine learning to suggest matches based on what truly matters: personality, communication, and emotional compatibility.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold">Personality-Driven Matches</h4>
                          <p className="text-sm text-muted-foreground">Aligned core personality traits.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold">More Than Just Interests</h4>
                          <p className="text-sm text-muted-foreground">Analyze communication and lifestyle.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold">In-Depth Compatibility Report</h4>
                          <p className="text-sm text-muted-foreground">Know the "why" you match.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold">Dynamic Matching</h4>
                          <p className="text-sm text-muted-foreground">Learns from your interactions.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Button 
                      onClick={() => navigate('/matches')}
                      size="lg"
                      className="px-8"
                    >
                      Meet Your Matches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}