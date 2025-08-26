import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { Heart, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge as BadgeComponent } from '@/components/ui/badge';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Path to SVG
  criteria: { action: string; threshold: number };
  earned: boolean;
  category: 'Exploration' | 'Social' | 'Chatbot';
  reward?: string;
}

interface BadgesPageProps {
  userId: string;
}

const BadgesPage = ({ userId }: BadgesPageProps) => {
  const [badges, setBadges] = useState<Badge[]>([
    { id: 'new-explorer', name: 'New Explorer', description: 'Complete the AI Quiz', icon: '/assets/badges/new-explorer.svg', criteria: { action: 'quizCompleted', threshold: 1 }, earned: false, category: 'Exploration', reward: 'Unlock exclusive quiz insights' },
    { id: 'chat-champion', name: 'Chat Champion', description: 'Complete 5 speed dating chats', icon: '/assets/badges/chat-champion.svg', criteria: { action: 'chatsStarted', threshold: 5 }, earned: false, category: 'Social', reward: 'Get priority in speed dating queues' },
    { id: 'community-star', name: 'Community Star', description: 'Join 3 community events', icon: '/assets/badges/community-star.svg', criteria: { action: 'eventsJoined', threshold: 3 }, earned: false, category: 'Social', reward: 'Access to premium community events' },
    { id: 'profile-pro', name: 'Profile Pro', description: 'Complete your profile', icon: '/assets/badges/profile-pro.svg', criteria: { action: 'profileCompleted', threshold: 1 }, earned: false, category: 'Exploration', reward: 'Profile boost for 24 hours' },
    { id: 'chat-champ', name: 'Chat Champ', description: 'Send 5+ messages in a chatbot session', icon: '/assets/badges/chat-champ.svg', criteria: { action: 'chatbotInteractions', threshold: 5 }, earned: false, category: 'Chatbot', reward: 'Extra daily chatbot sessions' },
    { id: 'flirty-master', name: 'Flirty Master', description: 'Use flirty conversation starters in chatbot', icon: '/assets/badges/flirty-master.svg', criteria: { action: 'flirtyTipsUsed', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'Custom flirty tip pack' },
    { id: 'vibe-seeker', name: 'Vibe Seeker', description: 'Share your vibe with the chatbot', icon: '/assets/badges/vibe-seeker.svg', criteria: { action: 'vibeShared', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'Personalized vibe-based match suggestions' },
    { id: 'offline-romeo', name: 'Offline Romeo/Juliet', description: 'Chat with the chatbot offline', icon: '/assets/badges/offline-romeo.svg', criteria: { action: 'offlineChats', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'Offline mode extended duration' },
    { id: 'dream-date-planner', name: 'Dream Date Planner', description: 'Share your dream date with the chatbot', icon: '/assets/badges/dream-date-planner.svg', criteria: { action: 'dreamDateShared', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'AI-generated date ideas' }
  ]);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProgress = async () => {
      const { value } = await Preferences.get({ key: `user_progress_${userId}` });
      const userProgress = value ? JSON.parse(value) : {
        quizCompleted: 0,
        chatsStarted: 0,
        eventsJoined: 0,
        profileCompleted: 0,
        chatbotInteractions: 0,
        flirtyTipsUsed: 0,
        vibeShared: 0,
        offlineChats: 0,
        dreamDateShared: 0,
        points: 0,
        badges: []
      };

      const updatedBadges = badges.map(badge => ({
        ...badge,
        earned: userProgress.badges?.includes(badge.id) || userProgress[badge.criteria.action] >= badge.criteria.threshold
      }));
      setBadges(updatedBadges);
      setProgress({
        quizCompleted: userProgress.quizCompleted || 0,
        chatsStarted: userProgress.chatsStarted || 0,
        eventsJoined: userProgress.eventsJoined || 0,
        profileCompleted: userProgress.profileCompleted || 0,
        chatbotInteractions: userProgress.chatbotInteractions || 0,
        flirtyTipsUsed: userProgress.flirtyTipsUsed || 0,
        vibeShared: userProgress.vibeShared || 0,
        offlineChats: userProgress.offlineChats || 0,
        dreamDateShared: userProgress.dreamDateShared || 0
      });

      updatedBadges.forEach(async badge => {
        if (!userProgress.badges?.includes(badge.id) && userProgress[badge.criteria.action] >= badge.criteria.threshold) {
          userProgress.badges = [...(userProgress.badges || []), badge.id];
          userProgress.points = (userProgress.points || 0) + 50;
          await Preferences.set({ key: `user_progress_${userId}`, value: JSON.stringify(userProgress) });
          toast({ title: 'Badge Earned!', description: `You unlocked ${badge.name}! +50 points`, duration: 5000 });
        }
      });
    };
    loadProgress();
  }, [userId, toast]);

  const suggestNextAction = (badge: Badge) => {
    if (badge.earned) return;
    switch (badge.criteria.action) {
      case 'quizCompleted':
        navigate('/quiz');
        toast({ title: 'Earn a Badge', description: 'Complete the AI Quiz to unlock New Explorer!' });
        break;
      case 'chatsStarted':
        navigate('/speed-dating');
        toast({ title: 'Earn a Badge', description: `Complete ${badge.criteria.threshold - progress.chatsStarted} more chats for Chat Champion!` });
        break;
      case 'eventsJoined':
        navigate('/communities');
        toast({ title: 'Earn a Badge', description: `Join ${badge.criteria.threshold - progress.eventsJoined} more events for Community Star!` });
        break;
      case 'profileCompleted':
        navigate('/profile');
        toast({ title: 'Earn a Badge', description: 'Complete your profile to unlock Profile Pro!' });
        break;
      case 'chatbotInteractions':
      case 'flirtyTipsUsed':
      case 'vibeShared':
      case 'offlineChats':
      case 'dreamDateShared':
        // Redirect to chatbot or trigger interaction
        toast({ title: 'Earn a Badge', description: `Chat with Captain Corazón to unlock ${badge.name}! Ask for 'flirty tips' or share your vibe.` });
        break;
    }
  };

  const categories = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  const earnedCount = badges.filter(b => b.earned).length;

  const handleShare = (badge: Badge) => {
    // Implement share logic, e.g., using Web Share API or social integration
    toast({ title: 'Shared!', description: `Shared ${badge.name} badge!` });
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Your Badges</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Earn badges by exploring the app! ({earnedCount}/{badges.length} earned)</p>
          <Progress value={(earnedCount / badges.length) * 100} className="w-full mt-2" aria-label="Total badges progress" />
        </CardHeader>
        <CardContent className="grid gap-6">
          {Object.entries(categories).map(([category, catBadges]) => {
            // Sort to show earned badges first within each category
            const sortedBadges = [...catBadges].sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0));
            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-2">{category}</h3>
                <div className="grid gap-4">
                  {sortedBadges.map(badge => (
                    <div
                      key={badge.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-300 cursor-pointer ${
                        badge.earned
                          ? 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 hover:shadow-md'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedBadge(badge)}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={badge.icon} 
                          alt={`${badge.name} icon`} 
                          className={`w-12 h-12 ${badge.earned ? '' : 'grayscale opacity-70'}`} 
                          loading="lazy"
                        />
                        <div>
                          <p
                            className={`font-semibold ${
                              badge.earned ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {badge.name}
                            {badge.earned && <BadgeComponent variant="secondary" className="ml-2">Earned</BadgeComponent>}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{badge.description}</p>
                          {!badge.earned && badge.criteria.threshold > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Progress
                                value={(progress[badge.criteria.action] / badge.criteria.threshold) * 100}
                                className="w-40 bg-gray-200 dark:bg-gray-700"
                                indicatorClassName="bg-pink-500 dark:bg-pink-400"
                                aria-label={`Progress towards ${badge.name}`}
                              />
                              <span className="text-xs text-gray-500">
                                {progress[badge.criteria.action]}/{badge.criteria.threshold}
                              </span>
                            </div>
                          )}
                          {!badge.earned && badge.criteria.threshold === 1 && (
                            <p className="text-xs text-pink-500 mt-1">You're one step away!</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={badge.earned ? 'outline' : 'default'}
                        disabled={badge.earned}
                        onClick={(e) => {
                          e.stopPropagation();
                          suggestNextAction(badge);
                        }}
                        className={`text-sm ${
                          badge.earned
                            ? 'border-pink-500 text-pink-500 dark:border-pink-400 dark:text-pink-400'
                            : 'bg-pink-500 text-white hover:bg-pink-600 dark:bg-pink-400 dark:hover:bg-pink-500'
                        }`}
                      >
                        {badge.earned ? 'Earned' : 'Unlock'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={selectedBadge?.icon} alt={`${selectedBadge?.name} icon`} className="w-8 h-8" loading="lazy" />
              {selectedBadge?.name}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {selectedBadge?.description}
            {selectedBadge?.reward && (
              <p className="mt-2 font-semibold text-pink-600">Reward: {selectedBadge.reward}</p>
            )}
            {!selectedBadge?.earned && (
              <p className="mt-2">
                Progress: {progress[selectedBadge?.criteria.action ?? '']}/{selectedBadge?.criteria.threshold}
                {selectedBadge?.criteria.threshold === 1 ? ' - Just one step away!' : ''}
              </p>
            )}
            {selectedBadge?.earned && (
              <p className="mt-2 text-green-600">Congratulations! You've earned this badge.</p>
            )}
          </DialogDescription>
          <DialogFooter>
            {selectedBadge?.earned && (
              <Button variant="outline" onClick={() => handleShare(selectedBadge)}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            )}
            {!selectedBadge?.earned && (
              <Button onClick={() => suggestNextAction(selectedBadge!)}>
                Unlock Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BadgesPage;