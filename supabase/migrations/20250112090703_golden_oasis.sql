/*
  # Add listing expiry functionality

  1. Changes
    - Add expires_at column to listings table
    - Add function to mark listings as expired
    - Add function to clean up expired listings
    - Update existing listings with expiry time

  2. Security
    - Functions run with SECURITY DEFINER to ensure cleanup works
*/

-- Add expires_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE listings 
    ADD COLUMN expires_at timestamptz 
    DEFAULT (now() + interval '24 hours');
  END IF;
END $$;

-- Create function to mark listings as expired
CREATE OR REPLACE FUNCTION mark_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark listings as expired by setting expires_at to now()
  UPDATE listings
  SET expires_at = now()
  WHERE expires_at > now() 
  AND created_at < now() - interval '24 hours';
END;
$$;

-- Create function to clean up expired listings
CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete listings that have been expired for more than 1 hour
  DELETE FROM listings
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- Update existing listings to have an expiry time if they don't have one
UPDATE listings
SET expires_at = LEAST(created_at + interval '24 hours', now() + interval '24 hours')
WHERE expires_at IS NULL;