import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot } from "lucide-react";

interface AIQuizProps {
  userId: string;
  onQuizComplete: (groupName: string) => void;
}

// Questions from the provided list - expanded to have enough for random selection
const ALL_QUESTIONS = [
  {
    question: "What fictional world would you take a date to?",
    answers: [
      { text: "Hogwarts — casting flirty spells in the Forbidden Forest.", groups: ["Book Lovers"] },
      { text: "Middle-earth — hiking the Shire with second breakfasts.", groups: ["Adventurers", "Foodies"] },
      { text: "Cyberpunk city — hacking the skyline for a neon date.", groups: ["Tech Hobbyists"] },
      { text: "Anime world — cosplaying as sidekicks in a Ghibli forest.", groups: ["Anime Addicts"] }
    ]
  },
  {
    question: "How do you respond to 'wyd?' texts?",
    answers: [
      { text: "Crafting a flirty haiku in my Notes app.", groups: ["Book Lovers"] },
      { text: "Brewing kombucha and overanalyzing your last message.", groups: ["Foodies"] },
      { text: "Building a robot that sends better replies than me.", groups: ["Tech Hobbyists"] },
      { text: "Sketching your vibe in my bullet journal.", groups: ["Creators"] }
    ]
  },
  {
    question: "What's your idea of romantic revenge?",
    answers: [
      { text: "Posting my bonsai thriving better than their vibes.", groups: ["Nature Lovers"] },
      { text: "Winning at disc golf and dedicating it to my ex.", groups: ["Sports Enthusiasts"] },
      { text: "Sending a playlist of breakup songs I composed.", groups: ["Music & Performance"] },
      { text: "Collecting rare coins and flexing my better investments.", groups: ["Collectors"] }
    ]
  },
  {
    question: "Which nerdy debate could you argue for hours?",
    answers: [
      { text: "Marvel vs. DC — my comic collection backs my argument.", groups: ["Anime Addicts"] },
      { text: "Best board game strategy — I've got spreadsheets.", groups: ["Gamers"] },
      { text: "Is time travel ethical? I'll cite sci-fi novels.", groups: ["Book Lovers"] },
      { text: "Analog vs. digital photography — I'm team film.", groups: ["Creators"] }
    ]
  },
  {
    question: "What's something low-key romantic you do?",
    answers: [
      { text: "Saving your favorite flower in my pressed collection.", groups: ["Creators"] },
      { text: "Brewing you a custom tea blend for cozy nights.", groups: ["Foodies"] },
      { text: "Planning a stargazing date with my telescope.", groups: ["Nature Lovers"] },
      { text: "Knitting you a scarf with secret flirty patterns.", groups: ["Creators"] }
    ]
  },
  {
    question: "If love was a video game, what's your special ability?",
    answers: [
      { text: "Crafting perfect date plans with +50% charm.", groups: ["Creators"] },
      { text: "Geocaching your heart with precision accuracy.", groups: ["Adventurers"] },
      { text: "Mixing flirty cocktails for instant vibe boosts.", groups: ["Foodies"] },
      { text: "Writing love notes that crit hit emotions.", groups: ["Book Lovers"] }
    ]
  },
  {
    question: "What's your chaotic good dating habit?",
    answers: [
      { text: "Planning a hiking date but getting lost on purpose.", groups: ["Adventurers"] },
      { text: "Singing off-key karaoke to make you laugh.", groups: ["Music & Performance"] },
      { text: "Gifting a quirky seashell from my collection.", groups: ["Collectors"] },
      { text: "Texting you birdwatching photos at 6 a.m.", groups: ["Nature Lovers"] }
    ]
  },
  {
    question: "What would your relationship villain name be?",
    answers: [
      { text: "The Quilter of Chaos — stitching drama lovingly.", groups: ["Creators"] },
      { text: "Captain Kayak Ghost — I paddle away silently.", groups: ["Adventurers"] },
      { text: "DJ Heartbreak — spinning breakup beats.", groups: ["Music & Performance"] },
      { text: "The Coin Collector — hoarding feelings too.", groups: ["Collectors"] }
    ]
  },
  {
    question: "What's your vibe on a first kiss?",
    answers: [
      { text: "After a pottery session, clay-covered and giggling.", groups: ["Creators"] },
      { text: "Post-tennis match, sweaty and victorious.", groups: ["Sports Enthusiasts"] },
      { text: "During a stargazing night, under a meteor shower.", groups: ["Nature Lovers"] },
      { text: "After a heated anime debate, mid-laugh.", groups: ["Anime Addicts"] }
    ]
  },
  {
    question: "What's your comfort date idea?",
    answers: [
      { text: "Binge-watching anime with homemade sushi.", groups: ["Foodies", "Anime Addicts"] },
      { text: "Gardening together and naming our plants.", groups: ["Nature Lovers"] },
      { text: "Board game night with flirty wagers.", groups: ["Gamers"] },
      { text: "Quilling art while sharing life stories.", groups: ["Creators"] }
    ]
  },
  {
    question: "How do you know you're catching feelings?",
    answers: [
      { text: "I save your favorite hiking trail on my map app.", groups: ["Adventurers"] },
      { text: "I start brewing coffee just for your taste.", groups: ["Foodies"] },
      { text: "I sketch you in my journal. A lot.", groups: ["Creators"] },
      { text: "I debate anime ships with you in mind.", groups: ["Anime Addicts"] }
    ]
  },
  {
    question: "What's your weirdest dating ick?",
    answers: [
      { text: "Hating on my vinyl record collection. Nope.", groups: ["Collectors"] },
      { text: "Not vibing with my yoga flow. Major red flag.", groups: ["Sports Enthusiasts"] },
      { text: "Saying my robot builds are 'just toys.'", groups: ["Tech Hobbyists"] },
      { text: "Not getting my love for crosswords. Dealbreaker.", groups: ["Book Lovers"] }
    ]
  },
  {
    question: "What's your relationship aesthetic?",
    answers: [
      { text: "Two adventurers lost in a forest, vibing.", groups: ["Adventurers"] },
      { text: "Crafty duo making art and chaos together.", groups: ["Creators"] },
      { text: "Foodies sharing quirky recipes and kisses.", groups: ["Foodies"] },
      { text: "Nerdy coders debugging life side by side.", groups: ["Tech Hobbyists"] }
    ]
  },
  {
    question: "Your heart flutters when someone…",
    answers: [
      { text: "Joins you for a sunrise surf session.", groups: ["Adventurers"] },
      { text: "Sings your favorite song off-key but with passion.", groups: ["Music & Performance"] },
      { text: "Gets your rare stamp obsession without judgment.", groups: ["Collectors"] },
      { text: "Shares your love for bonsai pruning.", groups: ["Nature Lovers"] }
    ]
  },
  {
    question: "How would your friends describe your love life?",
    answers: [
      { text: "A rom-com with too many pottery disasters.", groups: ["Creators"] },
      { text: "A hiking trail of chaotic flirtations.", groups: ["Adventurers"] },
      { text: "A foodie saga with extra spice and sass.", groups: ["Foodies"] },
      { text: "A debate club with flirty undertones.", groups: ["Social & Cultural"] }
    ]
  },
  {
    question: "What's your go-to move when flirting?",
    answers: [
      { text: "Gifting a hand-carved wooden trinket.", groups: ["Creators"] },
      { text: "Challenging you to a flirty table tennis match.", groups: ["Sports Enthusiasts"] },
      { text: "Sending a coded love note via ham radio.", groups: ["Tech Hobbyists"] },
      { text: "Quoting poetry during a bookstore date.", groups: ["Book Lovers"] }
    ]
  },
  {
    question: "If we had a secret handshake, what would it include?",
    answers: [
      { text: "A twirl from ballroom dancing and a wink.", groups: ["Music & Performance"] },
      { text: "A geocaching high-five and a treasure nod.", groups: ["Adventurers"] },
      { text: "A quilling swirl and a flirty fist bump.", groups: ["Creators"] },
      { text: "A chess move mimic and a sneaky smile.", groups: ["Gamers"] }
    ]
  },
  {
    question: "What's your favorite kind of romantic chaos?",
    answers: [
      { text: "Getting lost birdwatching and flirting with binoculars.", groups: ["Nature Lovers"] },
      { text: "Baking a cake and starting a flour fight.", groups: ["Foodies"] },
      { text: "Cosplaying at a con and stealing the spotlight.", groups: ["Anime Addicts"] },
      { text: "Debating philosophy until we kiss to agree.", groups: ["Social & Cultural"] }
    ]
  },
  {
    question: "What's your dream nerd date?",
    answers: [
      { text: "Coding a flirty chatbot for our date night.", groups: ["Tech Hobbyists"] },
      { text: "Marathoning manga and arguing best ships.", groups: ["Anime Addicts"] },
      { text: "Building a model rocket and launching it together.", groups: ["Adventurers"] },
      { text: "Solving a puzzle escape room with flirty clues.", groups: ["Gamers"] }
    ]
  },
  {
    question: "How do you show someone you like them?",
    answers: [
      { text: "Gifting a hand-stitched embroidery of our initials.", groups: ["Creators"] },
      { text: "Planning a kayaking date with a picnic twist.", groups: ["Adventurers", "Foodies"] },
      { text: "Singing a duet at karaoke night for you.", groups: ["Music & Performance"] },
      { text: "Sharing my rare crystal collection's best piece.", groups: ["Collectors"] }
    ]
  }
];

const AIQuiz = ({ userId, onQuizComplete }: AIQuizProps) => {
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const { toast } = useToast();

  const startQuiz = () => {
    // Randomly select 10 questions from all available questions
    const shuffled = [...ALL_QUESTIONS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    setSelectedQuestions(selected);
    setQuizStarted(true);
  };

  const handleAnswerSelect = async (answer: any) => {
    if (loading) return;

    setLoading(true);
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Check if quiz is complete (10 questions)
    if (currentQuestionIndex + 1 >= 10) {
      // Calculate group placement
      const groupCounts: Record<string, number> = {};
      
      newAnswers.forEach(answer => {
        answer.groups.forEach((group: string) => {
          groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
      });

      // Find group with highest count
      const sortedGroups = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);
      const topGroup = sortedGroups[0]?.[0] || "Book Lovers";

      // Join the user to the winning group
      try {
        const { data: group } = await supabase
          .from('connections_groups')
          .select('id')
          .eq('tag_name', topGroup)
          .single();

        if (group) {
          const { error } = await supabase
            .from('user_connections_groups')
            .insert({
              user_id: userId,
              group_id: group.id
            });

          if (!error) {
            toast({
              title: "Welcome to your community!",
              description: `You've been placed in ${topGroup} based on your answers!`,
            });
            onQuizComplete(topGroup);
          }
        }
      } catch (error) {
        console.error('Error placing user in group:', error);
        toast({
          title: "Error",
          description: "Failed to place you in a group. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    setLoading(false);
  };

  if (!quizStarted) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={startQuiz}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Ask AI</h3>
              <p className="text-sm text-muted-foreground">where you belong</p>
              <p className="text-xs text-muted-foreground mt-2">
                Take our AI-powered quiz to find your perfect community match
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentQuestionIndex >= selectedQuestions.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-primary">Analyzing Your Answers...</CardTitle>
          <CardDescription className="text-base">
            Our AI is finding your perfect community match!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentQuestion = selectedQuestions[currentQuestionIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of 10
          </span>
        </div>
        <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        <CardDescription>
          Choose the answer that best describes you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentQuestion.answers.map((answer: any, index: number) => (
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

export default AIQuiz;