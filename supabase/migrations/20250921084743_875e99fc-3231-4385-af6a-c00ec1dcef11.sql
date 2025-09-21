-- Add media support to connections_group_messages table
ALTER TABLE public.connections_group_messages 
ADD COLUMN media_url text,
ADD COLUMN media_type text;

-- Add index for better query performance
CREATE INDEX idx_connections_group_messages_media ON public.connections_group_messages(media_type) WHERE media_type IS NOT NULL;