-- Add status enum type for chats
CREATE TYPE public.chat_status AS ENUM ('active', 'ended_by_departure', 'ended_manually', 'completed');

-- Add new columns to chats table
ALTER TABLE public.chats 
ADD COLUMN status chat_status NOT NULL DEFAULT 'active',
ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ended_by UUID;

-- Update RLS policies to handle new fields
CREATE POLICY "Users can update chat status for their chats" 
ON public.chats 
FOR UPDATE 
USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- Enable replica identity for realtime updates (skip publication since already exists)
ALTER TABLE public.chats REPLICA IDENTITY FULL;