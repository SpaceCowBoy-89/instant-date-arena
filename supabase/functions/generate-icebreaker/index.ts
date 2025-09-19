import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IcebreakerRequest {
  user_id: string;
  match_id: string;
}

interface UserProfile {
  id: string;
  name?: string;
  bio?: string;
  interests?: string[];
  preferences?: any;
  age?: number;
  location?: any;
}

// Icebreaker templates organized by category
const ICEBREAKER_TEMPLATES = {
  shared_interests: [
    "I noticed we both love {interest}! What got you into it?",
    "Fellow {interest} enthusiast! What's your favorite part about it?",
    "I see {interest} on your profile - that's awesome! Any recommendations?",
    "We both seem passionate about {interest}. What's been your best experience with it?",
    "Cool to see another {interest} lover! What's your go-to when it comes to {interest}?",
  ],

  compliment_based: [
    "Your profile caught my attention - you seem like someone who really knows how to enjoy life!",
    "I love your energy in your photos! What's something that always makes you smile?",
    "You have such an interesting profile! What's the most adventurous thing you've done recently?",
    "Your bio made me smile - you seem like you'd be fun to grab coffee with!",
    "I'm intrigued by your profile! What's something you're really passionate about?",
  ],

  question_based: [
    "If you could have dinner with anyone, living or dead, who would it be and why?",
    "What's the best piece of advice you've ever received?",
    "If you could travel anywhere right now, where would you go?",
    "What's something on your bucket list that you're excited to check off?",
    "What's your idea of a perfect weekend?",
    "If you could learn any skill instantly, what would it be?",
  ],

  location_based: [
    "I see you're in {location}! What's your favorite spot around here?",
    "Fellow {location} local! Any hidden gems you'd recommend?",
    "How are you liking {location}? I'm always looking for new places to explore!",
    "What's the best thing about living in {location}?",
  ],

  age_appropriate: [
    "What's been the highlight of your year so far?",
    "I'm curious - what's something you're looking forward to?",
    "What's keeping you busy these days?",
    "Any exciting plans coming up?",
  ],

  playful: [
    "Quick question: coffee or tea? This might determine our compatibility! ☕",
    "Pineapple on pizza - yay or nay? I need to know where you stand! 🍕",
    "If you were a superhero, what would your power be?",
    "What's your go-to karaoke song? (Please don't say you don't sing!)",
    "Beach vacation or mountain retreat? Help me understand your vibe!",
  ]
};

const INTERESTS_KEYWORDS = {
  fitness: ['gym', 'workout', 'fitness', 'running', 'yoga', 'hiking', 'sports', 'exercise'],
  travel: ['travel', 'adventure', 'explore', 'wanderlust', 'vacation', 'backpacking'],
  food: ['cooking', 'foodie', 'restaurant', 'cuisine', 'coffee', 'wine', 'baking'],
  music: ['music', 'concert', 'festival', 'band', 'guitar', 'piano', 'singing'],
  art: ['art', 'painting', 'drawing', 'photography', 'creative', 'design'],
  books: ['reading', 'books', 'literature', 'writing', 'poetry'],
  movies: ['movies', 'films', 'cinema', 'netflix', 'series', 'tv'],
  tech: ['technology', 'coding', 'programming', 'gaming', 'gadgets'],
  outdoors: ['hiking', 'camping', 'nature', 'outdoors', 'climbing', 'skiing'],
  social: ['friends', 'social', 'party', 'events', 'networking']
};

function extractInterestsFromBio(bio: string): string[] {
  if (!bio) return [];

  const lowerBio = bio.toLowerCase();
  const foundInterests: string[] = [];

  for (const [category, keywords] of Object.entries(INTERESTS_KEYWORDS)) {
    if (keywords.some(keyword => lowerBio.includes(keyword))) {
      foundInterests.push(category);
    }
  }

  return foundInterests;
}

function findSharedInterests(user1: UserProfile, user2: UserProfile): string[] {
  const user1Interests = [
    ...(user1.interests || []),
    ...extractInterestsFromBio(user1.bio || "")
  ];

  const user2Interests = [
    ...(user2.interests || []),
    ...extractInterestsFromBio(user2.bio || "")
  ];

  return user1Interests.filter(interest =>
    user2Interests.some(u2Interest =>
      u2Interest.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(u2Interest.toLowerCase())
    )
  );
}

function getLocationString(location: any): string | null {
  if (!location) return null;

  if (typeof location === 'string') return location;
  if (location.city) return location.city;
  if (location.state) return location.state;
  if (location.country) return location.country;

  return null;
}

function generatePersonalizedIcebreaker(user: UserProfile, match: UserProfile): string {
  const sharedInterests = findSharedInterests(user, match);
  const userLocation = getLocationString(user.location);
  const matchLocation = getLocationString(match.location);

  // Priority 1: Shared interests
  if (sharedInterests.length > 0) {
    const randomInterest = sharedInterests[Math.floor(Math.random() * sharedInterests.length)];
    const template = ICEBREAKER_TEMPLATES.shared_interests[
      Math.floor(Math.random() * ICEBREAKER_TEMPLATES.shared_interests.length)
    ];
    return template.replace(/{interest}/g, randomInterest);
  }

  // Priority 2: Same location
  if (userLocation && matchLocation && userLocation.toLowerCase() === matchLocation.toLowerCase()) {
    const template = ICEBREAKER_TEMPLATES.location_based[
      Math.floor(Math.random() * ICEBREAKER_TEMPLATES.location_based.length)
    ];
    return template.replace(/{location}/g, userLocation);
  }

  // Priority 3: Profile-based compliment
  if (match.bio && match.bio.length > 20) {
    const template = ICEBREAKER_TEMPLATES.compliment_based[
      Math.floor(Math.random() * ICEBREAKER_TEMPLATES.compliment_based.length)
    ];
    return template;
  }

  // Priority 4: Age-appropriate questions
  if (user.age && match.age && Math.abs(user.age - match.age) <= 5) {
    const template = ICEBREAKER_TEMPLATES.age_appropriate[
      Math.floor(Math.random() * ICEBREAKER_TEMPLATES.age_appropriate.length)
    ];
    return template;
  }

  // Priority 5: Playful questions
  const randomCategory = Math.random() < 0.7 ? 'question_based' : 'playful';
  const templates = ICEBREAKER_TEMPLATES[randomCategory];
  return templates[Math.floor(Math.random() * templates.length)];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, match_id }: IcebreakerRequest = await req.json();

    // Validate required fields
    if (!user_id || !match_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id and match_id are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch user profile
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, bio, interests, preferences, age, location')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch match profile
    const { data: matchData, error: matchError } = await supabaseClient
      .from('users')
      .select('id, name, bio, interests, preferences, age, location')
      .eq('id', match_id)
      .single();

    if (matchError || !matchData) {
      return new Response(
        JSON.stringify({ error: "Match profile not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate personalized icebreaker
    const icebreaker = generatePersonalizedIcebreaker(userData, matchData);

    // Log the generation for analytics
    console.log(`Generated icebreaker for user ${user_id} -> match ${match_id}: "${icebreaker}"`);

    return new Response(
      JSON.stringify({
        success: true,
        icebreaker: icebreaker,
        metadata: {
          generated_at: new Date().toISOString(),
          user_id,
          match_id,
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-icebreaker function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);