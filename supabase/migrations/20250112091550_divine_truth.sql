/*
  # Add username change support

  1. Changes
    - Add last_username_change column to track when users last changed their username
    - Add function to handle username changes with rate limiting
*/

-- Add column to track username changes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_username_change timestamptz;

-- Function to change username with rate limiting
CREATE OR REPLACE FUNCTION change_username(user_id uuid, new_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_change timestamptz;
BEGIN
  -- Check if username is valid
  IF NOT validate_username(new_username) THEN
    RAISE EXCEPTION 'Invalid username format';
  END IF;

  -- Get last username change
  SELECT last_username_change INTO last_change
  FROM profiles
  WHERE id = user_id;

  -- Allow change if never changed before or more than 30 days have passed
  IF last_change IS NULL OR last_change < now() - interval '30 days' THEN
    UPDATE profiles
    SET 
      username = new_username,
      last_username_change = now()
    WHERE id = user_id;
    RETURN true;
  END IF;

  RAISE EXCEPTION 'Username can only be changed once every 30 days';
END;
$$;