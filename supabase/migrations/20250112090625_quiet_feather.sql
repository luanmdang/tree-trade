/*
  # Add listing expiry functionality

  1. Changes
    - Add expires_at column to listings table
    - Add function to clean up expired listings
    - Add trigger to clean up expired listings on any DML operation

  2. Security
    - Function runs with SECURITY DEFINER to ensure cleanup works
*/

-- Add expires_at column
ALTER TABLE listings 
ADD COLUMN expires_at timestamptz 
DEFAULT (now() + interval '24 hours');

-- Create function to clean up expired listings
CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired listings
  DELETE FROM listings
  WHERE expires_at < now();
  
  -- Continue with the original operation
  RETURN NULL;
END;
$$;

-- Create trigger to clean up expired listings
CREATE TRIGGER cleanup_expired_listings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_listings();

-- Update existing listings to have an expiry time
UPDATE listings
SET expires_at = created_at + interval '24 hours'
WHERE expires_at IS NULL;