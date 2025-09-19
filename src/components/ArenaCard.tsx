import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import type { ArenaData } from '@/data/arenas';
import { getNextArenaTime, isArenaActive, getArenaCountdown, getArenaStatus } from '@/data/arenas';
import { notificationService } from '@/services/notificationService';

interface ArenaCardProps {
  arena: ArenaData;
  onJoin?: () => void;
  onNotifyMe?: () => void;
  onLeaderboardClick?: () => void;
  className?: string;
}

const formatNextArenaTime = (arena: ArenaData) => {
  const nextTime = getNextArenaTime(arena);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return nextTime.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: userTimeZone,
    timeZoneName: 'short'
  });
};

const ArenaCard = memo(({
  arena,
  onJoin,
  onNotifyMe,
  onLeaderboardClick,
  className = ''
}: ArenaCardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [arenaStatus, setArenaStatus] = useState(getArenaStatus(arena));
  const [countdownText, setCountdownText] = useState(getArenaCountdown(arena));
  const [isNotificationSet, setIsNotificationSet] = useState(false);

  // Update timer every second and manage notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      const newStatus = getArenaStatus(arena);
      const newCountdown = getArenaCountdown(arena);

      // Reset notification state when arena becomes active
      if (newStatus === 'active' && arenaStatus !== 'active') {
        setIsNotificationSet(false);
      }

      setArenaStatus(newStatus);
      setCountdownText(newCountdown);
    }, 1000);

    // Check if notifications are already scheduled for this arena
    setIsNotificationSet(notificationService.isArenaNotificationScheduled(arena.id));

    // Schedule notifications for this arena (only if not already scheduled)
    if (!notificationService.isArenaNotificationScheduled(arena.id)) {
      const nextTime = getNextArenaTime(arena);
      notificationService.scheduleArenaNotification(arena, nextTime);
    }

    return () => {
      clearInterval(interval);
      // Clean up notifications when component unmounts
      notificationService.clearArenaNotification(arena.id);
    };
  }, [arena]);

  const nextArenaTime = formatNextArenaTime(arena);
  const disabled = arenaStatus !== 'active';
  const isActive = arenaStatus === 'active';

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


          <div className="flex flex-col gap-3 mt-auto relative z-10">
            {disabled ? (
              countdownText ? (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/50 dark:border-orange-800/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{countdownText}</span>
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Come back when the timer hits zero
                  </p>
                </div>
              ) : null
            ) : (
              <Button
                className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent shadow-lg hover:shadow-xl text-white font-semibold text-sm px-6 py-3 rounded-xl w-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                onClick={onJoin}
                aria-label={`Join the ${arena.name} arena event`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>⚡</span>
                  <span>Join Arena</span>
                </div>
              </Button>
            )}

            {disabled && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (!isNotificationSet) {
                    // Request notification permission if not granted
                    const hasPermission = await notificationService.requestNotificationPermission();

                    if (hasPermission || notificationService.getPreferences().toastEnabled) {
                      notificationService.sendNotifyMeConfirmation(arena);
                      // Schedule the notification
                      const nextTime = getNextArenaTime(arena);
                      notificationService.scheduleArenaNotification(arena, nextTime);
                      setIsNotificationSet(true);
                    }

                    // Call original handler if provided
                    if (onNotifyMe) {
                      onNotifyMe();
                    }
                  }
                }}
                disabled={isNotificationSet}
                className={`${
                  isNotificationSet
                    ? 'text-green-600 border-2 border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400 cursor-default'
                    : 'text-romance border-2 border-romance/30 hover:bg-romance/10 hover:border-romance/50'
                } w-full rounded-xl py-2 font-medium transition-all duration-300 ${!isNotificationSet && 'active:scale-95'}`}
                aria-label={isNotificationSet ? `Notifications set for ${arena.name}` : `Get notified when ${arena.name} becomes available`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{isNotificationSet ? '✅' : '🔔'}</span>
                  <span>{isNotificationSet ? 'Notifications Set' : 'Notify When Active'}</span>
                </div>
              </Button>
            )}

            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-purple-50/50 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/30">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                <span className="text-xs font-medium text-muted-foreground">
                  {isActive ? 'Live Now!' : `Next: ${nextArenaTime}`}
                </span>
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