-- Add DELETE policy for chats table so users can delete conversations they're part of
CREATE POLICY "Users can delete their own chats" 
ON public.chats 
FOR DELETE 
USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));