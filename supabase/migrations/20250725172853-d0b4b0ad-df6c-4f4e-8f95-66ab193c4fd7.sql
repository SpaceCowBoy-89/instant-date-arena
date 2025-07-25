-- Create atomic function to handle user interactions and match detection
CREATE OR REPLACE FUNCTION public.handle_user_interaction(
  p_user_id uuid,
  p_target_user_id uuid,
  p_interaction_type text,
  p_chat_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  mutual_match boolean := false;
  result jsonb;
BEGIN
  -- Record the interaction (upsert)
  INSERT INTO public.user_interactions (user_id, target_user_id, interaction_type)
  VALUES (p_user_id, p_target_user_id, p_interaction_type)
  ON CONFLICT (user_id, target_user_id) 
  DO UPDATE SET 
    interaction_type = EXCLUDED.interaction_type,
    created_at = now();
  
  -- If this is a 'like', check for mutual like
  IF p_interaction_type = 'like' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_interactions
      WHERE user_id = p_target_user_id 
        AND target_user_id = p_user_id 
        AND interaction_type = 'like'
    ) INTO mutual_match;
    
    -- If it's a mutual match, update the chat to completed status
    IF mutual_match THEN
      UPDATE public.chats
      SET 
        status = 'completed',
        messages = temporary_messages,
        temporary_messages = '[]'::jsonb,
        updated_at = now()
      WHERE chat_id = p_chat_id;
    END IF;
  END IF;
  
  -- Return result
  result := jsonb_build_object(
    'interaction_recorded', true,
    'is_mutual_match', mutual_match
  );
  
  RETURN result;
END;
$$;