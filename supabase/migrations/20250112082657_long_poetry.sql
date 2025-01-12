/*
  # Fix listings and profiles relationship

  1. Changes
    - Add foreign key constraint to listings table for user_id referencing profiles table
  
  2. Security
    - No changes to existing policies
*/

-- Add foreign key constraint to listings table
ALTER TABLE listings
ADD CONSTRAINT listings_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;