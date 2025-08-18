-- Fix function search_path security warnings
-- Add proper search_path settings to functions

-- Update can_view_user_profile function with secure search_path
CREATE OR REPLACE FUNCTION public.can_view_user_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Allow viewing own profile
  IF current_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Allow viewing if users are in an active chat together
  IF EXISTS (
    SELECT 1 FROM public.chats
    WHERE (user1_id = current_user_id AND user2_id = target_user_id)
       OR (user1_id = target_user_id AND user2_id = current_user_id)
  ) THEN
    RETURN true;
  END IF;
  
  -- Allow viewing if users are in the same connections group
  IF EXISTS (
    SELECT 1 FROM public.user_connections_groups ucg1
    JOIN public.user_connections_groups ucg2 ON ucg1.group_id = ucg2.group_id
    WHERE ucg1.user_id = current_user_id AND ucg2.user_id = target_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Allow viewing if there's a compatibility match between users
  IF EXISTS (
    SELECT 1 FROM public.user_compatibility_matches
    WHERE (user1_id = current_user_id AND user2_id = target_user_id)
       OR (user1_id = target_user_id AND user2_id = current_user_id)
  ) THEN
    RETURN true;
  END IF;
  
  -- Allow viewing if users are in the matchmaking queue together (for matchmaker function)
  IF EXISTS (
    SELECT 1 FROM public.queue q1
    JOIN public.queue q2 ON q1.status = 'waiting' AND q2.status = 'waiting'
    WHERE q1.user_id = current_user_id AND q2.user_id = target_user_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Update can_view_compatibility_scores function with secure search_path
CREATE OR REPLACE FUNCTION public.can_view_compatibility_scores(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Allow viewing own scores
  IF current_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Allow viewing scores only if user profiles can be viewed
  RETURN public.can_view_user_profile(target_user_id);
END;
$$;