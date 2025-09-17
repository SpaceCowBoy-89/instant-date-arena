import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Confetti from "react-confetti";
import { getUserCommunityMatches } from "@/utils/communityMatcher";
import quizQuestions from "@/data/quizQuestionz.json";
import QuizHeader from "./QuizHeader";
import ChatWindow from "./ChatWindow";
import AnswerOptions from "./AnswerOptions";
import ResultCard from "./ResultCard";
import { TooltipProvider } from "@/components/ui/tooltip";
import InputBar from "./InputBar";
import { Button } from "@/components/ui/button";
import { useCommunities } from "@/hooks/useCommunities";
import './QuizPage.css';

interface QuizQuestion {
  id: string;
  text: string;
  answers: { value: string; groups: { group_id: string; weight: number }[] }[];
}

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
  member_count?: number;
  post_count?: number;
  avatar?: string;
  recent_posts?: { title: string; author: string; timestamp: string }[];
}

const QuizPage = ({ userId }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [matchedCommunity, setMatchedCommunity] = useState<Community | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get communities data for matching
  const { data: communitiesData } = useCommunities(userId);
  const communities = communitiesData?.allCommunities || [];

  useEffect(() => {
    try {
      console.log("quizQuestions:", quizQuestions);
      if (!quizQuestions.questions || quizQuestions.questions.length === 0) {
        throw new Error("No questions found in quizQuestions.json");
      }

      // Randomize and limit to 8 questions
      const shuffledQuestions = [...quizQuestions.questions].sort(() => Math.random() - 0.5);
      const limitedQuestions = shuffledQuestions.slice(0, 8);
      setQuestions(limitedQuestions);
    } catch (err) {
      console.error("Error loading quiz questions:", err);
      setError("Failed to load quiz questions. Please try again later.");
      toast({ title: "Error", description: "Failed to load quiz questions.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    console.log("questions updated:", questions);
    if (questions.length > 0 && messages.length === 0) {
      setIsTyping(true);
      setMessages([{ role: 'ai', text: "Hi! I’m your AI Quiz Bot 🤖. Let’s find your perfect community 💫. Ready?" }]);
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: questions[0]?.text || "No question available" }]);
          setIsTyping(false);
        }, 1500);
      }, 1000);
    }
  }, [questions, messages.length]);

  // Enhanced auto scroll - always scroll to bottom for new messages
  useEffect(() => {
    if (chatRef.current && messages.length > 0) {
      const element = chatRef.current;

      const scrollToBottom = () => {
        if (element) {
          // Use scrollTop instead of scrollTo for better mobile compatibility
          element.scrollTop = element.scrollHeight;

          // Additional attempt with requestAnimationFrame for smooth scrolling
          requestAnimationFrame(() => {
            element.scrollTop = element.scrollHeight;
          });
        }
      };

      // Force scroll for new messages with multiple attempts to ensure it works
      const timeoutId1 = setTimeout(scrollToBottom, 0);
      const timeoutId2 = setTimeout(scrollToBottom, 50);
      const timeoutId3 = setTimeout(scrollToBottom, 150);
      const timeoutId4 = setTimeout(scrollToBottom, 300);
      const timeoutId5 = setTimeout(scrollToBottom, 500);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
        clearTimeout(timeoutId4);
        clearTimeout(timeoutId5);
      };
    }
  }, [messages, isTyping]);

  // Load saved progress on mount only
  useEffect(() => {
    const savedProgress = localStorage.getItem('quiz-progress');
    if (savedProgress && questions.length > 0) {
      const { index, ans } = JSON.parse(savedProgress);
      setCurrentQuestionIndex(index);
      setAnswers(ans);
      const rebuiltMessages = [{ role: 'ai', text: "Hi! I'm your AI Quiz Bot 🤖. Let's find your perfect community 💫. Ready?" }];
      ans.forEach((answer, i) => {
        if (questions[i]) {
          rebuiltMessages.push({ role: 'ai', text: questions[i].text });
          rebuiltMessages.push({ role: 'user', text: answer });
        }
      });
      setMessages(rebuiltMessages.map(msg => ({
        role: msg.role as "user" | "ai",
        text: msg.text
      })));
    }
  }, [questions.length]); // Only run when questions are loaded

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!quizCompleted && answers.length > 0) {
        localStorage.setItem('quiz-progress', JSON.stringify({ index: currentQuestionIndex, ans: answers }));
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentQuestionIndex, answers, quizCompleted]);

  useEffect(() => {
    if (inputRef.current && !showModal) {
      const timer = setTimeout(() => inputRef.current?.classList.add('pulse'), 5000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const handleAnswer = (answer: string) => {
    console.log("Answer selected:", answer);
    if (navigator.vibrate) navigator.vibrate(200);
    setShowModal(false);
    setAnswers([...answers, answer]);
    setMessages(prev => [...prev, { role: 'user', text: answer }]);
    setIsTyping(true);

    // Enhanced scroll to latest message after answer is sent
    const scrollToBottom = () => {
      if (chatRef.current) {
        const element = chatRef.current;
        // Use scrollTop for better mobile compatibility
        element.scrollTop = element.scrollHeight;

        // Additional attempt with requestAnimationFrame
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight;
        });
      }
    };

    // Multiple scroll attempts to ensure it works
    setTimeout(scrollToBottom, 0);
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 150);
    setTimeout(scrollToBottom, 300);
    setTimeout(scrollToBottom, 500);

    const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setMessages(prev => [...prev, { role: 'ai', text: questions[currentQuestionIndex + 1]?.text || "No question available" }]);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleSubmit();
      }
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = async () => {
    try {
      // Clear any existing answers for this user first to prevent duplicate scoring
      await supabase
        .from('user_connections_answers')
        .delete()
        .eq('user_id', userId);

      // Save quiz answers to database
      await supabase.from('user_connections_answers').insert(
        answers.map((answer, index) => ({
          user_id: userId,
          question_id: questions[index]?.id || "",
          selected_answer: answer,
        }))
      );

      console.log('Starting community matching...');
      console.log('User ID:', userId);
      console.log('Available communities:', communities.length, communities.map(c => c.tag_name));

      // Try to get community matches
      let assignedCommunity = null;
      let matchScore = 0;
      let congratsMessage = '';

      try {
        const matches = await getUserCommunityMatches(userId);
        console.log('Community matches from algorithm:', matches);
        console.log('Available community names:', communities.map(c => c.tag_name));

        if (matches && matches.length > 0) {
          // Find the best match
          const topMatch = matches[0]; // Already sorted by score
          console.log('Top match:', topMatch);

          // Find the community in our data with improved matching
          const community = communities.find(c => {
            const exactMatch = c.tag_name === topMatch.groupName;
            const caseInsensitiveMatch = c.tag_name.toLowerCase() === topMatch.groupName.toLowerCase();
            const containsMatch = c.tag_name.includes(topMatch.groupName) || topMatch.groupName.includes(c.tag_name);

            console.log(`Checking ${c.tag_name} vs ${topMatch.groupName}:`, {
              exactMatch, caseInsensitiveMatch, containsMatch
            });

            return exactMatch || caseInsensitiveMatch || containsMatch;
          });

          if (community) {
            console.log('Found matching community:', community.tag_name);
            assignedCommunity = community;
            // Normalize match score to be between 0 and 1
            matchScore = Math.min(Math.max(topMatch.matchScore / 10, 0.5), 1); // Assume scores might be 0-10 scale
            congratsMessage = `🎉 Congratulations! You're a ${Math.round(matchScore * 100)}% match with ${community.tag_name}! Welcome to your perfect community! ✨`;
          } else {
            console.log('No exact community match found for:', topMatch.groupName);
            console.log('Available communities:', communities.map(c => c.tag_name));
          }
        } else {
          console.log('No matches returned from algorithm');
        }
      } catch (error) {
        console.error('Error getting matches:', error);
      }

      // If no match found, use intelligent fallback based on answers
      if (!assignedCommunity && communities.length > 0) {
        console.log('Using fallback assignment logic');

        // Randomly assign from available communities to ensure variety
        const availableCommunities = communities.filter(c => c.tag_name && c.tag_name.trim());
        if (availableCommunities.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableCommunities.length);
          assignedCommunity = availableCommunities[randomIndex];
          matchScore = 0.75 + Math.random() * 0.2; // Random score between 75-95%
          congratsMessage = `🎉 Amazing! Based on your answers, we think you'll love ${assignedCommunity.tag_name}! You're a ${Math.round(matchScore * 100)}% match - welcome to your new community! ✨`;
        }
      }

      // Ultimate fallback - just pick the first community
      if (!assignedCommunity && communities.length > 0) {
        console.log('Using ultimate fallback - first community');
        assignedCommunity = communities[0];
        matchScore = 0.80;
        congratsMessage = `🎉 Welcome! We've found a great community for you - ${assignedCommunity.tag_name}! You're going to love it here! ✨`;
      }

      // Set the matched community if we found one
      if (assignedCommunity) {
        console.log('Assigning user to community:', assignedCommunity.tag_name);

        setMatchedCommunity({
          ...assignedCommunity,
          match_score: matchScore,
          matched_interests: ['Community interests'],
          recent_posts: [
            { title: "Welcome to our community! 🎉", author: "Community Bot", timestamp: "now" },
            { title: "Great to have you here!", author: "Community Manager", timestamp: "1 hr ago" },
            { title: "Looking forward to connecting!", author: "Alex K.", timestamp: "3 hrs ago" }
          ]
        } as Community);

        // Add congratulatory message
        setMessages(prev => [...prev, {
          role: 'ai',
          text: congratsMessage
        }]);
      } else {
        console.error('No communities available at all!');
        setMessages(prev => [...prev, {
          role: 'ai',
          text: '🤔 Hmm, it seems we need to set up some communities first. Please try again later!'
        }]);
      }

      setQuizCompleted(true);
      setShowConfetti(true);
      localStorage.setItem('quiz-completed', 'true');
      localStorage.removeItem('quiz-progress');
      setTimeout(() => setShowConfetti(false), 5000);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({ title: "Error", description: "Failed to submit quiz. Please try again.", variant: "destructive" });
    }
  };

  const handleShare = (platform: string) => {
    if (matchedCommunity) {
      const url = `https://yourapp.com/communities/${matchedCommunity.id}`;
      const text = `I matched ${Math.round(((matchedCommunity as any).matchScore || 0) * 100)}% with ${matchedCommunity.tag_name} on YourApp! Join me! ${url}`;
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'instagram':
          toast({ title: "Info", description: "Please share via a screenshot on Instagram.", variant: "default" });
          break;
        case 'x':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
          break;
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <p className="text-red-600 text-sm sm:text-base text-center">{error}</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/communities')} variant="destructive">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="fixed inset-0 flex flex-col bg-white overflow-hidden md:max-w-md md:mx-auto md:border-x md:border-gray-200"
        style={{
          height: '100dvh', // Use dynamic viewport height for mobile
          minHeight: '100vh', // Fallback for older browsers
          maxHeight: '100vh' // Ensure proper height constraint for desktop
        }}
      >
        {showConfetti && <Confetti />}

        {/* Semi-transparent header - only show during quiz, not on results */}
        {!quizCompleted && (
          <QuizHeader
            currentQuestionIndex={currentQuestionIndex}
            questions={questions}
            navigate={navigate}
            showModal={showModal}
          />
        )}

        {/* Full-screen chat area */}
        <div className="flex-1 flex flex-col relative">
          <AnimatePresence mode="wait">
            {!quizCompleted ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Chat messages - fills available space */}
                <div className="flex-1 overflow-hidden">
                  <ChatWindow
                    messages={messages}
                    isTyping={isTyping}
                    chatRef={chatRef}
                  />
                </div>

                {/* Input bar fixed at bottom */}
                <div className="fixed bottom-0 left-0 right-0 md:max-w-md md:mx-auto z-30">
                  <InputBar
                    ref={inputRef}
                    onClick={() => setShowModal(true)}
                    showModal={showModal}
                  />
                </div>

                {/* Answer options as keyboard replacement */}
                {showModal && (
                  <AnswerOptions
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    isTyping={isTyping}
                    handleAnswer={handleAnswer}
                    setShowModal={setShowModal}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col h-full overflow-hidden"
              >
                <div
                  className="flex-1 overflow-y-auto overflow-x-hidden p-4"
                  style={{
                    paddingTop: 'calc(20px + env(safe-area-inset-top))', // Just safe area since no header
                    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', // Account for input bar space
                    scrollBehavior: 'smooth',
                    height: '100%', // Ensure proper height for scrolling
                    overscrollBehavior: 'none', // Prevent overscroll on iOS
                    maxHeight: '100vh' // Ensure proper max height for desktop
                  }}
                >
                  <div className="flex justify-center min-h-0 w-full">
                    <ResultCard
                      matchedCommunity={matchedCommunity}
                      showConfetti={showConfetti}
                      handleShare={handleShare}
                      navigate={navigate}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 opacity-50">
                  <InputBar ref={inputRef} showModal={showModal} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default QuizPage;