
-- Remove the foreign key constraint from the queue table that's causing the error
-- The queue table currently references users(id) but users might not have a profile record yet
ALTER TABLE public.queue DROP CONSTRAINT IF EXISTS queue_user_id_fkey;

-- Add RLS policy to allow users to delete their own queue entries
-- This was missing and needed for the leave queue functionality
CREATE POLICY "Users can delete their own queue status" 
ON public.queue 
FOR DELETE 
USING (auth.uid() = user_id);
