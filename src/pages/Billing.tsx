import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Heart, Zap, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Billing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dailyUsage, setDailyUsage] = useState({ current_usage: 0, daily_limit: 10 });

  const packages = [
    {
      id: 'basic',
      name: 'Basic Pack',
      price: '$4.99',
      matches: 10,
      icon: Heart,
      description: 'Perfect for casual dating',
      color: 'text-blue-600'
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      price: '$19.99',
      matches: 30,
      icon: Zap,
      description: 'Most popular choice',
      color: 'text-purple-600',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      price: '$39.99',
      matches: 50,
      icon: Crown,
      description: 'For serious daters',
      color: 'text-gold-600'
    }
  ];

  useEffect(() => {
    getCurrentUser();
    getDailyUsage();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const getDailyUsage = async () => {
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from('user_match_limits')
      .select('matches_used, daily_limit')
      .eq('user_id', currentUser.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (!error && data) {
      setDailyUsage({
        current_usage: data.matches_used,
        daily_limit: data.daily_limit
      });
    }
  };

  const handlePurchase = async (packageData: any) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase matches.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // For now, simulate the purchase process
      // In a real app, this would integrate with Apple/Google Play billing
      const { data, error } = await supabase
        .from('user_purchases')
        .insert({
          user_id: currentUser.id,
          package_type: packageData.id,
          matches_count: packageData.matches,
          price_usd: parseFloat(packageData.price.replace('$', '')),
          platform: 'web', // Would be 'apple' or 'google' for mobile
          status: 'completed'
        });

      if (error) throw error;

      // Add purchased matches to user's daily limit
      const { error: addMatchesError } = await supabase
        .rpc('add_purchased_matches', {
          p_user_id: currentUser.id,
          p_matches_count: packageData.matches
        });

      if (addMatchesError) throw addMatchesError;

      toast({
        title: "Purchase Successful!",
        description: `You've added ${packageData.matches} matches to your daily limit.`,
      });

      // Refresh usage data
      await getDailyUsage();

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </div>

        {/* Usage Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Daily Match Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {dailyUsage.current_usage} / {dailyUsage.daily_limit}
                </p>
                <p className="text-muted-foreground">Matches used today</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {dailyUsage.daily_limit - dailyUsage.current_usage} matches remaining
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Packages */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Upgrade Your Dating Experience</h1>
          <p className="text-muted-foreground">Get more matches and find your perfect connection</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative ${pkg.popular ? 'ring-2 ring-purple-500 shadow-lg scale-105' : ''}`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className={`mx-auto w-12 h-12 rounded-full bg-gradient-to-r ${
                  pkg.id === 'basic' ? 'from-blue-400 to-blue-600' :
                  pkg.id === 'popular' ? 'from-purple-400 to-purple-600' :
                  'from-yellow-400 to-yellow-600'
                } flex items-center justify-center mb-4`}>
                  <pkg.icon className="h-6 w-6 text-white" />
                </div>
                
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">{pkg.price}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-muted-foreground">
                    +{pkg.matches} matches
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${(parseFloat(pkg.price.replace('$', '')) / pkg.matches).toFixed(2)} per match
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Instant activation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">No subscription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Quality matches</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className={`w-full ${pkg.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                >
                  {loading ? 'Processing...' : `Purchase ${pkg.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile Payment Info */}
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Mobile App Integration</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              For the best mobile experience with native Apple App Store and Google Play Store billing, 
              download our mobile app.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Mobile app with native billing will be available soon!",
                });
              }}>
                Download iOS App
              </Button>
              <Button variant="outline" onClick={() => {
                toast({
                  title: "Coming Soon", 
                  description: "Mobile app with native billing will be available soon!",
                });
              }}>
                Download Android App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Navbar />
    </div>
  );
};

export default Billing;