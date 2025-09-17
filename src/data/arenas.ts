export interface ArenaSchedule {
  frequency: 'every7days' | 'every14days' | 'every3days';
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc. (only used for reference)
  hour: number; // 24-hour format
  minute: number;
  timezone: string;
  sessionDurationMinutes: number;
  lastOccurrence?: string; // ISO date string of last occurrence
}

export interface ArenaData {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  participants: number;
  timeLeft?: string;
  status: 'active' | 'upcoming' | 'completed';
  schedule: ArenaSchedule;
}

export const arenas: ArenaData[] = [
  {
    id: 'speed-spark',
    name: 'Speed Spark',
    description: 'Dive into a 10-minute frenzy of quick-witted responses to fun prompts! Race against the clock to share your best ideas.',
    route: '/arena/speed-spark',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-500',
    participants: 234,
    timeLeft: '8:00',
    status: 'upcoming',
    schedule: {
      frequency: 'every7days',
      hour: 14, // 2 PM
      minute: 0,
      timezone: 'America/New_York',
      sessionDurationMinutes: 10
    }
  },
  {
    id: 'speed-clash',
    name: 'Speed Clash',
    description: 'Spar in a 10-minute battle of wits! Debate hot topics with rival groups and shine through community votes.',
    route: '/arena/speed-clash',
    icon: '⚔️',
    color: 'from-red-400 to-pink-500',
    participants: 156,
    timeLeft: '7:00',
    status: 'upcoming',
    schedule: {
      frequency: 'every14days',
      hour: 15, // 3 PM
      minute: 0,
      timezone: 'America/New_York',
      sessionDurationMinutes: 10
    }
  },
  {
    id: 'speed-pulse',
    name: 'Speed Pulse',
    description: 'Vote fast in 10-minute polls. Be the quickest to make your voice heard.',
    route: '/arena/speed-pulse',
    icon: '💓',
    color: 'from-pink-400 to-rose-500',
    participants: 189,
    timeLeft: '12:30',
    status: 'upcoming',
    schedule: {
      frequency: 'every3days',
      hour: 17, // 5 PM
      minute: 0,
      timezone: 'America/New_York',
      sessionDurationMinutes: 10
    }
  },
  {
    id: 'speed-rally',
    name: 'Speed Rally',
    description: 'Team up for a bi-weekly creative relay! Collaborate with your group to craft epic stories, playlists, or ideas.',
    route: '/arena/speed-rally',
    icon: '🏎️',
    color: 'from-blue-400 to-cyan-500',
    participants: 98,
    timeLeft: '15:45',
    status: 'upcoming',
    schedule: {
      frequency: 'every14days',
      hour: 16, // 4 PM
      minute: 0,
      timezone: 'America/New_York',
      sessionDurationMinutes: 10
    }
  },
  {
    id: 'speed-burst',
    name: 'Speed Burst',
    description: 'Unleash your creativity in a 30-minute content sprint! Create memes, poems, or videos to win community upvotes.',
    route: '/arena/speed-burst',
    icon: '💥',
    color: 'from-purple-400 to-violet-500',
    participants: 267,
    timeLeft: '5:30',
    status: 'upcoming',
    schedule: {
      frequency: 'every7days',
      hour: 19, // 7 PM
      minute: 0,
      timezone: 'America/New_York',
      sessionDurationMinutes: 30
    }
  }
];

export const getArenaById = (id: string): ArenaData | undefined => {
  return arenas.find(arena => arena.id === id);
};

// Arena timing utilities
export const getNextArenaTime = (arena: ArenaData): Date => {
  const now = new Date();
  const { schedule } = arena;

  // Convert to Eastern timezone for calculation
  const easternNow = new Date(now.toLocaleString("en-US", {timeZone: schedule.timezone}));

  // Get the interval in days based on frequency
  const intervalDays = schedule.frequency === 'every3days' ? 3 :
                      schedule.frequency === 'every7days' ? 7 : 14;

  // For "every X days" scheduling, we calculate from a reference point
  // Using January 1, 2024 as our reference point for consistent cycling
  const referenceDate = new Date('2024-01-01T00:00:00-05:00'); // Eastern Time
  referenceDate.setHours(schedule.hour, schedule.minute, 0, 0);

  // Calculate how many days have passed since reference
  const daysSinceReference = Math.floor((easternNow.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate how many complete cycles have occurred
  const completeCycles = Math.floor(daysSinceReference / intervalDays);

  // Calculate the next occurrence
  const nextOccurrenceDate = new Date(referenceDate);
  nextOccurrenceDate.setDate(referenceDate.getDate() + (completeCycles * intervalDays));

  // If this occurrence is in the past or happening now, move to next cycle
  if (nextOccurrenceDate <= easternNow) {
    nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + intervalDays);
  }

  return nextOccurrenceDate;
};

export const isArenaActive = (arena: ArenaData): boolean => {
  const now = new Date();
  const nextTime = getNextArenaTime(arena);
  const sessionEnd = new Date(nextTime.getTime() + arena.schedule.sessionDurationMinutes * 60000);

  return now >= nextTime && now <= sessionEnd;
};

export const getArenaCountdown = (arena: ArenaData): string | null => {
  const now = new Date();
  const nextTime = getNextArenaTime(arena);

  if (isArenaActive(arena)) {
    const sessionEnd = new Date(nextTime.getTime() + arena.schedule.sessionDurationMinutes * 60000);
    const timeLeft = sessionEnd.getTime() - now.getTime();

    if (timeLeft <= 0) return null;

    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  const diff = nextTime.getTime() - now.getTime();

  if (diff <= 0) return "Starting now!";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const getArenaStatus = (arena: ArenaData): 'active' | 'upcoming' | 'completed' => {
  if (isArenaActive(arena)) {
    return 'active';
  }

  const now = new Date();
  const nextTime = getNextArenaTime(arena);
  const sessionEnd = new Date(nextTime.getTime() + arena.schedule.sessionDurationMinutes * 60000);

  if (now > sessionEnd) {
    return 'completed';
  }

  return 'upcoming';
};

export const getActiveArenas = (): ArenaData[] => {
  return arenas.map(arena => ({
    ...arena,
    status: getArenaStatus(arena),
    timeLeft: getArenaCountdown(arena) || undefined
  }));
};