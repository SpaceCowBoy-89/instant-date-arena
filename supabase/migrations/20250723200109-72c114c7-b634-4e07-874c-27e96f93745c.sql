-- Add temporary messages column and timer sync
ALTER TABLE public.chats 
ADD COLUMN temporary_messages jsonb DEFAULT '[]'::jsonb,
ADD COLUMN timer_start_time timestamp with time zone DEFAULT now();

-- Add indexes for better performance
CREATE INDEX idx_chats_timer_start_time ON public.chats(timer_start_time);

-- Update existing chats to have timer_start_time as their created_at
UPDATE public.chats 
SET timer_start_time = created_at 
WHERE timer_start_time IS NULL;