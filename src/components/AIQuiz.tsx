import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot } from "lucide-react";

interface AIQuizProps {
  userId: string;
  onQuizComplete: (groupName: string) => void;
}

// Sample questions - simplified format
const SAMPLE_QUESTIONS = [
  {
    question: "What's your ideal weekend activity?",
    answers: [
      { text: "Reading a good book by the fireplace", groups: ["Book Lovers"] },
      { text: "Hiking in nature and taking photos", groups: ["Adventurers"] },
      { text: "Cooking a new recipe from scratch", groups: ["Foodies"] },
      { text: "Building something with my hands", groups: ["Creators"] }
    ]
  },
  {
    question: "How do you prefer to spend time with friends?",
    answers: [
      { text: "Playing board games and deep conversations", groups: ["Gamers"] },
      { text: "Watching movies and discussing them", groups: ["Movie Aficionados"] },
      { text: "Going on outdoor adventures together", groups: ["Adventurers"] },
      { text: "Attending concerts or music events", groups: ["Music & Performance"] }
    ]
  },
  // Add more questions as needed
];

const AIQuiz = ({ userId, onQuizComplete }: AIQuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const { toast } = useToast();

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = async (answer: any) => {
    if (loading) return;

    setLoading(true);
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Check if quiz is complete (simplified to 2 questions for demo)
    if (currentQuestionIndex + 1 >= SAMPLE_QUESTIONS.length) {
      // Calculate group placement
      const groupCounts: Record<string, number> = {};
      
      newAnswers.forEach(answer => {
        answer.groups.forEach((group: string) => {
          groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
      });

      // Find group with highest count
      const sortedGroups = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);
      const topGroup = sortedGroups[0]?.[0] || "Book Lovers";

      // Join the user to the winning group
      try {
        const { data: group } = await supabase
          .from('connections_groups')
          .select('id')
          .eq('tag_name', topGroup)
          .single();

        if (group) {
          const { error } = await supabase
            .from('user_connections_groups')
            .insert({
              user_id: userId,
              group_id: group.id
            });

          if (!error) {
            toast({
              title: "Welcome to your community!",
              description: `You've been placed in ${topGroup} based on your answers!`,
            });
            onQuizComplete(topGroup);
          }
        }
      } catch (error) {
        console.error('Error placing user in group:', error);
        toast({
          title: "Error",
          description: "Failed to place you in a group. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    setLoading(false);
  };

  if (!quizStarted) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={startQuiz}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Ask AI</h3>
              <p className="text-sm text-muted-foreground">where you belong</p>
              <p className="text-xs text-muted-foreground mt-2">
                Take our AI-powered quiz to find your perfect community match
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentQuestionIndex >= SAMPLE_QUESTIONS.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-primary">Analyzing Your Answers...</CardTitle>
          <CardDescription className="text-base">
            Our AI is finding your perfect community match!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}
          </span>
        </div>
        <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        <CardDescription>
          Choose the answer that best describes you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentQuestion.answers.map((answer: any, index: number) => (
          <Button
            key={index}
            variant="outline"
            className="w-full text-left p-4 h-auto whitespace-normal justify-start"
            onClick={() => handleAnswerSelect(answer)}
            disabled={loading}
          >
            <span className="text-sm leading-relaxed">{answer.text}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default AIQuiz;