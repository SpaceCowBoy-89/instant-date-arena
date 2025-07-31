-- Enable realtime for connections_group_messages table
ALTER TABLE public.connections_group_messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE connections_group_messages;