/*
  # Fix RLS policies for public access

  1. Security Updates
    - Ensure public users can read approved campaigns
    - Fix any missing RLS policies
    - Update campaign policies for proper public access

  2. Changes
    - Drop and recreate public read policy for campaigns
    - Ensure proper permissions for anonymous users
*/

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "public_read_approved_campaigns" ON campaigns;

-- Create a comprehensive public read policy for campaigns
CREATE POLICY "public_read_approved_campaigns"
  ON campaigns
  FOR SELECT
  TO public
  USING (is_approved = true AND is_active = true);

-- Ensure RLS is enabled on campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Also ensure donations can be read publicly for approved campaigns
DROP POLICY IF EXISTS "Anyone can read donations for approved campaigns" ON donations;

CREATE POLICY "public_read_donations_for_approved_campaigns"
  ON donations
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 
      FROM campaigns 
      WHERE campaigns.id = donations.campaign_id 
        AND campaigns.is_approved = true 
        AND campaigns.is_active = true
    )
  );

-- Ensure RLS is enabled on donations table
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;