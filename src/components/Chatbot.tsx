// src/components/Chatbot.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateWelcomeMessage, generateBotResponse, generateContextualMessage } from '@/utils/chatbotResponses';
import { Preferences } from '@capacitor/preferences';
import { debounce } from 'lodash';
import { Camera } from '@capacitor/camera';
import { initMLCEngine } from "@/utils/mlcEngine";

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
}

interface ChatbotProps {
  userId: string;
  showChatbot: boolean;
  onToggle: () => void;
  onQuizStart: () => void;
  onCompatibilityTestStart: () => void;
  onMatchesOrSpeedDating: () => void;
  onProfileUpdate: (profile: { photo_url?: string; gender?: string; age?: number; location?: string; interests?: string[] }) => Promise<void>;
}

interface OnboardingState {
  profileCompleted: boolean;
  aiQuizCompleted: boolean;
  compatibilityTestCompleted: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ userId, showChatbot, onToggle, onQuizStart, onCompatibilityTestStart, onMatchesOrSpeedDating, onProfileUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [localProfile, setLocalProfile] = useState<{ photo_url?: string; gender?: string; age?: number; location?: string; interests?: string[] }>({});
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    profileCompleted: false,
    aiQuizCompleted: false,
    compatibilityTestCompleted: false,
  });
  const [mlcEngineStatus, setMlcEngineStatus] = useState('initializing');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load local profile, onboarding state, and history
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const { value: profile } = await Preferences.get({ key: `profile_${userId}` });
        const { value: quizAnswers } = await Preferences.get({ key: `quiz_answers_${userId}` });
        const { value: compatibilityAnswers } = await Preferences.get({ key: `compatibility_answers_${userId}` });
        const { value: history } = await Preferences.get({ key: `chat_history_${userId}` });

        if (profile) {
          const parsedProfile = JSON.parse(profile);
          setLocalProfile(parsedProfile);
          if (parsedProfile.photo_url && parsedProfile.gender && parsedProfile.age && parsedProfile.location && parsedProfile.interests?.length) {
            setOnboardingState((prev) => ({ ...prev, profileCompleted: true }));
          }
        }
        if (quizAnswers) {
          setOnboardingState((prev) => ({ ...prev, aiQuizCompleted: true }));
        }
        if (compatibilityAnswers) {
          setOnboardingState((prev) => ({ ...prev, compatibilityTestCompleted: true }));
        }
        if (history) {
          setConversationHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error('Error loading local data:', error);
      }
    };
    loadLocalData();
  }, [userId]);

  // Initialize MLC Engine
  useEffect(() => {
    const initializeMLCEngine = async () => {
      try {
        await initMLCEngine();
        setMlcEngineStatus('loaded');
        console.log('MLC Engine initialized in Chatbot');
      } catch (error) {
        console.error('MLC Engine init failed in Chatbot:', error);
        setMlcEngineStatus('failed');
      }
    };
    initializeMLCEngine();
  }, []);

  useEffect(() => {
    if (showChatbot) {
      const initMessages = async () => {
        setIsTyping(true);

        try {
          const contextualMessageText = await generateContextualMessage(userId, location.pathname, supabase);
          
          let initialMessage: ChatMessage;
          
          if (contextualMessageText) {
            // Prioritize the contextual nudge if available
            initialMessage = { id: Date.now(), text: contextualMessageText, isUser: false };
          } else {
            // Fall back to welcome if no nudge
            const welcomeText = generateWelcomeMessage();
            initialMessage = { id: Date.now(), text: welcomeText, isUser: false };
          }
          
          setMessages([initialMessage]);
          setConversationHistory([initialMessage]);
        } catch (error) {
          console.error('Error initializing messages:', error);
          const fallbackMessage = { id: Date.now(), text: 'Hey there! How can I help? 😊', isUser: false };
          setMessages([fallbackMessage]);
          setConversationHistory([fallbackMessage]);
        } finally {
          setIsTyping(false);
        }
      };
      initMessages();
    } else {
      setMessages([]);
      setConversationHistory([]);
    }
  }, [showChatbot, location.pathname, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const debouncedGenerateBotResponse = useMemo(
    () => debounce(async (userInput: string) => {
      let mlcEngine;
      try {
        mlcEngine = await initMLCEngine();
      } catch (error) {
        console.error('Failed to load MLC Engine for response generation:', error);
      }

      if (!mlcEngine) {
        return await generateBotResponse(userInput, userId, navigate, conversationHistory); // Original fallback
      }

      try {
        const systemPrompt = "You are Captain Corazón, a flirty, helpful dating chatbot. Respond wittily and keep it fun!";
        const messages = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })),
          { role: 'user', content: userInput },
        ];

        const reply = await mlcEngine.chat.completions.create({
          messages,
          temperature: 0.7,
          max_tokens: 128, // Limit for speed
          stream: false, // Or true for streaming
        });

        return reply.choices[0].message.content;
      } catch (error) {
        console.error('MLC generation error:', error);
        return 'Oops, something went wrong. Please try again! 😊';
      }
    }, 300),
    [conversationHistory, userId, navigate]
  );

  const classifyIntent = async (text: string): Promise<string> => {
    // Fallback to rule-based classification
    const lowerText = text.toLowerCase();
    if (lowerText.includes('badge')) return 'badges';
    if (lowerText.includes('profile')) return 'profile';
    if (lowerText.includes('quiz') || lowerText.includes('ai quiz')) return 'quiz';
    if (lowerText.includes('compatibility') || lowerText.includes('test')) return 'compatibility';
    if (lowerText.includes('match') || lowerText.includes('matches')) return 'matches';
    if (lowerText.includes('speed dat') || lowerText.includes('lobby')) return 'speed-dating';
    if (lowerText.includes('tips') || lowerText.includes('starter') || lowerText.includes('line')) return 'tips';
    // TFJS semantic matching
    try {
      const intents = ['badges', 'profile', 'quiz', 'compatibility', 'matches', 'speed-dating', 'tips', 'faq'];
      const embedding = await getEmbedding([text]);
      const intentEmbeddings = await getEmbedding(intents);
      const similarities = intents.map((_, i) => computeSimilarity(embedding, intentEmbeddings[i]));
      const maxIndex = similarities.indexOf(Math.max(...similarities));
      return intents[maxIndex];
    } catch (error) {
      console.error('TFJS intent classification failed:', error);
      return 'faq';
    }
  };

  const handleOnboarding = (): string => {
    if (!onboardingState.profileCompleted) {
      return "Let’s start with your profile! 📸 Add a photo, gender, age, location, and interests. Type 'Profile' to begin! 😄";
    }
    if (!onboardingState.aiQuizCompleted) {
      return "Profile done! 🎉 Type 'Take quiz' for the AI Quiz! 🧠";
    }
    if (!onboardingState.compatibilityTestCompleted) {
      return "Quiz complete! 🌟 Type 'Take test' for the Compatibility Test! ✨";
    }
    return "You’re all set! 🚀 Type 'Matches' to find your perfect date! 💖";
  };

  const handleProfileSetup = async (text: string): Promise<string> => {
    if (text.toLowerCase().includes('photo')) {
      try {
        const { dataUrl } = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: 'DataUrl',
        });
        const { error } = await onProfileUpdate({ photo_url: dataUrl });
        if (error) throw error;
        setLocalProfile((prev) => ({ ...prev, photo_url: dataUrl }));
        return "Photo added! 📸 What’s next? Gender, age, location, or interests? 😊";
      } catch (error) {
        console.error('Photo upload error:', error);
        return "Oops, photo upload failed. Try again! 📸";
      }
    }
    if (text.toLowerCase().includes('gender')) {
      const gender = text.split(' ')[1];
      await onProfileUpdate({ gender });
      setLocalProfile((prev) => ({ ...prev, gender }));
      return `Gender set to ${gender}! 🌈 Next? Age, location, or interests?`;
    }
    if (text.toLowerCase().includes('age')) {
      const age = parseInt(text.split(' ')[1], 10);
      await onProfileUpdate({ age });
      setLocalProfile((prev) => ({ ...prev, age }));
      return `Age set to ${age}! 🎂 What’s your location or interests?`;
    }
    if (text.toLowerCase().includes('location')) {
      const location = text.split(' ').slice(1).join(' ');
      await onProfileUpdate({ location });
      setLocalProfile((prev) => ({ ...prev, location }));
      return `Location set to ${location}! 🌍 Now, interests?`;
    }
    if (text.toLowerCase().includes('interests')) {
      const interests = text.split(' ').slice(1).join(' ').split(',');
      await onProfileUpdate({ interests });
      setLocalProfile((prev) => ({ ...prev, interests }));
      setOnboardingState((prev) => ({ ...prev, profileCompleted: true }));
      return "Profile saved! 🎈 Now type 'Take quiz' to start the AI Quiz! 🧠";
    }
    return "Let’s build your profile! Try 'photo', 'gender male', 'age 25', 'location New York', or 'interests music, travel'. 😄";
  };

  const handleAIQuiz = (): string => {
    if (!onboardingState.profileCompleted) {
      return "Hold up! 😊 Complete your profile first by typing 'Profile'.";
    }
    onQuizStart();
    setOnboardingState((prev) => ({ ...prev, aiQuizCompleted: true }));
    return "Awesome! Head to the AI Quiz to show off your vibe! 🧠 You’ve got this!";
  };

  const handleCompatibilityTest = (): string => {
    if (!onboardingState.profileCompleted) {
      return "Whoops! Finish your profile first by typing 'Profile'. 😄";
    }
    if (!onboardingState.aiQuizCompleted) {
      return "You need to take the AI Quiz first! Type 'Take quiz' to get started. 🧠";
    }
    onCompatibilityTestStart();
    setOnboardingState((prev) => ({ ...prev, compatibilityTestCompleted: true }));
    return "Time to shine! ✨ Head to the Compatibility Test to find your perfect match!";
  };

  const handleMatchesOrSpeedDating = (): string => {
    if (!onboardingState.profileCompleted) {
      return "Almost there! Complete your profile first by typing 'Profile'. 😊";
    }
    if (!onboardingState.aiQuizCompleted) {
      return "You need to take the AI Quiz first! Type 'Take quiz' to start. 🧠";
    }
    if (!onboardingState.compatibilityTestCompleted) {
      return "One more step! Take the Compatibility Test by typing 'Take test'. ✨";
    }
    onMatchesOrSpeedDating();
    return "Woohoo! You’re ready to meet your matches or try speed dating! 💖 Go for it!";
  };

  const handleHelp = (): string => {
    return "Need a hand? 😎 For profile setup, try 'Profile'. For the quiz, type 'Take quiz'. For matches, type 'Matches'. Ask away!";
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { id: Date.now(), text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    const newHistory = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);
    setIsTyping(true);

    try {
      const botText = await debouncedGenerateBotResponse(input);
      const botMessage = { id: Date.now(), text: botText, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
      setConversationHistory((prev) => [...prev, botMessage]);
      await Preferences.set({ key: `chat_history_${userId}`, value: JSON.stringify([...newHistory, botMessage]) });

      // Check for Chat Champ Badge (5+ messages in session)
      if (newHistory.filter(msg => msg.isUser).length >= 5) {
        const progress = await getUserProgress();
        if (!progress.badges.includes('Chat Champ')) {
          progress.badges.push('Chat Champ');
          await Preferences.set({ key: `user_progress_${userId}`, value: JSON.stringify(progress) });
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: 'Wow, you’re a Chat Champ! 🎉 Check your new badge at [Badges](#badges)!', isUser: false },
          ]);
        }
      }

      // Check for Offline Romeo/Juliet Badge
      if (!navigator.onLine) {
        const progress = await getUserProgress();
        if (!progress.badges.includes('Offline Romeo/Juliet')) {
          progress.badges.push('Offline Romeo/Juliet');
          await Preferences.set({ key: `user_progress_${userId}`, value: JSON.stringify(progress) });
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: 'Chatting offline? You’re my star-crossed lover! 💞 See your badge at [Badges](#badges)!', isUser: false },
          ]);
        }
      }
    } catch (error) {
      console.error('Error generating bot response:', error);
      const errorMessage: ChatMessage = {
        id: Date.now(),
        text: 'Oops, something went wrong. Please try again! 😊',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setConversationHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setInput('');
    }
  };

  const getUserProgress = async () => {
    const { value } = await Preferences.get({ key: `user_progress_${userId}` });
    return value ? JSON.parse(value) : { quizCompleted: 0, chatsStarted: 0, eventsJoined: 0, profileCompleted: 0, badges: [] };
  };

  if (!showChatbot) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 w-80 sm:w-96 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 p-6 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col z-50 transition-all duration-300">
      <Button
        variant="ghost"
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={onToggle}
        aria-label="Close chatbot"
      >
        <X size={16} />
      </Button>
      <div className="flex items-center mb-4">
        <Heart className="text-3xl animate-pulse text-red-500 mr-3" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Captain Corazón</h2>
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">MLC: {mlcEngineStatus}</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 bg-white/30 dark:bg-black/30 rounded-lg p-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            {!msg.isUser && <Heart className="text-2xl animate-pulse text-red-500 mr-2 self-end" />}
            <div
              className={`max-w-[70%] p-3 rounded-2xl ${
                msg.isUser
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200'
              } shadow-sm`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 flex items-center">
              <span className="typing-dots">Typing</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-3 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Captain Corazón something..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="rounded-full bg-white/50 dark:bg-gray-800/50 border-none focus:ring-2 focus:ring-pink-500 text-gray-800 dark:text-gray-200"
        />
        <Button
          onClick={handleSend}
          className="rounded-full bg-pink-500 hover:bg-pink-600 dark:bg-pink-400 dark:hover:bg-pink-500 text-white"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chatbot;