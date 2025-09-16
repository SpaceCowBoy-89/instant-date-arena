import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { connectionsQuestions, Question, Answer } from "@/data/connectionsQuestions";
import { Sparkles } from "lucide-react";

interface ConnectionsQuizProps {
  userId: string;
  currentAnswerCount: number;
  onQuizComplete: () => void;
  onAnswerSaved: (newCount: number) => void; // Add callback for real-time updates
}

const ConnectionsQuiz = ({ userId, currentAnswerCount, onQuizComplete, onAnswerSaved }: ConnectionsQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionsInDb, setQuestionsInDb] = useState<any[]>([]);
  const [localAnswerCount, setLocalAnswerCount] = useState(currentAnswerCount); // Track answers locally
  const { toast } = useToast();

  useEffect(() => {
    setLocalAnswerCount(currentAnswerCount);
  }, [currentAnswerCount]);

  useEffect(() => {
    initializeQuestions();
  }, []);

  const initializeQuestions = async () => {
    try {
      // First, check if questions exist in database
      const { data: existingQuestions } = await supabase
        .from('connections_questions')
        .select('*');

      if (!existingQuestions || existingQuestions.length === 0) {
        // Insert questions into database
        const questionsToInsert = connectionsQuestions.map(q => ({
          question: q.question,
          answers: q.answers as any // Cast to any to match Json type
        }));

        const { data: insertedQuestions, error } = await supabase
          .from('connections_questions')
          .insert(questionsToInsert)
          .select();

        if (error) throw error;
        setQuestionsInDb(insertedQuestions || []);
      } else {
        setQuestionsInDb(existingQuestions);
      }

      // Get answered question IDs
      const { data: userAnswers } = await supabase
        .from('user_connections_answers')
        .select('question_id')
        .eq('user_id', userId);

      const answeredIds = userAnswers?.map(a => a.question_id) || [];
      setAnsweredQuestionIds(answeredIds);

      // Load next question
      loadNextQuestion(existingQuestions || [], answeredIds);

    } catch (error) {
      console.error('Error initializing questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    }
  };

  const loadNextQuestion = (questions: any[], answered: string[]) => {
    const unansweredQuestions = questions.filter(q => !answered.includes(q.id));
    
    if (unansweredQuestions.length === 0) {
      return;
    }

    // Randomize the order
    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const selectedQuestion = unansweredQuestions[randomIndex];
    
    setCurrentQuestion({
      question: selectedQuestion.question,
      answers: selectedQuestion.answers,
      ...(selectedQuestion.id && { id: selectedQuestion.id })
    } as Question & { id: string });
  };

  const handleAnswerSelect = async (answer: Answer) => {
    if (!currentQuestion || loading) return;

    setLoading(true);
    try {
      console.log('Attempting to save answer:', {
        user_id: userId,
        question_id: (currentQuestion as any).id,
        selected_answer: answer,
        currentQuestion: currentQuestion
      });

      const { error } = await supabase
        .from('user_connections_answers')
        .insert({
          user_id: userId,
          question_id: (currentQuestion as any).id,
          selected_answer: answer as any // Cast to Json type
        });

      if (error) {
        console.error('Error saving answer:', error);
        throw error;
      }

      const newAnsweredIds = [...answeredQuestionIds, (currentQuestion as any).id];
      const newAnswerCount = newAnsweredIds.length;
      
      setAnsweredQuestionIds(newAnsweredIds);
      setLocalAnswerCount(newAnswerCount);
      
      // Notify parent of the new count for real-time updates
      onAnswerSaved(newAnswerCount);

      toast({
        title: "Answer Recorded",
        description: "Your answer has been saved!",
      });

      // Check if we've answered enough questions
      if (newAnswerCount >= 10) {
        setTimeout(() => {
          onQuizComplete();
        }, 1000);
        return;
      }

      // Load next question
      loadNextQuestion(questionsInDb, newAnsweredIds);

    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: "Error",
        description: "Failed to save your answer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (localAnswerCount >= 10) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center animate-scale-in">
            <div className="text-2xl">🎉</div>
          </div>
          <CardTitle className="text-xl text-primary">Quiz Complete!</CardTitle>
          <CardDescription className="text-base">
            You've answered all 10 questions perfectly! We're finding your perfect group...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center space-y-4">
              <Sparkles className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Analyzing your answers to find the perfect match...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Sparkles className="h-8 w-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        <CardDescription>
          Choose the answer that resonates most with you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentQuestion.answers.map((answer, index) => (
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

export default ConnectionsQuiz;