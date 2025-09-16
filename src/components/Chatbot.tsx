import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, X } from 'lucide-react';
// Mock isPlatform for web environment
const isPlatform = (platform: string) => false;
import { Preferences } from '@capacitor/preferences';
import { generateWelcomeMessage, generateContextualMessage } from '@/utils/chatbotResponses';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedChatbotEngine as ChatbotEngine } from '@/services/chatbot-engine';
import CaptainCorazonAvatar from '@/assets/captain-corazon-avatar.svg';
import '../styles/Avatar.css';

// Mock Preferences for web environment
const isWeb = !isPlatform('ios') && !isPlatform('android');
const MockPreferences = {
  get: async ({ key }: { key: string }) => {
    console.log(`Mock Preferences get: ${key}`);
    return { value: localStorage.getItem(key) || null };
  },
  set: async ({ key, value }: { key: string; value: string }) => {
    console.log(`Mock Preferences set: ${key} = ${value}`);
    localStorage.setItem(key, value);
  },
};
const AppPreferences = isWeb ? MockPreferences : Preferences;

// Enhanced Chatbot Engine
let chatbotEngine: ChatbotEngine;

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
  const [chatbotStatus, setChatbotStatus] = useState('ready');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Function to render message text with clickable links
  const renderMessageText = (text: string) => {
    // Replace [text](#route) with clickable links
    const linkRegex = /\[([^\]]+)\]\(#([^)]+)\)/g;
    const parts = text.split(linkRegex);

    const elements = [];
    for (let i = 0; i < parts.length; i += 3) {
      // Add regular text
      if (parts[i]) {
        elements.push(<span key={i}>{parts[i]}</span>);
      }
      // Add clickable link
      if (parts[i + 1] && parts[i + 2]) {
        const linkText = parts[i + 1];
        const route = parts[i + 2];
        elements.push(
          <button
            key={i + 1}
            onClick={() => navigate(`/${route}`)}
            className="text-blue-400 hover:text-blue-300 underline font-medium bg-transparent border-none p-0 cursor-pointer"
          >
            {linkText}
          </button>
        );
      }
    }
    return elements.length > 1 ? <>{elements}</> : text;
  };

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const { value: profile } = await AppPreferences.get({ key: `profile_${userId}` });
        const { value: quizAnswers } = await AppPreferences.get({ key: `quiz_answers_${userId}` });
        const { value: compatibilityAnswers } = await AppPreferences.get({ key: `compatibility_answers_${userId}` });
        const { value: history } = await AppPreferences.get({ key: `chat_history_${userId}` });
        const { value: welcomeShown } = await AppPreferences.get({ key: `community_welcome_shown_${userId}` });
        const { value: matchWelcomeShown } = await AppPreferences.get({ key: `match_welcome_shown_${userId}` });
        const { value: quizNudgeCount } = await AppPreferences.get({ key: `quiz_nudge_count_${userId}` });
        const { value: matchNudgeCount } = await AppPreferences.get({ key: `match_nudge_count_${userId}` });

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

        // Contextual welcome message for Communities
        if (showChatbot && location.pathname === '/communities' && !welcomeShown) {
          const welcomeMessage = {
            id: Date.now(),
            text: 'Hey, welcome to Communities! 😊 Want to join a group, check out posts, or learn about events? Ask me!',
            isUser: false,
          };
          setMessages([welcomeMessage]);
          setConversationHistory([welcomeMessage]);
          await AppPreferences.set({ key: `community_welcome_shown_${userId}`, value: 'true' });
        }

        // Contextual welcome message for Matches
        if (showChatbot && location.pathname === '/matches' && !matchWelcomeShown) {
          const welcomeMessage = {
            id: Date.now(),
            text: 'Welcome to Matches! 💖 Found a spark? Try messaging your top match or ask me for tips!',
            isUser: false,
          };
          setMessages([welcomeMessage]);
          setConversationHistory([welcomeMessage]);
          await AppPreferences.set({ key: `match_welcome_shown_${userId}`, value: 'true' });
        }

        // Quiz nudge for Communities
        if (showChatbot && !onboardingState.aiQuizCompleted && location.pathname === '/communities' && (!quizNudgeCount || parseInt(quizNudgeCount) < 3)) {
          const nudgeCount = quizNudgeCount ? parseInt(quizNudgeCount) + 1 : 1;
          await AppPreferences.set({ key: `quiz_nudge_count_${userId}`, value: nudgeCount.toString() });
          setTimeout(() => {
            const quizNudge = {
              id: Date.now(),
              text: 'I see you haven’t taken the quiz yet—want to unlock personalized group suggestions in just 1 min? 🚀',
              isUser: false,
            };
            setMessages(prev => [...prev, quizNudge]);
            setConversationHistory(prev => [...prev, quizNudge]);
          }, 2000);
        }

        // Match nudge for Matches
        if (showChatbot && onboardingState.compatibilityTestCompleted && location.pathname === '/matches' && (!matchNudgeCount || parseInt(matchNudgeCount) < 3)) {
          const nudgeCount = matchNudgeCount ? parseInt(matchNudgeCount) + 1 : 1;
          await AppPreferences.set({ key: `match_nudge_count_${userId}`, value: nudgeCount.toString() });
          setTimeout(async () => {
            const { data } = await supabase.functions.invoke('compatibility-matchmaker', {
              body: { user_id: userId, limit: 1 }
            });
            const topMatch = data.matches?.[0];
            const matchNudge = {
              id: Date.now(),
              text: topMatch
                ? `Wow, ${topMatch.name} is a ${Math.round(topMatch.compatibility_score * 100)}% match! Try messaging them to spark a connection! 💕`
                : 'Ready to connect? Pick a match and send a message to get started!',
              isUser: false,
            };
            setMessages(prev => [...prev, matchNudge]);
            setConversationHistory(prev => [...prev, matchNudge]);
          }, 2000);
        }

        // Offline nudge
        if (!navigator.onLine && showChatbot) {
          const offlineMessage = {
            id: Date.now(),
            text: 'Offline? You can still view your matches or communities! Connect to send messages or join groups. 😊',
            isUser: false,
          };
          setMessages(prev => [...prev, offlineMessage]);
          setConversationHistory(prev => [...prev, offlineMessage]);
        }
      } catch (error) {
        console.error('Error loading local data:', error);
      }
    };
    loadLocalData();

    const initializeChatbotEngine = async () => {
      try {
        chatbotEngine = new ChatbotEngine();

        // Only show loading status if initialization takes time
        let hasStarted = false;
        const startTimer = setTimeout(() => {
          hasStarted = true;
          setChatbotStatus('initializing');
        }, 100);

        const success = await chatbotEngine.initialize({
          onProgress: (progress) => {
            if (hasStarted) setLoadingProgress(progress);
          },
          onStatusChange: (status) => {
            if (hasStarted) setChatbotStatus(status);
          }
        });

        clearTimeout(startTimer);

        if (success) {
          setChatbotStatus('ready');
          console.log('Enhanced Chatbot Engine initialized successfully');
        } else {
          setChatbotStatus('fallback');
          console.log('Using fallback chatbot responses');
        }
      } catch (error) {
        console.error('Chatbot Engine initialization failed:', error);
        setChatbotStatus('fallback');
      }
    };
    initializeChatbotEngine();
  }, [userId, showChatbot, location.pathname]);

  useEffect(() => { let inactivityTimer: NodeJS.Timeout; (async () => { if (location.pathname === '/communities' && !showChatbot) { const { value: autoOpened } = await AppPreferences.get({ key: `chatbot_auto_opened_${userId}` }); if (!autoOpened) { inactivityTimer = setTimeout(() => { document.querySelector('.chatbot-trigger')?.classList.add('animate-pulse'); setTimeout(() => { onToggle(); const inactivityMessage = { id: Date.now(), text: 'Not sure where to start? I can guide you through communities—ask me anything! 😊', isUser: false, }; setMessages(prev => [...prev, inactivityMessage]); setConversationHistory(prev => [...prev, inactivityMessage]); AppPreferences.set({ key: `chatbot_auto_opened_${userId}`, value: 'true' }); }, 5000); }, 60000); } } })(); return () => clearTimeout(inactivityTimer); }, [location.pathname, showChatbot, userId, onToggle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { id: Date.now(), text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    const newHistory = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);
    setIsTyping(true);

    try {
      // Build conversation context for enhanced responses
      const context = {
        currentPage: location.pathname,
        onboardingStage: onboardingState.profileCompleted ? 'profile_complete' : 'onboarding',
        profileCompleteness: onboardingState.profileCompleted ? 100 : 50,
        lastTopic: conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].text : '',
        userProfile: localProfile,
        conversationHistory: conversationHistory.slice(-5) // Last 5 messages for context
      };
      
      const response = await chatbotEngine.generateResponse(input, context);
      const botMessage: ChatMessage = { id: Date.now(), text: response.text, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
      setConversationHistory((prev) => [...prev, botMessage]);
      await AppPreferences.set({ key: `chat_history_${userId}`, value: JSON.stringify([...newHistory, botMessage]) });

      // Check for Chat Champ Badge
      if (newHistory.filter(msg => msg.isUser).length >= 5) {
        const progress = await getUserProgress();
        if (!progress.badges.includes('Chat Champ')) {
          progress.badges.push('Chat Champ');
          await AppPreferences.set({ key: `user_progress_${userId}`, value: JSON.stringify(progress) });
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
          await AppPreferences.set({ key: `user_progress_${userId}`, value: JSON.stringify(progress) });
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
    const { value } = await AppPreferences.get({ key: `user_progress_${userId}` });
    return value
      ? JSON.parse(value)
      : { quizCompleted: 0, chatsStarted: 0, eventsJoined: 0, profileCompleted: 0, messages_sent: 0, feedback_count: 0, badges: [], boosts_earned: 0 };
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
        <img src={CaptainCorazonAvatar} alt="Captain Corazón" className="avatar mr-3" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Captain Corazón</h2>
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          {chatbotStatus === 'initializing' ? `Loading: ${loadingProgress}%` : 
           chatbotStatus === 'ready' ? 'AI Ready' :
           chatbotStatus === 'fallback' ? 'Offline Mode' : chatbotStatus}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 bg-white/30 dark:bg-black/30 rounded-lg p-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-3`} aria-live="polite">
            {!msg.isUser && <Heart className="text-2xl animate-pulse text-red-500 mr-2 self-end" />}
            <div
              className={`max-w-[70%] p-3 rounded-2xl ${
                msg.isUser
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200'
              } shadow-sm`}
            >
              {renderMessageText(msg.text)}
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
          aria-label="Chat with Captain Corazón"
        />
        <Button
          onClick={handleSend}
          className="rounded-full bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300"
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chatbot;