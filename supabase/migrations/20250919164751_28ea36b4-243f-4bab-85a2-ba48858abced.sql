-- Create posts table (using existing messages as base)
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create post_bookmarks table  
CREATE TABLE public.post_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts
CREATE POLICY "Users can view posts in groups they belong to" 
ON public.posts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_connections_groups
  WHERE user_connections_groups.user_id = auth.uid() 
  AND user_connections_groups.group_id = posts.group_id
));

CREATE POLICY "Users can create posts in groups they belong to" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM user_connections_groups
  WHERE user_connections_groups.user_id = auth.uid() 
  AND user_connections_groups.group_id = posts.group_id
));

-- RLS policies for post_likes
CREATE POLICY "Users can view likes on posts they can see" 
ON public.post_likes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM posts 
  JOIN user_connections_groups ucg ON posts.group_id = ucg.group_id
  WHERE posts.id = post_likes.post_id 
  AND ucg.user_id = auth.uid()
));

CREATE POLICY "Users can like posts" 
ON public.post_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.post_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for post_bookmarks
CREATE POLICY "Users can view their own bookmarks" 
ON public.post_bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" 
ON public.post_bookmarks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own bookmarks" 
ON public.post_bookmarks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at on posts
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();