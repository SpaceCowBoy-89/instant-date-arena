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
      {/* Top glow effect */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-gradient-to-r from-transparent via-pink-400/60 to-transparent blur-xl rounded-full z-0"></div>
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1/2 h-2 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent blur-lg rounded-full z-0"></div>

      <Card className={`bg-gradient-to-br from-white via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 shadow-xl border-0 rounded-3xl overflow-hidden h-full flex flex-col transition-all duration-300 relative z-10 ${disabled ? 'opacity-70 grayscale' : 'hover:shadow-2xl hover:scale-[1.02]'} ${isActive ? 'ring-2 ring-[hsl(var(--romance))] shadow-[0_0_20px_rgba(255,20,147,0.4)] bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-purple-900/30 dark:via-pink-900/20 dark:to-gray-800' : ''}`}>
        <CardContent className="p-4 sm:p-6 flex-1 flex flex-col relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
          </div>
          <div className="flex items-center justify-between mb-3 gap-2 relative z-10">
            <h3 className="font-bold text-[hsl(var(--foreground))] text-lg sm:text-xl flex-1 min-w-0 bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 dark:from-white dark:via-purple-100 dark:to-pink-100 bg-clip-text text-transparent">{arena.name}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">{arena.icon}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-[hsl(var(--romance))] mb-2 uppercase tracking-wider">Rapid-Fire Topic Sprints</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 flex-1 leading-relaxed">{arena.description}</p>
          </div>

          {countdownText && (
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[hsl(var(--romance))] bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{countdownText}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-auto relative z-10">
            <Button
              className={`${disabled ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 shadow-lg' : 'bg-gradient-to-r from-[hsl(var(--romance))] via-purple-500 to-[hsl(var(--purple-accent))] hover:from-pink-600 hover:via-purple-600 hover:to-purple-700 shadow-xl hover:shadow-2xl'} text-white font-semibold text-sm px-6 py-3 rounded-2xl w-full transition-all duration-300 transform hover:scale-[1.02]`}
              onClick={onJoin}
              disabled={disabled}
              aria-label={`Join the ${arena.name} arena event`}
            >
              {disabled ? '🔒 Coming Soon' : '⚡ Join Arena'}
            </Button>
            {disabled && onNotifyMe && (
              <Button
                variant="outline"
                onClick={onNotifyMe}
                className="text-[hsl(var(--romance))] border-2 border-[hsl(var(--romance))] hover:bg-gradient-to-r hover:from-[hsl(var(--romance))]/10 hover:to-purple-500/10 w-full rounded-2xl py-2 font-medium transition-all duration-300"
                aria-label={`Get notified when ${arena.name} becomes available`}
              >
                🔔 Notify Me
              </Button>
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-[hsl(var(--muted-foreground))] bg-gray-50 dark:bg-gray-800/50 rounded-xl py-2 px-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">{userTime}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent relative z-10">
            <button
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--romance))] transition-all duration-300 cursor-pointer w-full text-center font-medium hover:scale-105 flex items-center justify-center gap-1"
              onClick={onLeaderboardClick}
              aria-label={`View ${arena.name} leaderboard`}
            >
              <span className="text-sm">🏆</span>
              <span>Leaderboard</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

ArenaCard.displayName = 'ArenaCard';

export default ArenaCard;