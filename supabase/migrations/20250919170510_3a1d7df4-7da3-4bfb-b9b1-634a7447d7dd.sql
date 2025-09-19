-- Create tables for arena functionality

-- Arena sessions to track active arena instances
CREATE TABLE public.arena_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id TEXT NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Arena participants to track who joins each session
CREATE TABLE public.arena_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Arena responses/submissions from users
CREATE TABLE public.arena_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  response_text TEXT NOT NULL,
  response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'video', 'meme', 'haiku')),
  video_url TEXT,
  video_thumbnail TEXT,
  video_duration INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Arena votes on responses (likes, thumbs up/down, etc.)
CREATE TABLE public.arena_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'thumbs_up', 'thumbs_down', 'laugh')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(response_id, user_id, vote_type)
);

-- Arena leaderboard/scores for tracking user performance
CREATE TABLE public.arena_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  arena_id TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_responses INTEGER NOT NULL DEFAULT 0,
  total_votes_received INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, arena_id)
);

-- Enable RLS on all tables
ALTER TABLE public.arena_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for arena_sessions
CREATE POLICY "Anyone can view active arena sessions" 
ON public.arena_sessions 
FOR SELECT 
USING (true);

-- RLS Policies for arena_participants
CREATE POLICY "Users can join arena sessions" 
ON public.arena_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view arena participants" 
ON public.arena_participants 
FOR SELECT 
USING (true);

-- RLS Policies for arena_responses
CREATE POLICY "Users can submit their own responses" 
ON public.arena_responses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all arena responses" 
ON public.arena_responses 
FOR SELECT 
USING (true);

-- RLS Policies for arena_votes
CREATE POLICY "Users can vote on responses" 
ON public.arena_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view votes" 
ON public.arena_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own votes" 
ON public.arena_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for arena_leaderboard
CREATE POLICY "Anyone can view leaderboard" 
ON public.arena_leaderboard 
FOR SELECT 
USING (true);

CREATE POLICY "System can update leaderboard" 
ON public.arena_leaderboard 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add foreign key constraints
ALTER TABLE public.arena_participants 
ADD CONSTRAINT fk_arena_participants_session 
FOREIGN KEY (session_id) REFERENCES public.arena_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.arena_responses 
ADD CONSTRAINT fk_arena_responses_session 
FOREIGN KEY (session_id) REFERENCES public.arena_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.arena_votes 
ADD CONSTRAINT fk_arena_votes_response 
FOREIGN KEY (response_id) REFERENCES public.arena_responses(id) ON DELETE CASCADE;

-- Add updated_at triggers
CREATE TRIGGER update_arena_sessions_updated_at
BEFORE UPDATE ON public.arena_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arena_leaderboard_updated_at
BEFORE UPDATE ON public.arena_leaderboard
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_arena_sessions_arena_id ON public.arena_sessions(arena_id);
CREATE INDEX idx_arena_sessions_status ON public.arena_sessions(status);
CREATE INDEX idx_arena_participants_session_id ON public.arena_participants(session_id);
CREATE INDEX idx_arena_participants_user_id ON public.arena_participants(user_id);
CREATE INDEX idx_arena_responses_session_id ON public.arena_responses(session_id);
CREATE INDEX idx_arena_responses_user_id ON public.arena_responses(user_id);
CREATE INDEX idx_arena_votes_response_id ON public.arena_votes(response_id);
CREATE INDEX idx_arena_votes_user_id ON public.arena_votes(user_id);
CREATE INDEX idx_arena_leaderboard_arena_id ON public.arena_leaderboard(arena_id);
CREATE INDEX idx_arena_leaderboard_user_id ON public.arena_leaderboard(user_id);
CREATE INDEX idx_arena_leaderboard_rank ON public.arena_leaderboard(rank_position);