/*
  # Fix RLS policies for campaigns table

  1. Security Changes
    - Drop existing restrictive policies that are blocking operations
    - Add policy for public to read approved and active campaigns
    - Add policy for authenticated users to create campaigns
    - Add policy for authenticated users to read all campaigns (for admin/user management)
    - Add policy for authenticated users to update their own campaigns

  2. Policy Details
    - Public users can view approved, active campaigns
    - Authenticated users can create campaigns (with user_id matching their auth.uid())
    - Authenticated users can view all campaigns (needed for admin functions)
    - Authenticated users can update their own campaigns
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all campaigns" ON campaigns;
DROP POLICY IF EXISTS "Anyone can read approved campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns with valid user_id" ON campaigns;
DROP POLICY IF EXISTS "Users can read campaigns with valid user_id" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns with valid user_id" ON campaigns;

-- Policy 1: Allow public (anonymous) users to read approved and active campaigns
CREATE POLICY "Public can read approved campaigns"
  ON campaigns
  FOR SELECT
  TO public
  USING (is_approved = true AND is_active = true);

-- Policy 2: Allow authenticated users to create campaigns (user_id must match their auth.uid())
CREATE POLICY "Authenticated users can create campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow authenticated users to read all campaigns (needed for admin and user management)
CREATE POLICY "Authenticated users can read all campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 4: Allow authenticated users to update their own campaigns
CREATE POLICY "Users can update own campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 5: Allow authenticated users to delete their own campaigns
CREATE POLICY "Users can delete own campaigns"
  ON campaigns
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);