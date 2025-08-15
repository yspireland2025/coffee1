/*
  # Add RLS policies for pack_orders table

  1. Security Policies
    - Users can create pack orders for active campaigns
    - Users can read their own pack orders
    - Admins can read all pack orders
    - Admins can update pack orders
    - Public can create pack orders for campaigns
*/

-- Users can create pack orders
CREATE POLICY IF NOT EXISTS "Users can create pack orders"
  ON pack_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own pack orders
CREATE POLICY IF NOT EXISTS "Users can read their own pack orders"
  ON pack_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all pack orders
CREATE POLICY IF NOT EXISTS "Admins can read all pack orders"
  ON pack_orders
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role'::text) = 'admin'::text OR
    (auth.jwt() ->> 'role'::text) = 'super_admin'::text OR
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text OR
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'super_admin'::text
  );

-- Admins can update pack orders
CREATE POLICY IF NOT EXISTS "Admins can update pack orders"
  ON pack_orders
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role'::text) = 'admin'::text OR
    (auth.jwt() ->> 'role'::text) = 'super_admin'::text OR
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text OR
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'super_admin'::text
  );

-- Public can create pack orders for campaigns
CREATE POLICY IF NOT EXISTS "Public can create pack orders for campaigns"
  ON pack_orders
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = pack_orders.campaign_id
      AND campaigns.is_active = true
    )
  );