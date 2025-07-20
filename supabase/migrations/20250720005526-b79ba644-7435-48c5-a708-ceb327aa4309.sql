
-- Fix the check_and_increment_match_usage function to resolve ambiguous column reference
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
