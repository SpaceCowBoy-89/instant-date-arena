-- Fix security warnings by setting search_path for all functions

-- Update existing functions with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_test_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result json;
BEGIN
  -- This function will be called by an edge function
  -- that handles the actual auth user creation
  result := '{"status": "ready"}'::json;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_and_increment_match_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_user_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update user verification status based on verification records
  IF NEW.status = 'approved' THEN
    UPDATE public.users 
    SET verification_status = 'verified',
        verification_method = NEW.verification_type,
        verification_approved_at = NEW.reviewed_at
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.users 
    SET verification_status = 'rejected'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_user_reports()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.users 
  SET reports_count = reports_count + 1
  WHERE id = NEW.reported_user_id;
  
  RETURN NEW;
END;
$$;