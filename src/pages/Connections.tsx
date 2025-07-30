import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { connectionsQuestions } from "@/data/connectionsQuestions";
import ConnectionsQuiz from "@/components/ConnectionsQuiz";
import ConnectionsGroup from "@/components/ConnectionsGroup";
import Navbar from "@/components/Navbar";

interface UserGroup {
  id: string;
  tag_name: string;
  tag_subtitle: string;
}

const Connections = () => {
  const [user, setUser] = useState<any>(null);
  const [userGroup, setUserGroup] = useState<UserGroup | null>(null);
  const [answerCount, setAnswerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/");
        return;
      }

      setUser(authUser);

      // Check if user has answered questions and is in a group
      const { data: answers } = await supabase
        .from('user_connections_answers')
        .select('*')
        .eq('user_id', authUser.id);

      setAnswerCount(answers?.length || 0);

      // Check if user is in a group
      const { data: groupMembership } = await supabase
        .from('user_connections_groups')
        .select(`
          connections_groups (
            id,
            tag_name,
            tag_subtitle
          )
        `)
        .eq('user_id', authUser.id)
        .single();

      if (groupMembership?.connections_groups) {
        setUserGroup(groupMembership.connections_groups as UserGroup);
      }

    } catch (error) {
      console.error('Error checking user:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = () => {
    // Refresh the page to check for group assignment
    checkUser();
  };

  const handleAnswerSaved = (newCount: number) => {
    setAnswerCount(newCount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access Connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/lobby")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Connections</h1>
          </div>
        </div>

        {!userGroup ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Your Tribe</CardTitle>
                <CardDescription>
                  Answer fun questions to connect with like-minded people for platonic friendships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Progress: {answerCount}/8 questions answered
                </div>
                {answerCount < 8 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(answerCount / 8) * 100}%` }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <ConnectionsQuiz
              userId={user.id}
              currentAnswerCount={answerCount}
              onQuizComplete={handleQuizComplete}
              onAnswerSaved={handleAnswerSaved}
            />
          </div>
        ) : (
          <ConnectionsGroup
            groupId={userGroup.id}
            groupName={userGroup.tag_name}
            groupSubtitle={userGroup.tag_subtitle}
            userId={user.id}
          />
        )}
      </div>
      <Navbar />
    </div>
  );
};

export default Connections;