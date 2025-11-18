-- Supabase Storage Policies for 'listings' bucket
-- Run these in your Supabase SQL Editor

-- 1. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload to listings bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings'
);

-- 2. Allow public read access to images
CREATE POLICY "Public can view listings images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'listings'
);

-- 3. Allow users to delete their own uploads
CREATE POLICY "Users can delete own listings images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings' AND
  auth.uid() = owner::uuid
);

-- 4. Allow users to update their own uploads
CREATE POLICY "Users can update own listings images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listings' AND
  auth.uid() = owner::uuid
);
