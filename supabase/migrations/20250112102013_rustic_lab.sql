/*
  # Add admin policies for listings management

  1. Changes
    - Add admin role
    - Add admin policies for listings table
    - Allow admins to bypass user_id checks

  2. Security
    - Enable admin access to all listings
    - Maintain existing user policies
*/

-- Create admin role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
  END IF;
END $$;

-- Add admin policies for listings
CREATE POLICY "Admins can manage all listings"
  ON listings
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- Grant admin role necessary permissions
GRANT ALL ON listings TO admin;
GRANT USAGE ON SCHEMA public TO admin;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to include admin check
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.is_admin())
  WITH CHECK (auth.uid() = user_id OR auth.is_admin());

DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings"
  ON listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.is_admin());