-- Update users table to support multiple photos
-- First, create a new photos column as jsonb array
ALTER TABLE public.users ADD COLUMN photos jsonb DEFAULT '[]'::jsonb;

-- Migrate existing photo_url data to the new photos array
UPDATE public.users 
SET photos = CASE 
  WHEN photo_url IS NOT NULL AND photo_url != '' 
  THEN jsonb_build_array(photo_url)
  ELSE '[]'::jsonb
END
WHERE photo_url IS NOT NULL;

-- Create an index for better performance on photos queries
CREATE INDEX idx_users_photos ON public.users USING GIN(photos);

-- We'll keep photo_url for now for backward compatibility, but it will be deprecated