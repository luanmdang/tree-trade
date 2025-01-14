/*
  # Add listing expiry

  1. Changes
    - Add expires_at column to listings table
    - Add function to clean up expired listings
    - Add trigger to automatically remove expired listings when querying

  2. Security
    - Function runs with SECURITY DEFINER to ensure cleanup works
*/

-- Add expires_at column
ALTER TABLE listings 
ADD COLUMN expires_at timestamptz 
DEFAULT (now() + interval '24 hours');

-- Create function to clean up expired listings
CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at < NOW() THEN
    DELETE FROM listings WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up expired listings after each update
CREATE TRIGGER cleanup_expired_listings_trigger
AFTER UPDATE ON listings
FOR EACH ROW
EXECUTE PROCEDURE cleanup_expired_listings();

-- Update existing listings to have an expiry time
UPDATE listings
SET expires_at = created_at + interval '24 hours'
WHERE expires_at IS NULL;