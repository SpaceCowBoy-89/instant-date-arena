-- Add media support to community_messages table
ALTER TABLE public.community_messages
ADD COLUMN media_url text,
ADD COLUMN media_type text;

-- Add index for better query performance
CREATE INDEX idx_community_messages_media ON public.community_messages(media_type) WHERE media_type IS NOT NULL;

-- Add constraints for media fields
ALTER TABLE public.community_messages
ADD CONSTRAINT check_media_type CHECK (media_type IN ('image', 'video') OR media_type IS NULL);