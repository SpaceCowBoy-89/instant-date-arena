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
    status: 'active'
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
    status: 'active'
  },
  {
    id: 'speed-pulse',
    name: 'Speed Pulse',
    description: 'Vote fast in 5-minute polls. Be the quickest to make your voice heard.',
    route: '/arena/speed-pulse',
    icon: '💓',
    color: 'from-pink-400 to-rose-500',
    participants: 189,
    timeLeft: '12:30',
    status: 'active'
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
    status: 'active'
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
    status: 'active'
  }
];

export const getArenaById = (id: string): ArenaData | undefined => {
  return arenas.find(arena => arena.id === id);
};

export const getActiveArenas = (): ArenaData[] => {
  return arenas.filter(arena => arena.status === 'active');
};