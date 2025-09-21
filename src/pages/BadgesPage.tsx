import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Heart, Share2, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { getUserBadges, type Badge, type UserBadge } from '@/utils/badgeUtils';
import '@/styles/Badges.css';

// Import badge icons as static SVGs
import NewExplorerIcon from '@/assets/badges/new-explorer.svg';
import ChatChampionIcon from '@/assets/badges/chat-champion.svg';
import CommunityStarIcon from '@/assets/badges/community-star.svg';
import ProfileProIcon from '@/assets/badges/profile-pro.svg';

// Icon mapping for badge display
const BADGE_ICONS: Record<string, string> = {
  'New Explorer': NewExplorerIcon,
  'Chat Champion': ChatChampionIcon,
  'Community Star': CommunityStarIcon,
  'Profile Pro': ProfileProIcon,
};

interface BadgeWithProgress extends Badge {
  progress: number;
  earned: boolean;
  earnedAt?: string;
}

interface BadgesPageProps {
  userId: string;
  onQuizStart: () => void;
  onMatchesOrSpeedDating: () => void;
}

const BadgesPage = ({ userId, onQuizStart, onMatchesOrSpeedDating }: BadgesPageProps) => {
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const result = await getUserBadges();
      
      if (result) {
        const { badges: allBadges, userBadges } = result;
        
        // Create a map of user badge progress
        const userBadgeMap = new Map<string, UserBadge>();
        userBadges.forEach(ub => {
          userBadgeMap.set(ub.badge_id, ub);
        });
        
        // Combine badges with progress data
        const badgesWithProgress: BadgeWithProgress[] = allBadges.map(badge => {
          const userBadge = userBadgeMap.get(badge.id);
          return {
            ...badge,
            progress: userBadge?.progress_count || 0,
            earned: userBadge?.is_earned || false,
            earnedAt: userBadge?.earned_at
          };
        });
        
        setBadges(badgesWithProgress);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load badges. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestNextAction = (badge: BadgeWithProgress) => {
    switch (badge.criteria_action) {
      case 'quiz_completed':
        onQuizStart();
        break;
      case 'chats_started':
        onMatchesOrSpeedDating();
        break;
      case 'events_joined':
        navigate('/communities');
        break;
      case 'profile_completed':
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

  const handleShare = (badge: BadgeWithProgress) => {
    toast({
      title: 'Share Badge',
      description: `Shared ${badge.name} on social media!`,
    });
  };

  const categories = ['All', 'Exploration', 'Social'];
  const filteredBadges = badges.filter(badge => selectedCategory === 'All' || badge.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-romance mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading badges...</p>
        </div>
      </div>
    );
  }

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
                  src={BADGE_ICONS[badge.name] || badge.icon_url}
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
                {!badge.earned && badge.criteria_threshold > 1 && (
                  <div className="badge-progress">
                    <Progress
                      value={(badge.progress / badge.criteria_threshold) * 100}
                      className="progress-bar"
                      indicatorClassName="progress-indicator"
                      aria-label={`Progress towards ${badge.name}`}
                    />
                    <span className="badge-progress-text">
                      {badge.progress}/{badge.criteria_threshold}
                    </span>
                  </div>
                )}
                {!badge.earned && badge.criteria_threshold === 1 && (
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
                  src={BADGE_ICONS[selectedBadge?.name || ''] || selectedBadge?.icon_url}
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
                  Progress: {selectedBadge?.progress}/{selectedBadge?.criteria_threshold}
                  {selectedBadge?.criteria_threshold === 1 ? ' - Just one step away!' : ''}
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