import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { Heart, Share2, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import '@/styles/Badges.css'; // Import the new CSS file

// Import badge icons as static SVGs
import NewExplorerIcon from '@/assets/badges/new-explorer.svg';
import ChatChampionIcon from '@/assets/badges/chat-champion.svg';
import CommunityStarIcon from '@/assets/badges/community-star.svg';
import ProfileProIcon from '@/assets/badges/profile-pro.svg';
import ChatChampIcon from '@/assets/badges/chat-champ.svg';
import FlirtyMasterIcon from '@/assets/badges/flirty-master.svg';
import VibeSeekerIcon from '@/assets/badges/vibe-seeker.svg';
import OfflineRomeoIcon from '@/assets/badges/offline-romeo.svg';
import DreamDatePlannerIcon from '@/assets/badges/dream-date-planner.svg';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: { action: string; threshold: number };
  earned: boolean;
  category: 'Exploration' | 'Social' | 'Chatbot';
  reward?: string;
}

interface BadgesPageProps {
  userId: string;
  onQuizStart: () => void;
  onMatchesOrSpeedDating: () => void;
}

const BadgesPage = ({ userId, onQuizStart, onMatchesOrSpeedDating }: BadgesPageProps) => {
  const [badges, setBadges] = useState<Badge[]>([
    { id: 'new-explorer', name: 'New Explorer', description: 'Complete the AI Quiz', icon: NewExplorerIcon, criteria: { action: 'quizCompleted', threshold: 1 }, earned: false, category: 'Exploration', reward: 'Unlock exclusive quiz insights' },
    { id: 'chat-champion', name: 'Chat Champion', description: 'Complete 5 speed dating chats', icon: ChatChampionIcon, criteria: { action: 'chatsStarted', threshold: 5 }, earned: false, category: 'Social', reward: 'Get priority in speed dating queues' },
    { id: 'community-star', name: 'Community Star', description: 'Join 3 community events', icon: CommunityStarIcon, criteria: { action: 'eventsJoined', threshold: 3 }, earned: false, category: 'Social', reward: 'Access to premium community events' },
    { id: 'profile-pro', name: 'Profile Pro', description: 'Complete your profile', icon: ProfileProIcon, criteria: { action: 'profileCompleted', threshold: 1 }, earned: false, category: 'Exploration', reward: 'Profile boost for 24 hours' },
    { id: 'chat-champ', name: 'Chat Champ', description: 'Send 5+ messages in a chatbot session', icon: ChatChampIcon, criteria: { action: 'chatbotInteractions', threshold: 5 }, earned: false, category: 'Chatbot', reward: 'Extra daily chatbot sessions' },
    { id: 'flirty-master', name: 'Flirty Master', description: 'Use flirty conversation starters in chatbot', icon: FlirtyMasterIcon, criteria: { action: 'flirtyTipsUsed', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'Custom flirty tip pack' },
    { id: 'vibe-seeker', name: 'Vibe Seeker', description: 'Share your vibe with the chatbot', icon: VibeSeekerIcon, criteria: { action: 'vibeShared', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'Personalized vibe-based match suggestions' },
    { id: 'offline-romeo', name: 'Offline Romeo/Juliet', description: 'Chat with the chatbot offline', icon: OfflineRomeoIcon, criteria: { action: 'offlineChats', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'Offline mode extended duration' },
    { id: 'dream-date-planner', name: 'Dream Date Planner', description: 'Share your dream date with the chatbot', icon: DreamDatePlannerIcon, criteria: { action: 'dreamDateShared', threshold: 1 }, earned: false, category: 'Chatbot', reward: 'AI-generated date ideas' }
  ]);
  const [progress, setProgress] = useState<{
    quizCompleted: number;
    chatsStarted: number;
    eventsJoined: number;
    profileCompleted: number;
    chatbotInteractions: number;
    flirtyTipsUsed: number;
    vibeShared: number;
    offlineChats: number;
    dreamDateShared: number;
  }>({
    quizCompleted: 0,
    chatsStarted: 0,
    eventsJoined: 0,
    profileCompleted: 0,
    chatbotInteractions: 0,
    flirtyTipsUsed: 0,
    vibeShared: 0,
    offlineChats: 0,
    dreamDateShared: 0
  });
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
        dreamDateShared: 0
      };
      setProgress(userProgress);

      setBadges(prevBadges => prevBadges.map(badge => ({
        ...badge,
        earned: userProgress[badge.criteria.action] >= badge.criteria.threshold
      })));
    };

    loadProgress();
  }, [userId]);

  const suggestNextAction = (badge: Badge) => {
    switch (badge.id) {
      case 'new-explorer':
        onQuizStart();
        break;
      case 'chat-champion':
        onMatchesOrSpeedDating();
        break;
      case 'community-star':
        navigate('/communities');
        break;
      case 'profile-pro':
        navigate('/profile');
        break;
      default:
        toast({
          title: 'Badge Progress',
          description: `Keep using the app to unlock ${badge.name}!`,
        });
        break;
    }
  };

  const handleShare = (badge: Badge) => {
    toast({
      title: 'Share Badge',
      description: `Shared ${badge.name} on social media!`,
    });
  };

  const categories = ['All', 'Exploration', 'Social', 'Chatbot'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBadges = badges.filter(badge => selectedCategory === 'All' || badge.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 pt-2 sm:pt-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mr-3 sm:mr-4 h-10 w-10 sm:h-12 sm:w-12 rounded-full hover:bg-romance/10 min-h-[44px] touch-manipulation"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-romance" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-romance to-purple-accent bg-clip-text text-transparent leading-tight">
                Badge Collection
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">Unlock achievements and earn rewards</p>
            </div>
          </div>

          {/* Progress Summary - Desktop */}
          <div className="hidden md:flex items-center gap-4 bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-romance">{badges.filter(b => b.earned).length}</div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-accent">{badges.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center md:justify-start">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? 'bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-4 sm:px-6 py-2 text-sm sm:text-base min-h-[44px] touch-manipulation'
                  : 'text-romance border-romance/50 hover:bg-romance/10 hover:text-romance hover:border-romance rounded-full px-4 sm:px-6 py-2 backdrop-blur-sm text-sm sm:text-base min-h-[44px] touch-manipulation'
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-card/60 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-border/50 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-romance/10 to-purple-accent/10 p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-romance/20 rounded-full">
                <Heart className="text-romance h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Achievements & Rewards</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Complete challenges to unlock exclusive benefits</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredBadges.map(badge => (
              <div
                key={badge.id}
                className={`badge-container ${badge.earned ? 'earned' : ''}`}
                onClick={() => setSelectedBadge(badge)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedBadge(badge)}
                tabIndex={0}
                role="button"
                aria-label={`View ${badge.name} badge`}
              >
                <img
                  src={badge.icon}
                  alt={`${badge.name} icon`}
                  className="badge-icon"
                  loading="lazy"
                  decoding="sync"
                  style={{
                    imageRendering: 'pixelated'
                  }}
                />
                <p className={`badge-name ${badge.earned ? 'earned' : ''}`}>
                  {badge.name}
                  {badge.earned && <BadgeComponent variant="secondary" className="ml-2 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))]">Earned</BadgeComponent>}
                </p>
                <p className="badge-description">{badge.description}</p>
                {!badge.earned && badge.criteria.threshold > 1 && (
                  <div className="badge-progress">
                    <Progress
                      value={(progress[badge.criteria.action] / badge.criteria.threshold) * 100}
                      className="progress-bar"
                      indicatorClassName="progress-indicator"
                      aria-label={`Progress towards ${badge.name}`}
                    />
                    <span className="badge-progress-text">
                      {progress[badge.criteria.action]}/{badge.criteria.threshold}
                    </span>
                  </div>
                )}
                {!badge.earned && badge.criteria.threshold === 1 && (
                  <p className="badge-one-step">You're one step away!</p>
                )}
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Mobile Progress Summary */}
        <div className="md:hidden mt-6 sm:mt-8 mb-20 bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 mx-1">
          <div className="flex justify-center gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-romance">{badges.filter(b => b.earned).length}</div>
              <div className="text-xs text-muted-foreground">Badges Earned</div>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-accent">{badges.length - badges.filter(b => b.earned).length}</div>
              <div className="text-xs text-muted-foreground">To Unlock</div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-lg border-border/50 rounded-2xl sm:rounded-3xl shadow-2xl w-[90vw] max-w-md mx-auto">
          <DialogHeader className="space-y-3 sm:space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 sm:p-4 rounded-full mb-3 sm:mb-4 ${selectedBadge?.earned ? 'bg-romance/20' : 'bg-muted/20'}`}>
                <img
                  src={selectedBadge?.icon}
                  alt={`${selectedBadge?.name} icon`}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  loading="lazy"
                />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-center">
                {selectedBadge?.name}
              </DialogTitle>
              {selectedBadge?.earned && (
                <div className="bg-gradient-to-r from-romance to-purple-accent text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  ✨ Earned
                </div>
              )}
            </div>
          </DialogHeader>

          <DialogDescription className="space-y-3 sm:space-y-4 text-center px-2">
            <p className="text-sm sm:text-base text-foreground">{selectedBadge?.description}</p>

            {selectedBadge?.reward && (
              <div className="bg-romance/10 border border-romance/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-medium text-romance mb-1">🎁 Reward</div>
                <div className="text-xs sm:text-sm text-foreground">{selectedBadge.reward}</div>
              </div>
            )}

            {!selectedBadge?.earned && (
              <div className="bg-muted/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Progress: {progress[selectedBadge?.criteria.action ?? '']}/{selectedBadge?.criteria.threshold}
                  {selectedBadge?.criteria.threshold === 1 ? ' - Just one step away!' : ''}
                </div>
              </div>
            )}

            {selectedBadge?.earned && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="text-green-600 dark:text-green-400 font-medium text-xs sm:text-sm">
                  🎉 Congratulations! You've earned this badge.
                </div>
              </div>
            )}
          </DialogDescription>

          <DialogFooter className="flex gap-2 sm:gap-3 pt-2">
            {selectedBadge?.earned && (
              <Button
                variant="outline"
                className="flex-1 text-romance border-romance/50 hover:bg-romance/10 hover:border-romance rounded-xl min-h-[44px] touch-manipulation"
                onClick={() => handleShare(selectedBadge)}
              >
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            )}
            {!selectedBadge?.earned && (
              <Button
                className="flex-1 bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl min-h-[44px] touch-manipulation"
                onClick={() => suggestNextAction(selectedBadge!)}
              >
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