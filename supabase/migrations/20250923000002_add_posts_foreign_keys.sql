-- Add missing foreign key constraints to posts table

-- Add foreign key constraint for posts.group_id -> connections_groups(id)
ALTER TABLE public.posts
ADD CONSTRAINT posts_group_id_fkey
FOREIGN KEY (group_id) REFERENCES public.connections_groups(id)
ON DELETE CASCADE;

-- Add foreign key constraint for posts.user_id -> users(id)
ALTER TABLE public.posts
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;