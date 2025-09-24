-- Add post_id column to user_reports table for post-specific reporting
ALTER TABLE public.user_reports
ADD COLUMN post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

-- Add index for better performance when querying reports by post
CREATE INDEX idx_user_reports_post_id ON public.user_reports(post_id);

-- Update RLS policy to allow users to view reports for their own posts
CREATE POLICY "Users can view reports for their own posts"
ON public.user_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = user_reports.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Add constraint to ensure either message_id OR post_id is provided (not both, not neither)
ALTER TABLE public.user_reports
ADD CONSTRAINT check_content_reference
CHECK (
  (message_id IS NOT NULL AND post_id IS NULL) OR
  (message_id IS NULL AND post_id IS NOT NULL)
);