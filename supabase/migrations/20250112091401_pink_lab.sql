/*
  # Add username support to profiles

  1. Changes
    - Add username column to profiles table
    - Add unique constraint for usernames
    - Update trigger to handle usernames
    - Add username validation function
  
  2. Security
    - Maintain existing RLS policies
    - Add validation for username format
*/

-- Add username column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN username text UNIQUE;
  END IF;
END $$;

-- Create function to validate username format
CREATE OR REPLACE FUNCTION validate_username(username text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Username must be 3-20 characters, alphanumeric or underscore
  RETURN username ~ '^[a-zA-Z0-9_]{3,20}$';
END;
$$;

-- Update the trigger function to handle usernames
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_username text;
  counter int := 0;
BEGIN
  -- Generate base username from email
  default_username := split_part(new.email, '@', 1);
  
  -- Ensure username meets length requirements
  IF length(default_username) < 3 THEN
    default_username := default_username || repeat('0', 3 - length(default_username));
  END IF;
  IF length(default_username) > 20 THEN
    default_username := substring(default_username, 1, 20);
  END IF;
  
  -- Replace invalid characters
  default_username := regexp_replace(default_username, '[^a-zA-Z0-9_]', '_', 'g');
  
  -- Try to insert with numbered suffix if username exists
  WHILE counter < 1000 LOOP
    BEGIN
      INSERT INTO public.profiles (
        id,
        name,
        avatar,
        username
      )
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'User'),
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
        CASE 
          WHEN counter = 0 THEN default_username
          ELSE default_username || counter::text
        END
      );
      EXIT;
    EXCEPTION 
      WHEN unique_violation THEN
        counter := counter + 1;
    END;
  END LOOP;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;