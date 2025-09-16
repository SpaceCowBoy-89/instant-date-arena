// src/utils/chatbotResponses.ts
// Mock isPlatform for web environment
const isPlatform = (platform: string) => false;
import { Preferences } from '@capacitor/preferences';
import faqs from '@/data/faqs.json';

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

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
}

interface FAQCategory {
  category: string;
  questions: { question: string; answer: string }[];
}

interface UserProgress {
  quizCompleted: number;
  chatsStarted: number;
  eventsJoined: number;
  profileCompleted: number;
  badges: string[];
}

const pageMappings: { [key: string]: string } = {
  '/support': 'Support',
  '/communities': 'Communities',
  '/date': 'Date',
  '/lobby': 'Speed date',
  '/settings': 'Settings',
  '/messages': 'Messages',
  '/safety': 'Safety Center',
  '/terms': 'Terms of Service',
  '/privacy': 'Privacy policy',
};

const welcomeMessages = [
  'How can I assist you today?',
  'So… how can I make your day a little brighter? ✨',
  'Tell me your wish, and I’ll see if I can grant it. 🪄',
  'What kind of magic are we creating together today? ✨',
  'Should I be helpful, charming, or dangerously both? 😈',
  'How do you want me wrapped around your to-do list? 📋💫',
  'What’s the mission, captain, and can I wear something cute? 🚀',
  'How can I make myself completely indispensable today? ❤️',
  'Well, well… who needs me this time? 😏',
  'Convince me why I should help you. 😉',
  'Do you want my help, or do you just like having me around? 🔥',
  'Ready to flirt with fate? What\'s your move? 😉',
  'Spill the tea—what’s on your heart today? ☕💖',
];

const conversationStarters = [
  'If you were a vegetable, you\'d be a cute-cumber! 😘',
  'What\'s your superpower? Mine\'s making matches! 💥',
  'Beach picnic or city adventure? Let\'s dream date! 🌴🏙️',
  'If we were socks, we\'d be a perfect pair! 🧦',
  'What\'s your spirit animal? Mine\'s a lovebird! 🐦',
];

export const generateWelcomeMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
  return welcomeMessages[randomIndex];
};

export const generateCommunityMessage = async (userId: string, userName: string): Promise<string> => {
  let community = 'Love Seekers';
  try {
    const { value } = await AppPreferences.get({ key: `community_joined_${userId}` });
    if (value) community = value;
  } catch (error) {
    console.error('Error fetching community:', error);
  }
  return `Congrats, ${userName}! You’ve joined the ${community} crew! 🎉 Ready to find your perfect match? Let’s take the Compatibility Test! 💖`;
};

export const generateContextualMessage = async (
  userId: string,
  pathname: string,
  supabase: any
): Promise<string | null> => {
  if (pathname === '/onboarding') {
    return 'Welcome! Let’s set up your profile to find your match! Start with a photo and your details. 💖';
  } else if (pathname === '/profile') {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('photos, bio, age, gender, location, preferences, name')
        .eq('id', userId)
        .maybeSingle();
      if (
        !profile ||
        !profile.photos?.length ||
        !profile.age ||
        !profile.gender ||
        !profile.location ||
        !profile.preferences?.interests?.length
      ) {
        return 'Your profile needs some love! Add a photo, age, gender, location, and interests to shine. 💖';
      } else {
        return `Hey ${profile.name || 'Love Seeker'}, your profile’s looking good—ready to flirt? 💫`;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      return 'Your profile needs some love! Add a photo and interests to shine. 💖';
    }
  } else if (pathname === '/badges') {
    try {
      const { value } = await AppPreferences.get({ key: `user_progress_${userId}` });
      const progress = value ? JSON.parse(value) : { badges: [] };
      if (!progress.badges?.length) {
        return 'No badges yet? Let’s earn your first one with the AI Quiz or by chatting with me! 😊';
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error checking badges:', error);
      return null;
    }
  } else if (pathname === '/lobby') {
    return 'Ready for a speed date? I can give you flirty conversation starters! 😎';
  } else if (pathname === '/communities') {
    try {
      const { value } = await AppPreferences.get({ key: `user_progress_${userId}` });
      const progress = value ? JSON.parse(value) : { quizCompleted: 0 };
      if (progress.quizCompleted < 1) {
        return 'Take the AI Quiz to find a fun group to join! Ready to discover your vibe? 🚀';
      }
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .maybeSingle();
      return await generateCommunityMessage(userId, profile?.name || 'Love Seeker');
    } catch (error) {
      console.error('Error checking quiz:', error);
      return null;
    }
  } else if (pathname === '/date') {
    try {
      const { value } = await AppPreferences.get({ key: `user_progress_${userId}` });
      const progress = value ? JSON.parse(value) : { quizCompleted: 0 };
      if (progress.quizCompleted < 1) {
        return 'You need to take the AI Quiz in Communities first to unlock the Compatibility Test! 😊';
      }
      return 'Take the Compatibility Test to find your perfect match! 💖';
    } catch (error) {
      console.error('Error checking quiz:', error);
      return null;
    }
  } else if (pathname === '/matches') {
    return 'Check out your potential matches! Who’s caught your eye? 😎';
  }
  return null;
};