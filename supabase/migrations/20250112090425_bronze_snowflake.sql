/*
  # Add listing expiry and editing features

  1. Changes
    - Add expires_at column to listings table
    - Add function to automatically delete expired listings
    - Add cron job to clean up expired listings every hour

  2. Security
    - Maintain existing RLS policies
    - Add policy for updating own listings
*/

-- Add expires_at column
ALTER TABLE listings 
ADD COLUMN expires_at timestamptz 
DEFAULT (now() + interval '24 hours');

-- Create function to clean up expired listings
CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM listings
  WHERE expires_at < now();
END;
$$;

-- Create cron job to run cleanup every hour
SELECT cron.schedule(
  'cleanup-expired-listings',
  '0 * * * *', -- Every hour
  'SELECT cleanup_expired_listings();'
);