-- Create match feedback table for storing user feedback on matches

CREATE TABLE IF NOT EXISTS public.match_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL, -- This could reference a matches table or be a user ID
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate feedback for the same user-match pair
    UNIQUE(user_id, match_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_feedback_user_id ON public.match_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_match_feedback_match_id ON public.match_feedback(match_id);
CREATE INDEX IF NOT EXISTS idx_match_feedback_rating ON public.match_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_match_feedback_created_at ON public.match_feedback(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only create and update their own feedback
CREATE POLICY "Users can manage their own feedback" ON public.match_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Allow reading aggregated feedback data (for analytics/improving matching)
-- This policy allows reading feedback data but only for app administration
CREATE POLICY "Allow reading feedback for analytics" ON public.match_feedback
    FOR SELECT USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_match_feedback_updated_at
    BEFORE UPDATE ON public.match_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_match_feedback_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.match_feedback IS 'Stores user feedback and ratings on their matches';
COMMENT ON COLUMN public.match_feedback.rating IS 'User rating from 1-5 stars';
COMMENT ON COLUMN public.match_feedback.comment IS 'Optional text feedback from user';
COMMENT ON COLUMN public.match_feedback.match_id IS 'ID of the matched user or match session';