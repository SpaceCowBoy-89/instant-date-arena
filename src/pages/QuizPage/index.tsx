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

const communities = []; // Assume this is defined elsewhere or fetched

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
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
        }
      };

      // Force scroll for new messages with multiple attempts to ensure it works
      const timeoutId1 = setTimeout(scrollToBottom, 50);
      const timeoutId2 = setTimeout(scrollToBottom, 200);
      const timeoutId3 = setTimeout(scrollToBottom, 500);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
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
        chatRef.current.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    // Multiple scroll attempts to ensure it works
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 200);
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
      await supabase.from('user_connections_answers').insert(
        answers.map((answer, index) => ({
          user_id: userId,
          question_id: questions[index]?.id || "",
          selected_answer: answer,
        }))
      );
      const matches = await getUserCommunityMatches(userId);
      const topMatch = matches.reduce((max, curr) => (max.matchScore || 0) > (curr.matchScore || 0) ? max : curr, matches[0]);
      const community = communities.find(c => c.tag_name === topMatch.groupName) || null;
      if (community) {
        setMatchedCommunity({
          ...community,
          matchScore: topMatch.matchScore,
          matched_interests: topMatch.matchedInterests,
        } as Community);
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
      <div className="fixed inset-0 flex flex-col bg-white overflow-hidden md:max-w-md md:mx-auto md:border-x md:border-gray-200">
        {showConfetti && <Confetti />}

        {/* Semi-transparent header */}
        <QuizHeader
          currentQuestionIndex={currentQuestionIndex}
          questions={questions}
          navigate={navigate}
          showModal={showModal}
        />

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
                className="flex flex-col h-full"
              >
                <div className="flex-1 flex items-center justify-center p-4">
                  <ResultCard
                    matchedCommunity={matchedCommunity}
                    showConfetti={showConfetti}
                    handleShare={handleShare}
                    navigate={navigate}
                  />
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