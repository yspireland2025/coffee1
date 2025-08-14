/*
  # Fix RLS policies for campaigns table

  1. Security Changes
    - Drop all existing policies to avoid conflicts
    - Create new policies that work with Supabase auth
    - Allow public reading of approved campaigns
    - Allow authenticated users to create and manage campaigns

  2. Policy Details
    - public_read_approved: Public users can read approved, active campaigns
    - authenticated_insert: Authenticated users can create campaigns with their user_id
    - authenticated_read_all: Authenticated users can read all campaigns
    - authenticated_update_own: Users can update their own campaigns
*/

-- Drop all existing policies to avoid conflicts
DO $$
BEGIN
    -- Drop policies if they exist (ignore errors if they don't exist)
    DROP POLICY IF EXISTS "Public can read approved campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Authenticated users can read all campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
    DROP POLICY IF EXISTS "public_read_approved" ON campaigns;
    DROP POLICY IF EXISTS "authenticated_insert" ON campaigns;
    DROP POLICY IF EXISTS "authenticated_read_all" ON campaigns;
    DROP POLICY IF EXISTS "authenticated_update_own" ON campaigns;
    DROP POLICY IF EXISTS "Anyone can read approved campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Users can create campaigns with valid user_id" ON campaigns;
    DROP POLICY IF EXISTS "Users can read campaigns with valid user_id" ON campaigns;
    DROP POLICY IF EXISTS "Users can update campaigns with valid user_id" ON campaigns;
    DROP POLICY IF EXISTS "Admins can manage all campaigns" ON campaigns;
END $$;

-- Create new policies with unique names
CREATE POLICY "public_read_approved_campaigns"
  ON campaigns
  FOR SELECT
  TO public
  USING (is_approved = true AND is_active = true);

CREATE POLICY "authenticated_create_campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_read_campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_update_own_campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);