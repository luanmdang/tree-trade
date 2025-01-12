/*
  # Create storage bucket for listings

  1. New Storage
    - Create 'listings' bucket for storing listing images
    - Enable public access to images
    - Set up security policies for uploads
*/

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- Create the storage bucket for listings
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings' AND
  auth.role() = 'authenticated'
);

-- Allow public access to files
CREATE POLICY "Allow public to view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings' AND
  auth.uid() = owner
);