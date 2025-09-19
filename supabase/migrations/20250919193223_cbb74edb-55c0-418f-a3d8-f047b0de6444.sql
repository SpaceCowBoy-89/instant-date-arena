-- Add media_urls field to posts table to store image URLs
ALTER TABLE public.posts 
ADD COLUMN media_urls jsonb DEFAULT '[]'::jsonb;