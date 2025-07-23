-- Clean up old speed date chats that were saved without mutual likes
-- These chats should only exist if both users liked each other
DELETE FROM public.chats 
WHERE chat_id IN (
  SELECT c.chat_id 
  FROM public.chats c
  LEFT JOIN public.user_interactions ui1 ON (
    ui1.user_id = c.user1_id 
    AND ui1.target_user_id = c.user2_id 
    AND ui1.interaction_type = 'like'
  )
  LEFT JOIN public.user_interactions ui2 ON (
    ui2.user_id = c.user2_id 
    AND ui2.target_user_id = c.user1_id 
    AND ui2.interaction_type = 'like'
  )
  WHERE (ui1.id IS NULL OR ui2.id IS NULL)
  -- Only delete chats that have actual messages stored (old system)
  AND jsonb_array_length(c.messages) > 0
  -- Don't delete very recent chats (within last hour) to avoid deleting active sessions
  AND c.created_at < (now() - interval '1 hour')
);