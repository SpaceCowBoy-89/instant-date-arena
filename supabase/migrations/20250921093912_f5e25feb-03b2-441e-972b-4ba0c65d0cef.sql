-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  criteria_action TEXT NOT NULL,
  criteria_threshold INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL,
  reward TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table to track user progress and earned badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  progress_count INTEGER NOT NULL DEFAULT 0,
  is_earned BOOLEAN NOT NULL DEFAULT false,
  earned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for badges (public read)
CREATE POLICY "Anyone can view badges" 
ON public.badges 
FOR SELECT 
USING (true);

-- RLS policies for user_badges
CREATE POLICY "Users can view their own badge progress" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badge progress" 
ON public.user_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badge progress" 
ON public.user_badges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update badge progress
CREATE OR REPLACE FUNCTION public.update_badge_progress(
  p_user_id UUID,
  p_action TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  user_badge_record RECORD;
  newly_earned_badges JSONB := '[]'::JSONB;
BEGIN
  -- Update progress for all badges with matching criteria_action
  FOR badge_record IN 
    SELECT id, name, criteria_threshold 
    FROM public.badges 
    WHERE criteria_action = p_action
  LOOP
    -- Insert or update user badge progress
    INSERT INTO public.user_badges (user_id, badge_id, progress_count)
    VALUES (p_user_id, badge_record.id, p_increment)
    ON CONFLICT (user_id, badge_id) 
    DO UPDATE SET 
      progress_count = user_badges.progress_count + p_increment,
      updated_at = now();
    
    -- Check if badge should be earned
    SELECT progress_count, is_earned INTO user_badge_record
    FROM public.user_badges 
    WHERE user_id = p_user_id AND badge_id = badge_record.id;
    
    -- Award badge if threshold met and not already earned
    IF user_badge_record.progress_count >= badge_record.criteria_threshold AND NOT user_badge_record.is_earned THEN
      UPDATE public.user_badges 
      SET is_earned = true, earned_at = now()
      WHERE user_id = p_user_id AND badge_id = badge_record.id;
      
      -- Add to newly earned badges
      newly_earned_badges := newly_earned_badges || jsonb_build_object(
        'id', badge_record.id,
        'name', badge_record.name
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('newly_earned', newly_earned_badges);
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_user_badges_updated_at
  BEFORE UPDATE ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, description, criteria_action, criteria_threshold, category, reward) VALUES
('New Explorer', 'Complete the AI Quiz', 'quiz_completed', 1, 'Exploration', 'Unlock exclusive quiz insights'),
('Chat Champion', 'Complete 5 speed dating chats', 'chats_started', 5, 'Social', 'Get priority in speed dating queues'),
('Community Star', 'Join 3 community events', 'events_joined', 3, 'Social', 'Access to premium community events'),
('Profile Pro', 'Complete your profile', 'profile_completed', 1, 'Exploration', 'Profile boost for 24 hours');