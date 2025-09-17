import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import type { ArenaData } from '@/data/arenas';

interface ArenaCardProps {
  arena: ArenaData;
  onJoin?: () => void;
  onNotifyMe?: () => void;
  onLeaderboardClick?: () => void;
  className?: string;
}

const getCountdownText = (nextEventDate?: Date) => {
  if (!nextEventDate) return null;

  const now = new Date();
  const diff = nextEventDate.getTime() - now.getTime();

  if (diff <= 0) return "Live now!";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatTimeInUserTimezone = (timeString: string) => {
  try {
    // For now, we'll just convert ET to user's local time
    const [day, time] = timeString.split(' ');
    const [hour, period] = time.split(/(\d+)(AM|PM)/i).filter(Boolean);
    let hour24 = parseInt(hour);
    if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
    if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;

    const etDate = new Date();
    etDate.setHours(hour24, 0, 0, 0);

    return etDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  } catch {
    return timeString; // fallback to original format
  }
};

const ArenaCard = memo(({
  arena,
  onJoin,
  onNotifyMe,
  onLeaderboardClick,
  className = ''
}: ArenaCardProps) => {
  const countdownText = getCountdownText();
  const userTime = formatTimeInUserTimezone('Sat 3PM ET');
  const disabled = arena.status !== 'active';
  const isActive = arena.status === 'active';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-block w-full h-full ${className} relative`}
    >
      <Card className={`bg-gradient-to-br from-white via-gray-50 to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/30 shadow-lg hover:shadow-xl border-2 border-gray-200/50 dark:border-gray-700/30 rounded-3xl overflow-hidden h-full flex flex-col transition-all duration-300 ${disabled ? 'opacity-70 grayscale' : ''} ${isActive ? 'border-romance/50' : 'hover:border-romance/30'}`}>
        <CardContent className="p-4 sm:p-6 flex-1 flex flex-col relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
          </div>
          <div className="flex items-center justify-between mb-4 gap-3 relative z-10">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-lg sm:text-xl mb-1 bg-gradient-to-r from-romance to-purple-accent bg-clip-text text-transparent leading-tight">
                {arena.name}
              </h3>
              <p className="text-xs font-medium text-romance/80 uppercase tracking-wider">
                Rapid-Fire Topic Sprints
              </p>
            </div>
            <div className="flex-shrink-0">
              {/* Main icon container */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-romance via-purple-500 to-purple-accent flex items-center justify-center shadow-lg border-2 border-white/20 transition-transform duration-300">
                <span className="text-white text-xl sm:text-2xl drop-shadow-lg">{arena.icon}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {arena.description}
            </p>
          </div>

          {countdownText && (
            <div className="flex items-center gap-3 mb-4 relative z-10 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-3 border border-orange-200/50 dark:border-orange-800/30">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {countdownText}
                </span>
                <p className="text-xs text-muted-foreground">Until next round</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-auto relative z-10">
            <Button
              className={`${disabled ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600' : 'bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent shadow-lg hover:shadow-xl'} text-white font-semibold text-sm px-6 py-3 rounded-xl w-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95`}
              onClick={onJoin}
              disabled={disabled}
              aria-label={`Join the ${arena.name} arena event`}
            >
              {disabled ? (
                <div className="flex items-center justify-center gap-2">
                  <span>🔒</span>
                  <span>Coming Soon</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>⚡</span>
                  <span>Join Arena</span>
                </div>
              )}
            </Button>

            {disabled && onNotifyMe && (
              <Button
                variant="outline"
                onClick={onNotifyMe}
                className="text-romance border-2 border-romance/30 hover:bg-romance/10 hover:border-romance/50 w-full rounded-xl py-2 font-medium transition-all duration-300 active:scale-95"
                aria-label={`Get notified when ${arena.name} becomes available`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>🔔</span>
                  <span>Notify Me</span>
                </div>
              </Button>
            )}

            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-purple-50/50 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-muted-foreground">Next: {userTime}</span>
              </div>
              <button
                className="text-xs text-muted-foreground hover:text-romance transition-colors duration-200 flex items-center gap-1 hover:scale-105"
                onClick={onLeaderboardClick}
                aria-label={`View ${arena.name} leaderboard`}
              >
                <span>🏆</span>
                <span className="font-medium">Leaderboard</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

ArenaCard.displayName = 'ArenaCard';

export default ArenaCard;