/*
  # Create Admin User and Setup RLS Policies

  1. Admin User Setup
    - Creates admin user with proper role metadata
    - Sets up admin-specific RLS policies

  2. Security Updates
    - Updates RLS policies to allow admin operations
    - Ensures proper access control for admin functions
*/

-- First, we need to create the admin user in Supabase Auth
-- This needs to be done through the Supabase dashboard or API, not SQL

-- Update RLS policies to allow admin users to manage campaigns
DROP POLICY IF EXISTS "Admins can manage all campaigns" ON campaigns;
CREATE POLICY "Admins can manage all campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Update RLS policies to allow admin users to manage donations
DROP POLICY IF EXISTS "Admins can manage all donations" ON donations;
CREATE POLICY "Admins can manage all donations"
  ON donations
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );