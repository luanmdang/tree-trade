/*
  # Create listings table and policies

  1. New Tables
    - `listings`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `price` (text)
      - `category` (text)
      - `condition` (text)
      - `images` (text array)
      - `location` (jsonb)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `listings` table
    - Add policies for:
      - Anyone can view listings
      - Only authenticated users can insert listings
      - Only listing owners can update/delete their listings
*/

CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price text NOT NULL,
  category text NOT NULL,
  condition text NOT NULL,
  images text[] DEFAULT ARRAY[]::text[],
  location jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view listings
CREATE POLICY "Anyone can view listings"
  ON listings
  FOR SELECT
  USING (true);

-- Allow authenticated users to create listings
CREATE POLICY "Authenticated users can create listings"
  ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own listings
CREATE POLICY "Users can update own listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own listings
CREATE POLICY "Users can delete own listings"
  ON listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);