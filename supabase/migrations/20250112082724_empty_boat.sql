/*
  # Check and add listings-profiles relationship

  1. Changes
    - Safely check and add foreign key constraint between listings and profiles
    - Only adds constraint if it doesn't already exist
  
  2. Security
    - No changes to existing policies
*/

DO $$ 
BEGIN
  -- Check if the constraint doesn't exist before trying to add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'listings_user_id_fkey'
    AND table_name = 'listings'
  ) THEN
    ALTER TABLE listings
    ADD CONSTRAINT listings_user_id_fkey
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;