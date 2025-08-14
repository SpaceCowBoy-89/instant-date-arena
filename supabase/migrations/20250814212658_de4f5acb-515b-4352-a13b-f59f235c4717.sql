-- Fix critical security vulnerability: Restrict users table access
-- Currently "Users can view all profiles" policy allows public access to sensitive data

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Create security definer functions to enable proper access control
CREATE OR REPLACE FUNCTION public.can_view_user_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Create new restrictive policy for viewing profiles
CREATE POLICY "Users can view authorized profiles only"
ON public.users
FOR SELECT
TO authenticated
USING (public.can_view_user_profile(id));

-- Also fix the user_compatibility_scores table exposure
DROP POLICY IF EXISTS "Users can view all scores for matching" ON public.user_compatibility_scores;

-- Create function to check if compatibility scores can be viewed
CREATE OR REPLACE FUNCTION public.can_view_compatibility_scores(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Create new policy for compatibility scores
CREATE POLICY "Users can view authorized compatibility scores only"
ON public.user_compatibility_scores
FOR SELECT
TO authenticated
USING (public.can_view_compatibility_scores(user_id));

-- Allow service role to access all user data for matchmaking functions
CREATE POLICY "Service role can access all users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all compatibility scores"
ON public.user_compatibility_scores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);