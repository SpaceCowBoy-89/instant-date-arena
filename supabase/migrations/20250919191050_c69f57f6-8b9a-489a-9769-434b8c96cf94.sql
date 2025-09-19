-- Create post_comments table for storing comments on community posts
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view comments on posts they can see"
ON public.post_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts
    JOIN user_connections_groups ucg ON posts.group_id = ucg.group_id
    WHERE posts.id = post_comments.post_id 
    AND ucg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on posts they can see"
ON public.post_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM posts
    JOIN user_connections_groups ucg ON posts.group_id = ucg.group_id
    WHERE posts.id = post_comments.post_id 
    AND ucg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);