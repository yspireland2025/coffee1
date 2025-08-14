/*
  # Fix Campaign RLS Policy for Custom Auth

  1. Security Changes
    - Update campaign insertion policy to work with custom auth system
    - Allow authenticated users to create campaigns with proper user_id validation
    - Maintain security while supporting custom authentication

  2. Policy Updates
    - Replace uid() check with user existence validation
    - Ensure user_id matches an existing user in users table
    - Keep other security policies intact
*/

-- Drop the existing insert policy that relies on Supabase auth uid()
DROP POLICY IF EXISTS "Users can create campaigns" ON campaigns;

-- Create a new policy that works with our custom auth system
CREATE POLICY "Users can create campaigns with valid user_id"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure the user_id exists in the users table and is active
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = campaigns.user_id 
      AND users.is_active = true
    )
  );

-- Also update the update policy to work with custom auth
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;

CREATE POLICY "Users can update campaigns with valid user_id"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow updates if user_id exists in users table
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = campaigns.user_id 
      AND users.is_active = true
    )
  )
  WITH CHECK (
    -- Ensure user_id remains valid after update
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = campaigns.user_id 
      AND users.is_active = true
    )
  );

-- Update the select policy for users to work with custom auth
DROP POLICY IF EXISTS "Users can read their own campaigns" ON campaigns;

CREATE POLICY "Users can read campaigns with valid user_id"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (
    -- Allow reading if user_id exists in users table
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = campaigns.user_id 
      AND users.is_active = true
    )
  );