import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import ScrollToTop from '@/components/ScrollToTop';
import { toast } from 'sonner';

interface CompatibilityMatch {
  id: string;
  name: string;
  age: number;
  bio: string;
  photo_url: string;
  compatibility_score: number;
  compatibility_label: number;
  extroversion_diff: number;
  agreeableness_diff: number;
  age_diff: number;
}

export default function Matches() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<CompatibilityMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndLoadMatches();
  }, []);

  const checkUserAndLoadMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUser(user);

      // Check if user has completed compatibility test
      const { data: scores } = await supabase
        .from('user_compatibility_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!scores) {
        toast.error('Please complete the compatibility test first');
        navigate('/date');
        return;
      }

      await loadMatches(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('compatibility-matchmaker', {
        body: { user_id: userId }
      });

      if (error) throw error;
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('Failed to load matches');
    }
  };

  const getCompatibilityText = (match: CompatibilityMatch) => {
    const score = Math.round(match.compatibility_score * 100);
    
    if (score >= 90) {
      return `${score}% Compatible`;
    } else if (score >= 80) {
      return `${score}% Compatible`;
    } else if (score >= 70) {
      return `${score}% Compatible`;
    } else {
      return `${score}% Compatible`;
    }
  };

  const getCompatibilityDescription = (match: CompatibilityMatch) => {
    const descriptions = [];
    
    if (match.extroversion_diff <= 1.0) {
      descriptions.push("similar social energy levels");
    }
    if (match.agreeableness_diff <= 1.0) {
      descriptions.push("compatible communication styles");
    }
    if (match.age_diff <= 3) {
      descriptions.push("similar life stages");
    }
    
    if (descriptions.length === 0) {
      return "You share complementary personality traits that could create a great dynamic.";
    }
    
    return `You both have ${descriptions.join(" and ")}.`;
  };

  const getCompatibilityVariant = (score: number) => {
    if (score >= 0.9) return "default";
    if (score >= 0.8) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-lg text-muted-foreground">Finding your matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navbar />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 sm:mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/date')} className="mr-3 sm:mr-4 min-h-[44px] touch-manipulation">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              Back
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Your Compatible Matches
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Based on personality compatibility and shared values
              </p>
            </div>
          </div>

          {/* Matches Grid */}
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No matches found yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 px-4">
                We're still finding your perfect matches. Check back soon!
              </p>
              <Button onClick={() => navigate('/date')} className="min-h-[44px]">
                Back to Dating Options
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {matches.map((match) => (
                <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 touch-manipulation">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Avatar */}
                      <div className="flex items-center space-x-4 sm:flex-col sm:space-x-0 sm:space-y-2 w-full sm:w-auto">
                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          <AvatarImage src={match.photo_url} alt={match.name} />
                          <AvatarFallback className="text-lg font-semibold">
                            {match.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="sm:hidden flex-1">
                          <h3 className="text-lg font-semibold">{match.name}</h3>
                          <p className="text-sm text-muted-foreground">{match.age} years old</p>
                        </div>
                        <Badge 
                          variant={getCompatibilityVariant(match.compatibility_score)}
                          className="px-2 py-1 text-xs sm:hidden"
                        >
                          {getCompatibilityText(match)}
                        </Badge>
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="hidden sm:flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold">{match.name}</h3>
                            <p className="text-muted-foreground">{match.age} years old</p>
                          </div>
                          <Badge 
                            variant={getCompatibilityVariant(match.compatibility_score)}
                            className="ml-4 px-3 py-1"
                          >
                            {getCompatibilityText(match)}
                          </Badge>
                        </div>

                        {/* Bio */}
                        {match.bio && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 sm:line-clamp-2">
                            {match.bio}
                          </p>
                        )}

                        {/* Compatibility Description */}
                        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-3 sm:p-4 mb-4">
                          <h4 className="font-medium text-sm mb-1">Why you're compatible:</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {getCompatibilityDescription(match)}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <Button size="sm" className="flex-1 min-h-[44px] touch-manipulation">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Start Conversation
                          </Button>
                          <Button variant="outline" size="sm" className="min-h-[44px] sm:w-auto touch-manipulation">
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}