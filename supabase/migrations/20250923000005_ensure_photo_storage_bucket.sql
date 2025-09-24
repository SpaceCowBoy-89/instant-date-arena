-- Ensure post-images bucket exists
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for post-images bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can view images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY IF NOT EXISTS "Users can update their own images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete their own images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);