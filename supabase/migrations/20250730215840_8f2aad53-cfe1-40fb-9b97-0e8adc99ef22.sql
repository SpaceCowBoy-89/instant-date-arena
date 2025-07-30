-- Add message_id column to user_reports table for message-specific reporting
ALTER TABLE public.user_reports 
ADD COLUMN message_id uuid REFERENCES public.connections_group_messages(id);

-- Add index for better performance when querying reports by message
CREATE INDEX idx_user_reports_message_id ON public.user_reports(message_id);

-- Update RLS policy to allow users to view reports for their own messages
CREATE POLICY "Users can view reports for their own messages" 
ON public.user_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.connections_group_messages 
    WHERE connections_group_messages.id = user_reports.message_id 
    AND connections_group_messages.user_id = auth.uid()
  )
);