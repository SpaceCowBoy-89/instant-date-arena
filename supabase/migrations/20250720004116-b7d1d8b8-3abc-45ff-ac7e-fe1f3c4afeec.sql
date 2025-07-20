-- Create table to track user daily match limits
CREATE TABLE public.user_match_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  matches_used INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create table to track purchases and billing
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_type TEXT NOT NULL, -- 'basic', 'popular', 'premium'
  matches_count INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  platform TEXT NOT NULL, -- 'apple', 'google', 'web'
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_match_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_match_limits
CREATE POLICY "Users can view their own match limits" 
ON public.user_match_limits 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own match limits" 
ON public.user_match_limits 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert match limits" 
ON public.user_match_limits 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for user_purchases
CREATE POLICY "Users can view their own purchases" 
ON public.user_purchases 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert purchases" 
ON public.user_purchases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update purchases" 
ON public.user_purchases 
FOR UPDATE 
USING (true);

-- Function to check and increment daily match usage
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
  -- Get or create today's usage record
  INSERT INTO public.user_match_limits (user_id, date, matches_used, daily_limit)
  VALUES (p_user_id, CURRENT_DATE, 0, 10)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  -- Get current usage and limit
  SELECT matches_used, daily_limit 
  INTO current_usage, daily_limit
  FROM public.user_match_limits 
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- Check if limit reached
  IF current_usage >= daily_limit THEN
    result := jsonb_build_object(
      'allowed', false,
      'current_usage', current_usage,
      'daily_limit', daily_limit,
      'message', 'Daily match limit reached. Upgrade to continue matching!'
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

-- Function to add purchased matches to user's daily limit
CREATE OR REPLACE FUNCTION public.add_purchased_matches(p_user_id UUID, p_matches_count INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get or create today's usage record
  INSERT INTO public.user_match_limits (user_id, date, matches_used, daily_limit)
  VALUES (p_user_id, CURRENT_DATE, 0, 10)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  -- Add purchased matches to daily limit
  UPDATE public.user_match_limits 
  SET daily_limit = daily_limit + p_matches_count,
      updated_at = now()
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  RETURN TRUE;
END;
$$;