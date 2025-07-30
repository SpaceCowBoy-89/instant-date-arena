import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Heart, Sparkles } from "lucide-react";

interface ConnectionsGroupTransitionProps {
  groupName: string;
  groupSubtitle: string;
  onContinue: () => void;
}

const ConnectionsGroupTransition = ({ groupName, groupSubtitle, onContinue }: ConnectionsGroupTransitionProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay showing content for better animation effect
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="animate-fade-in max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-6 relative">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center animate-scale-in mx-auto">
            <Users className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 animate-bounce">
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-4xl animate-pulse">🎉</div>
          <CardTitle className="text-2xl text-primary animate-fade-in">
            Welcome to Your Tribe!
          </CardTitle>
        </div>
      </CardHeader>
      
      {showContent && (
        <CardContent className="space-y-6 animate-fade-in text-center">
          <div className="space-y-3">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-lg text-primary mb-1">
                {groupName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {groupSubtitle}
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Heart className="h-4 w-4 text-red-400" />
              <p className="text-sm">
                You've been matched with like-minded people who share your interests and values!
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <CardDescription className="text-center">
              Your group is a space for meaningful platonic friendships. 
              Connect, chat, and build lasting relationships with people who truly get you.
            </CardDescription>
            
            <Button 
              onClick={onContinue}
              className="w-full animate-scale-in"
              size="lg"
            >
              Meet Your New Friends
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ConnectionsGroupTransition;