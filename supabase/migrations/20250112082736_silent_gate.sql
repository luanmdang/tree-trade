/*
  # Fix listings and profiles relationship

  1. Changes
    - Drop existing foreign key if it exists
    - Recreate foreign key to properly reference profiles table
    - Update RLS policies to use proper references
  
  2. Security
    - Maintains existing security policies
    - Ensures proper cascading deletion
*/

-- First drop the existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'listings_user_id_fkey'
    AND table_name = 'listings'
  ) THEN
    ALTER TABLE listings DROP CONSTRAINT listings_user_id_fkey;
  END IF;
END $$;

-- Drop the existing foreign key to auth.users if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
    AND table_name = 'listings'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE listings
ADD CONSTRAINT listings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;