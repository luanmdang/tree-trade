/*
  # Create storage bucket policies

  1. Security
    - Create policies for storage bucket access
    - Allow authenticated users to upload files
    - Allow public access to view files
    - Allow users to delete their own files
*/

-- Create policies for storage access
DO $$ 
BEGIN
  -- Allow authenticated users to upload files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow authenticated users to upload files'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'listings' AND
      auth.role() = 'authenticated'
    );
  END IF;

  -- Allow public access to files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow public to view files'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow public to view files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'listings');
  END IF;

  -- Allow users to delete their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow users to delete own files'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow users to delete own files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'listings' AND
      auth.uid() = owner
    );
  END IF;
END $$;