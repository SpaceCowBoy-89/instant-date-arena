-- Add foreign key constraints with CASCADE DELETE for post-related tables
-- This ensures when a post is deleted, all related data is automatically cleaned up

-- Add foreign key constraint for post_comments
ALTER TABLE public.post_comments 
ADD CONSTRAINT post_comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for post_likes  
ALTER TABLE public.post_likes 
ADD CONSTRAINT post_likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for post_bookmarks
ALTER TABLE public.post_bookmarks 
ADD CONSTRAINT post_bookmarks_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) 
ON DELETE CASCADE;