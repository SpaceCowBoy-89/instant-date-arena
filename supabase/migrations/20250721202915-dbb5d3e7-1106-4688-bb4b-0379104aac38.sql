
-- Remove billing-related tables and functions
DROP TABLE IF EXISTS public.user_purchases;
DROP FUNCTION IF EXISTS public.add_purchased_matches(uuid, integer);

-- Update default daily limit to 50 in user_match_limits table
ALTER TABLE public.user_match_limits ALTER COLUMN daily_limit SET DEFAULT 50;

-- Update existing users' daily limits to 50
UPDATE public.user_match_limits SET daily_limit = 50 WHERE daily_limit = 10;

-- Update the check_and_increment_match_usage function to use 50 as default
CREATE OR REPLACE FUNCTION public.check_and_increment_match_usage(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER;
  daily_limit INTEGER;
  result JSONB;
BEGIN
  -- Get or create today's usage record with new default limit of 50
  INSERT INTO public.user_match_limits (user_id, date, matches_used, daily_limit)
  VALUES (p_user_id, CURRENT_DATE, 0, 50)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  -- Get current usage and limit with proper table alias to avoid ambiguity
  SELECT uml.matches_used, uml.daily_limit 
  INTO current_usage, daily_limit
  FROM public.user_match_limits uml 
  WHERE uml.user_id = p_user_id AND uml.date = CURRENT_DATE;
  
  -- Check if limit reached
  IF current_usage >= daily_limit THEN
    result := jsonb_build_object(
      'allowed', false,
      'current_usage', current_usage,
      'daily_limit', daily_limit,
      'message', 'Daily match limit reached. Try again tomorrow!'
    );
  ELSE
    -- Increment usage
    UPDATE public.user_match_limits 
    SET matches_used = matches_used + 1,
        updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    
    result := jsonb_build_object(
      'allowed', true,
      'current_usage', current_usage + 1,
      'daily_limit', daily_limit,
      'message', 'Match allowed'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create user_interactions table to track rejections
CREATE TABLE public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'reject')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_interactions
CREATE POLICY "Users can view their own interactions" 
ON public.user_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" 
ON public.user_interactions 
FOR UPDATE 
USING (auth.uid() = user_id);
