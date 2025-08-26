import { Preferences } from '@capacitor/preferences';
import { NavigateFunction } from 'react-router-dom';
import faqs from '@/data/faqs.json';
import { getEmbedding, computeSimilarity, checkToxicity, analyzeBio, getWittyVariant, classifyVibe, getMatchTeaser } from '@/utils/tfjsUtils';
import * as tf from '@tensorflow/tfjs';

tf.setBackend('webgl').catch((err) => {
  console.warn('WebGL unavailable, falling back to CPU:', err);
  tf.setBackend('cpu');
});

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
  'Spill the tea—what\'s on your heart today? ☕💖',
];

const conversationStarters = [
  'If you were a vegetable, you\'d be a cute-cumber! 😘',
  'What\'s your superpower? Mine\'s making matches! 💥',
  'Beach picnic or city adventure? Let\'s dream date! 🌴🏙️',
  'If we were socks, we\'d be a perfect pair! 🧦',
  'What\'s your spirit animal? Mine\'s a lovebird! 🐦',
];

export const classifyIntent = async (input: string): Promise<string> => {
  const lowerInput = input.toLowerCase();
  // Keyword fallback
  if (lowerInput.includes('badge')) return 'badges';
  if (lowerInput.includes('profile')) return 'profile';
  if (lowerInput.includes('quiz') || lowerInput.includes('ai quiz')) return 'quiz';
  if (lowerInput.includes('compatibility') || lowerInput.includes('test')) return 'compatibility';
  if (lowerInput.includes('match') || lowerInput.includes('matches')) return 'matches';
  if (lowerInput.includes('speed dat') || lowerInput.includes('lobby')) return 'speed-dating';
  if (lowerInput.includes('tips') || lowerInput.includes('starter') || lowerInput.includes('line')) return 'tips';
  // TFJS semantic matching
  try {
    const intents = ['badges', 'profile', 'quiz', 'compatibility', 'matches', 'speed-dating', 'tips', 'faq'];
    const embedding = await getEmbedding([input]);
    const intentEmbeddings = await getEmbedding(intents);
    const similarities = intents.map((_, i) => computeSimilarity(embedding, intentEmbeddings[i]));
    const maxIndex = similarities.indexOf(Math.max(...similarities));
    return intents[maxIndex];
  } catch (error) {
    console.error('TFJS intent classification failed:', error);
    return 'faq';
  }
};

export const handleFAQ = (input: string): string => {
  const lowerInput = input.toLowerCase();
  for (const category of faqs as FAQCategory[]) {
    const match = category.questions.find(
      (q) => lowerInput.includes(q.question.toLowerCase()) || lowerInput.includes(category.category.toLowerCase())
    );
    if (match) {
      let answer = match.answer;
      Object.entries(pageMappings).forEach(([url, displayName]) => {
        const regex = new RegExp(`\\[${displayName}\\]\\(#${url.slice(1)}\\)|${url}`, 'gi');
        answer = answer.replace(regex, displayName);
      });
      return answer;
    }
  }
  return 'I can answer questions like "What is SpeedHeart?" or "How do I earn the Chat Champ Badge?". Try one or visit Support! 😊';
};

export const generateWelcomeMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
  return welcomeMessages[randomIndex];
};

export const generateCommunityMessage = async (userId: string, userName: string): Promise<string> => {
  let community = 'Love Seekers';
  try {
    const { value } = await Preferences.get({ key: `community_joined_${userId}` });
    if (value) community = value;
  } catch (error) {
    console.error('Error fetching community:', error);
  }
  return `Congrats, ${userName}! You’ve joined the ${community} crew! 🎉 Ready to find your perfect match? Let’s take the Compatibility Test! 💖`;
};

export const generateBotResponse = async (
  userInput: string,
  userId: string,
  navigate: NavigateFunction,
  history: ChatMessage[]
): Promise<string> => {
  const inputLower = userInput.toLowerCase();
  let progress: UserProgress = { quizCompleted: 0, chatsStarted: 0, eventsJoined: 0, profileCompleted: 0, badges: [] };

  try {
    const { value } = await Preferences.get({ key: `user_progress_${userId}` });
    progress = value ? JSON.parse(value) : progress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
  }

  // Toxicity check
  const isPositive = await checkToxicity(userInput);
  if (!isPositive) {
    return 'Let\'s keep it flirty and fun! 😘 What else can I help with?';
  }

  const intent = await classifyIntent(userInput);
  let responseText = '';
  let badgeEarned: string | null = null;

  switch (intent) {
    case 'profile':
      // Removed navigate('/profile');
      responseText = 'Let’s make your profile irresistible! Add a photo, your age, gender, location, and some spicy interests. Want flirty tips, cutie? 😊';
      break;
    case 'badges':
      // Removed navigate('/badges');
      responseText = `Your badges are waiting to shine! You’ve got ${progress.badges?.length || 0} so far. Wanna grab more? Try "Take quiz" or "Join an event".`;
      break;
    case 'quiz':
      // Removed navigate('/communities');
      responseText = 'Dive into the AI Quiz in Communities to find your perfect vibe! Ready to spark some magic? 🚀';
      break;
    case 'compatibility':
      if (progress.quizCompleted < 1) {
        // Removed navigate('/communities');
        responseText = 'Hold up, love! Take the AI Quiz first to unlock the Compatibility Test. Off to Communities you go! 😊';
      } else {
        // Removed navigate('/date');
        responseText = 'Ready to find your soulmate? Take the Compatibility Test on the Date page! 💖';
      }
      break;
    case 'matches':
      // Removed navigate('/matches');
      const teaser = await getMatchTeaser(userId);
      responseText = `Ooh, spying on matches? 😏 Here’s a hot tip: ${teaser}. Head to /matches for the juicy details!`;
      break;
    case 'speed-dating':
      // Removed navigate('/lobby');
      const starterIndex = Math.floor(Math.random() * conversationStarters.length);
      responseText = `Ready to charm in Speed Dating? Try this line: '${conversationStarters[starterIndex]}' Want more flirty ideas? Tell me your vibe! 😏`;
      break;
    case 'tips':
      const vibe = await classifyVibe(userInput);
      const tailoredStarter = conversationStarters.find(s => s.toLowerCase().includes(vibe)) || conversationStarters[0];
      responseText = `I’m feeling your ${vibe} energy! Try this: '${tailoredStarter}' 😘 Need another heart-stealer?`;
      badgeEarned = 'Flirty Master'; // Award Flirty Master Badge
      break;
    case 'faq':
      responseText = handleFAQ(userInput);
      break;
    default:
      responseText = 'I’m your wingman for profiles, quizzes, matches, or flirty tips! Try "Profile", "Take quiz", or "Help". 😘';
  }

  // Award badges
  if (badgeEarned) {
    const currentBadges = progress.badges || [];
    if (!currentBadges.includes(badgeEarned)) {
      await Preferences.set({
        key: `user_progress_${userId}`,
        value: JSON.stringify({ ...progress, badges: [...currentBadges, badgeEarned] }),
      });
      responseText += ` Congrats, you earned the ${badgeEarned} Badge! 🎉 Check it at [Badges](#badges).`;
    }
  }

  // Check for Vibe Seeker Badge (response to vibe question)
  if (history.length > 2 && history[history.length - 2].text.includes('Tell me your vibe')) {
    const currentBadges = progress.badges || [];
    if (!currentBadges.includes('Vibe Seeker')) {
      await Preferences.set({
        key: `user_progress_${userId}`,
        value: JSON.stringify({ ...progress, badges: [...currentBadges, 'Vibe Seeker'] }),
      });
      responseText += ' You earned the Vibe Seeker Badge! 🌟 See it at [Badges](#badges).';
    }
  }

  // Check for Dream Date Planner Badge
  if (inputLower.includes('dream date')) {
    const currentBadges = progress.badges || [];
    if (!currentBadges.includes('Dream Date Planner')) {
      await Preferences.set({
        key: `user_progress_${userId}`,
        value: JSON.stringify({ ...progress, badges: [...currentBadges, 'Dream Date Planner'] }),
      });
      responseText += ' You’re a Dream Date Planner! 😘 Check your new badge at [Badges](#badges).';
    }
  }

  // Enhance with flirty variant
  try {
    responseText = await getWittyVariant(responseText, userInput);
  } catch (error) {
    console.error('Error getting flirty variant:', error);
  }

  // Retention nudge
  if (history.length > 2) {
    const lastUserInput = history[history.length - 2].text;
    const nudgeIntent = await classifyIntent(lastUserInput);
    responseText += ` Got a crush yet? 😘 What’s next—${nudgeIntent} tips? 🌟`;
    if (inputLower.includes('dream date')) {
      // Placeholder for Supabase update
      // await supabase.from('users').update({ preferences: { dreamDate: userInput } }).eq('id', userId);
    }
  } else {
    responseText += ' Quiz unlocked? Sweet! What’s your dream date—candlelit dinner or starry hike? 🕯️🌌';
  }

  return responseText;
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
        const analysis = await analyzeBio(profile.bio || '');
        return `Hey ${profile.name || 'Love Seeker'}, your bio's cute, but let's amp it up—${analysis} 💫`;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      return 'Your profile needs some love! Add a photo and interests to shine. 💖';
    }
  } else if (pathname === '/badges') {
    try {
      const { value } = await Preferences.get({ key: `user_progress_${userId}` });
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
      const { value } = await Preferences.get({ key: `user_progress_${userId}` });
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
      const { value } = await Preferences.get({ key: `user_progress_${userId}` });
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