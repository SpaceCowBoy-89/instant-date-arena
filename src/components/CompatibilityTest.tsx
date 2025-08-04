import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompatibilityTestProps {
  userId: string;
  onComplete: () => void;
  onBack: () => void;
}

interface Question {
  id: string;
  question_text: string;
  trait_category: string;
}

const SCALE_LABELS = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree'
};

export function CompatibilityTest({ userId, onComplete, onBack }: CompatibilityTestProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('compatibility_questions')
        .select('*')
        .order('created_at');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (value: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Save answer to database
    try {
      const { error } = await supabase
        .from('user_compatibility_answers')
        .upsert({
          user_id: userId,
          question_id: currentQuestion.id,
          answer_value: value
        });

      if (error) throw error;

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        await completeTest();
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    }
  };

  const completeTest = async () => {
    setSubmitting(true);
    try {
      // The trigger function will automatically calculate scores
      setCompleted(true);
      toast.success('Compatibility test completed!');
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Failed to complete test');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-lg text-muted-foreground">Loading questions...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Test Completed!</h2>
          <p className="text-muted-foreground mb-6">
            Your personality profile has been calculated. You'll now see compatibility scores when speed dating.
          </p>
          <div className="animate-pulse text-sm text-muted-foreground">
            Redirecting you back...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No Questions Available</h2>
          <p className="text-muted-foreground mb-6">
            The compatibility test questions are not available at the moment.
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 sm:mr-4 min-h-[44px] touch-manipulation">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card className="touch-manipulation">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-base sm:text-lg leading-relaxed">
            {currentQuestion.question_text}
          </CardTitle>
          <div className="text-xs sm:text-sm text-muted-foreground capitalize">
            Category: {currentQuestion.trait_category.replace('_', ' ')}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground text-center mb-6">
              How much do you agree with this statement?
            </div>
            
            <div className="grid gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant={answers[currentQuestion.id] === value ? "default" : "outline"}
                  className="justify-start min-h-[52px] py-3 px-4 sm:px-6 touch-manipulation"
                  onClick={() => handleAnswer(value)}
                  disabled={submitting}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm sm:text-base">{value}</span>
                    <span className="text-xs sm:text-sm">{SCALE_LABELS[value as keyof typeof SCALE_LABELS]}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Info */}
      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
        {Object.keys(answers).length} of {questions.length} questions answered
      </div>
    </div>
  );
}