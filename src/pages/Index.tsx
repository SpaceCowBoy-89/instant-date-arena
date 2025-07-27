import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, MessageCircle, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-image.jpg";
import { useLocationFromIP } from "@/hooks/useLocationFromIP";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { location: detectedLocation } = useLocationFromIP();

  // Function to create user profile with location
  const createUserProfile = async (user: User) => {
    try {
      // First check if user already exists and has a location
      const { data: existingUser } = await supabase
        .from('users')
        .select('location')
        .eq('id', user.id)
        .single();

      const hasExistingLocation = existingUser?.location && existingUser.location.trim() !== '';
      
      const profileData = {
        id: user.id,
        name: name.trim() || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        location: detectedLocation?.displayLocation || '',
        preferences: {}
      };

      const { error } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        console.log('User profile created with location:', profileData.location);
        // Only show location detected toast for new users or users without existing location
        if (detectedLocation?.displayLocation && !hasExistingLocation) {
          toast({
            title: "Location detected!",
            description: `We've set your location to ${detectedLocation.displayLocation}`,
          });
        }
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle new user registration with location detection
        if (session?.user && !user) {
          // This is a new authentication, defer profile creation to avoid deadlock
          setTimeout(() => {
            createUserProfile(session.user);
          }, 0);
        }
        
        // Redirect authenticated users to lobby
        if (session?.user) {
          navigate("/lobby");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect if already authenticated
      if (session?.user) {
        navigate("/lobby");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, detectedLocation, name, toast, user]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Try signing in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Welcome to SpeedHeart!",
          description: "Account created successfully. You're now signed in.",
        });
        // User will be redirected by the auth state change listener
      }
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Sign in failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You're now signed in.",
        });
        // User will be redirected by the auth state change listener
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative mobile-container header-safe pb-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-romance fill-romance" />
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-romance to-purple-accent bg-clip-text text-transparent">
                SpeedHeart
              </h1>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Connect instantly. Find your perfect match in real-time speed dating.
            </p>
            
            {/* Mobile-optimized feature highlights */}
            <div className="grid grid-cols-2 sm:flex sm:justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground mb-8 sm:mb-12 px-4">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-romance" />
                <span className="text-center sm:text-left">3-min talks</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-romance" />
                <span className="text-center sm:text-left">Smart match</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-romance" />
                <span className="text-center sm:text-left">Real-time</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-romance" />
                <span className="text-center sm:text-left">Meaningful</span>
              </div>
            </div>
          </div>

          {/* Auth Forms - Mobile First */}
          <div className="w-full max-w-sm mx-auto px-4">
            <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl">Start Your Journey</CardTitle>
                <CardDescription className="text-sm">
                  Join thousands finding love
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Tabs defaultValue="signup" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 h-11">
                    <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
                    <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signup" className="space-y-0">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^[a-zA-Z\s]*$/.test(value)) {
                              setName(value);
                            }
                          }}
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-signup" className="text-sm">Email</Label>
                        <Input
                          id="email-signup"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup" className="text-sm">Password</Label>
                        <Input
                          id="password-signup"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        variant="romance" 
                        className="w-full h-12 text-base font-semibold mt-6" 
                        disabled={loading}
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signin" className="space-y-0">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-signin" className="text-sm">Email</Label>
                        <Input
                          id="email-signin"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signin" className="text-sm">Password</Label>
                        <Input
                          id="password-signin"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        variant="romance" 
                        className="w-full h-12 text-base font-semibold mt-6" 
                        disabled={loading}
                      >
                        {loading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section - Mobile Optimized */}
      <div className="mobile-container py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            How SpeedHeart Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Simple, fun, and effective. Start meaningful conversations.
          </p>
        </div>
        
        {/* Mobile-first grid */}
        <div className="space-y-6 sm:grid sm:grid-cols-3 sm:gap-6 sm:space-y-0">
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-romance to-purple-accent rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Create Profile</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload photos and set preferences to find compatible matches.
            </p>
          </Card>
          
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-romance to-purple-accent rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Join Queue</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Get paired with someone special for a 3-minute conversation.
            </p>
          </Card>
          
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-romance to-purple-accent rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Make Connections</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              If you both feel a spark, continue chatting and build something beautiful.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
