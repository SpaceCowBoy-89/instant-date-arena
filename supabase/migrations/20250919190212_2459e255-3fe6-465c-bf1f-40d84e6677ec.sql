-- Create match_feedback table for storing user feedback on matches
CREATE TABLE public.match_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  match_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- Enable RLS
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own match feedback"
ON public.match_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own match feedback"
ON public.match_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own match feedback"
ON public.match_feedback
FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_match_feedback_updated_at
BEFORE UPDATE ON public.match_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_match_feedback_user_id ON public.match_feedback(user_id);
CREATE INDEX idx_match_feedback_match_id ON public.match_feedback(match_id);