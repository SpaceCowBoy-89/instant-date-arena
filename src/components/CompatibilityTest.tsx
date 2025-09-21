import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, Wifi, WifiOff, Brain, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import Spinner from '@/components/Spinner';

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
  // Hide chatbot trigger when compatibility test is active
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineAnswers, setOfflineAnswers] = useState<Record<string, number>>({});
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadSavedAnswers();
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineAnswers();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadQuestions = async () => {
    try {
      // Try to load from cache first for faster loading
      const cachedQuestions = await loadCachedQuestions();
      if (cachedQuestions.length > 0) {
        setQuestions(cachedQuestions);
        setLoading(false);
      }
      
      // Then try to fetch fresh data if online
      if (isOnline) {
        const { data, error } = await supabase
          .from('compatibility_questions')
          .select('*')
          .order('created_at');

        if (error) throw error;
        
        if (data && data.length > 0) {
          setQuestions(data);
          // Cache the questions for offline use
          await cacheQuestions(data);
        }
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      
      // If we have cached questions, use them
      const cachedQuestions = await loadCachedQuestions();
      if (cachedQuestions.length > 0) {
        setQuestions(cachedQuestions);
        toast.info('Using offline questions');
      } else {
        toast.error('Failed to load questions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (value: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Always save locally first for instant response
    await saveAnswerLocally(currentQuestion.id, value);

    // Try to save to database if online
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('user_compatibility_answers')
          .upsert({
            user_id: userId,
            question_id: currentQuestion.id,
            answer_value: value
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving answer online:', error);
        // Store for later sync
        const newOfflineAnswers = { ...offlineAnswers, [currentQuestion.id]: value };
        setOfflineAnswers(newOfflineAnswers);
        await saveOfflineAnswers(newOfflineAnswers);
        setSyncPending(true);
        toast.info('Answer saved offline - will sync when connected');
      }
    } else {
      // Store for later sync
      const newOfflineAnswers = { ...offlineAnswers, [currentQuestion.id]: value };
      setOfflineAnswers(newOfflineAnswers);
      await saveOfflineAnswers(newOfflineAnswers);
      setSyncPending(true);
      toast.info('Answer saved offline');
    }

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await completeTest();
    }
  };

  const completeTest = async () => {
    setSubmitting(true);
    try {
      // Sync any pending offline answers first
      if (syncPending && isOnline) {
        await syncOfflineAnswers();
      }

      // Mark test as completed locally
      await Preferences.set({
        key: `compatibility_test_completed_${userId}`,
        value: 'true'
      });

      setCompleted(true);
      toast.success('Compatibility test completed!');

      // Generate matches after completing the test
      if (isOnline) {
        try {
          console.log('Generating compatibility matches...');
          const { data: matchResult } = await supabase.functions.invoke('compatibility-matchmaker', {
            body: { user_id: userId }
          });
          console.log('Match generation result:', matchResult);
        } catch (matchError) {
          console.error('Error generating matches:', matchError);
          // Don't show error to user, matches can be generated later
        }
      }

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

  // Helper functions for offline support
  const loadCachedQuestions = async (): Promise<Question[]> => {
    try {
      const { value } = await Preferences.get({ key: 'cached_compatibility_questions' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error loading cached questions:', error);
      return [];
    }
  };

  const cacheQuestions = async (questions: Question[]) => {
    try {
      await Preferences.set({
        key: 'cached_compatibility_questions',
        value: JSON.stringify(questions)
      });
    } catch (error) {
      console.error('Error caching questions:', error);
    }
  };

  const saveAnswerLocally = async (questionId: string, value: number) => {
    try {
      const { value: existingAnswers } = await Preferences.get({
        key: `compatibility_answers_${userId}`
      });
      const answers = existingAnswers ? JSON.parse(existingAnswers) : {};
      answers[questionId] = value;

      await Preferences.set({
        key: `compatibility_answers_${userId}`,
        value: JSON.stringify(answers)
      });
    } catch (error) {
      console.error('Error saving answer locally:', error);
    }
  };

  const loadSavedAnswers = async () => {
    try {
      const { value } = await Preferences.get({ key: `compatibility_answers_${userId}` });
      if (value) {
        const savedAnswers = JSON.parse(value);
        setAnswers(savedAnswers);

        // Resume from where user left off
        const answerCount = Object.keys(savedAnswers).length;
        if (answerCount > 0 && answerCount < questions.length) {
          setCurrentQuestionIndex(answerCount);
        }
      }

      // Load offline answers pending sync
      const { value: offlineValue } = await Preferences.get({
        key: `offline_compatibility_answers_${userId}`
      });
      if (offlineValue) {
        const offlineAnswers = JSON.parse(offlineValue);
        setOfflineAnswers(offlineAnswers);
        setSyncPending(Object.keys(offlineAnswers).length > 0);
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
  };

  const saveOfflineAnswers = async (answers: Record<string, number>) => {
    try {
      await Preferences.set({
        key: `offline_compatibility_answers_${userId}`,
        value: JSON.stringify(answers)
      });
    } catch (error) {
      console.error('Error saving offline answers:', error);
    }
  };

  const syncOfflineAnswers = async () => {
    if (!isOnline || Object.keys(offlineAnswers).length === 0) return;

    try {
      const syncPromises = Object.entries(offlineAnswers).map(([questionId, value]) =>
        supabase
          .from('user_compatibility_answers')
          .upsert({
            user_id: userId,
            question_id: questionId,
            answer_value: value
          })
      );

      await Promise.all(syncPromises);

      // Clear offline answers after successful sync
      setOfflineAnswers({});
      setSyncPending(false);
      await Preferences.remove({ key: `offline_compatibility_answers_${userId}` });

      toast.success('Answers synced successfully!');
    } catch (error) {
      console.error('Error syncing offline answers:', error);
      toast.error('Failed to sync answers');
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  if (loading) {
    return <Spinner message="Loading compatibility questions..." />;
  }

  if (completed) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-safe pt-safe mobile-container">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-card/90 to-card backdrop-blur-sm overflow-hidden mx-2 sm:mx-0 rounded-2xl md:rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-romance/5 via-purple-accent/5 to-transparent"></div>
          <CardContent className="relative text-center py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg transition-all duration-300 hover:scale-105">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-romance to-purple-accent bg-clip-text text-transparent">
              Test Completed!
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base md:text-lg max-w-lg mx-auto leading-relaxed">
              Your personality profile has been calculated. You'll now see compatibility scores when speed dating and discover deeper connections.
            </p>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <Spinner size="h-8 w-8 sm:h-10 sm:w-10" isButtonSpinner={true} />
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground animate-pulse font-medium">
                Preparing your matches...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-safe pt-safe mobile-container">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card/80 to-card backdrop-blur-sm mx-2 sm:mx-0 rounded-2xl md:rounded-3xl">
          <CardContent className="text-center py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Questions Unavailable</h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base md:text-lg max-w-lg mx-auto leading-relaxed">
              The compatibility test questions are not available at the moment. Please try again later.
            </p>
            <Button
              onClick={onBack}
              variant="outline"
              className="min-h-[44px] md:min-h-[48px] px-6 sm:px-8 py-3 rounded-xl border-2 hover:bg-romance/5 hover:border-romance/30 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-romance/50 focus:ring-offset-2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-safe">
      {/* Enhanced Header */}
      <div className="mb-6 sm:mb-8 md:mb-10 pt-safe">
        <div className="bg-gradient-to-r from-romance/5 to-purple-accent/5 backdrop-blur-sm border border-romance/10 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg mobile-container">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-3 sm:mr-4 min-h-[44px] md:min-h-[48px] w-[44px] md:w-[48px] p-0 touch-manipulation hover:bg-romance/10 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm sm:text-base font-medium text-foreground">
                  {answeredCount} of {questions.length} questions completed
                </div>
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <div className="flex items-center gap-1">
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <WifiOff className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-orange-600 font-medium">Offline</span>
                    </div>
                  )}
                  {syncPending && (
                    <span className="text-xs text-orange-600 font-medium bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                      Sync pending
                    </span>
                  )}
                </div>
              </div>
              <Progress value={progress} className="h-3 bg-muted/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Question Card */}
      <Card className="touch-manipulation border-0 shadow-xl bg-gradient-to-br from-card/80 to-card backdrop-blur-sm mx-2 sm:mx-0 rounded-2xl md:rounded-3xl overflow-hidden">
        <CardHeader className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 border-b border-border/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-romance to-purple-accent rounded-xl flex items-center justify-center shadow-lg transition-all duration-200">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-3 text-foreground font-semibold">
                {currentQuestion.question_text}
              </CardTitle>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
                <div className="w-2 h-2 bg-romance rounded-full"></div>
                <span className="text-xs sm:text-sm md:text-base text-muted-foreground capitalize font-medium">
                  {currentQuestion.trait_category.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-foreground mb-2">
                How much do you agree with this statement?
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                Choose the option that best represents your feelings
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 mt-6 sm:mt-8">
              {[1, 2, 3, 4, 5].map((value) => {
                const isSelected = answers[currentQuestion.id] === value;
                return (
                  <Button
                    key={value}
                    variant="outline"
                    className={`
                      min-h-[52px] sm:min-h-[60px] md:min-h-[64px] py-3 sm:py-4 px-3 sm:px-4 md:px-6
                      touch-manipulation transition-all duration-200 text-left
                      border-2 rounded-xl hover:scale-[1.01] active:scale-[0.99]
                      focus:outline-none focus:ring-2 focus:ring-romance/50 focus:ring-offset-2
                      ${isSelected
                        ? 'border-romance bg-romance/10 shadow-lg shadow-romance/20 hover:bg-romance/15'
                        : 'border-border/50 hover:border-romance/30 hover:bg-romance/5'
                      }
                      !text-foreground hover:!text-foreground active:!text-foreground focus:!text-foreground
                    `}
                    onClick={() => handleAnswer(value)}
                    disabled={submitting}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm md:text-base
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-romance text-white shadow-md'
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          {value}
                        </div>
                        <span className="font-medium text-xs sm:text-sm md:text-base text-left leading-tight !text-foreground">
                          {SCALE_LABELS[value as keyof typeof SCALE_LABELS]}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-romance flex-shrink-0" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Progress Info */}
      <div className="mt-6 sm:mt-8 md:mt-10 text-center pb-4 sm:pb-6 mb-safe">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-muted/30 rounded-full border border-border/50 mx-2">
          <CheckCircle className="w-4 h-4 text-romance flex-shrink-0" />
          <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground">
            {answeredCount} of {questions.length} questions completed
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-3 mx-4 leading-relaxed">
          Your responses help us understand your personality and find better matches
        </p>
      </div>
    </div>
  );
}