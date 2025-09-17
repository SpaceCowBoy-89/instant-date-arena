import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { getArenaById, isArenaActive, getArenaCountdown } from '@/data/arenas';
import type { ArenaData } from '@/data/arenas';

interface ArenaSessionState {
  isActive: boolean;
  timeLeft: string | null;
  shouldEject: boolean;
}

export const useArenaSession = (arenaId: string) => {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<ArenaSessionState>({
    isActive: false,
    timeLeft: null,
    shouldEject: false
  });

  const arena = getArenaById(arenaId);

  const checkSessionStatus = useCallback(() => {
    if (!arena) return;

    const isCurrentlyActive = isArenaActive(arena);
    const currentTimeLeft = getArenaCountdown(arena);

    setSessionState(prev => {
      const wasActive = prev.isActive;
      const shouldEject = wasActive && !isCurrentlyActive;

      return {
        isActive: isCurrentlyActive,
        timeLeft: currentTimeLeft,
        shouldEject
      };
    });
  }, [arena]);

  // Graceful ejection function
  const ejectUser = useCallback(() => {
    toast({
      title: "Arena Session Ended",
      description: `The ${arena?.name} session has ended. Thanks for participating!`,
      duration: 5000,
    });

    // Redirect to communities page after a short delay
    setTimeout(() => {
      navigate('/communities');
    }, 2000);
  }, [arena?.name, navigate]);

  // Effect to handle session monitoring
  useEffect(() => {
    if (!arena) {
      navigate('/communities');
      return;
    }

    // Initial check
    checkSessionStatus();

    // Set up interval to check every second
    const interval = setInterval(checkSessionStatus, 1000);

    return () => clearInterval(interval);
  }, [arena, checkSessionStatus, navigate]);

  // Effect to handle ejection
  useEffect(() => {
    if (sessionState.shouldEject) {
      ejectUser();
    }
  }, [sessionState.shouldEject, ejectUser]);

  // Check if user should be allowed to enter initially
  useEffect(() => {
    if (arena && !isArenaActive(arena)) {
      toast({
        title: "Arena Not Active",
        description: `The ${arena.name} is not currently active. Check back at the scheduled time!`,
        variant: "destructive",
      });
      navigate('/communities');
    }
  }, [arena, navigate]);

  return {
    arena,
    isActive: sessionState.isActive,
    timeLeft: sessionState.timeLeft,
    sessionEnding: sessionState.timeLeft && sessionState.timeLeft.includes(':') &&
                   parseInt(sessionState.timeLeft.split(':')[0]) < 2, // Less than 2 minutes left
  };
};

export default useArenaSession;