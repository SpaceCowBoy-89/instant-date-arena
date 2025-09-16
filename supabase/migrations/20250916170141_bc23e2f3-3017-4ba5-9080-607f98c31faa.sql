-- Add missing columns for full functionality

-- Add interests column to users table for better matching
ALTER TABLE public.users 
ADD COLUMN interests JSONB DEFAULT '[]'::jsonb;

-- Add pinned_chats column to users table for message inbox functionality  
ALTER TABLE public.users 
ADD COLUMN pinned_chats JSONB DEFAULT '[]'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_interests ON public.users USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_users_pinned_chats ON public.users USING GIN(pinned_chats);

-- Update existing users to have empty arrays for new columns
UPDATE public.users 
SET interests = '[]'::jsonb, pinned_chats = '[]'::jsonb 
WHERE interests IS NULL OR pinned_chats IS NULL;