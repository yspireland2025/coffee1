/*
  # Coffee Morning Pack Orders System

  1. New Tables
    - `pack_orders`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `user_id` (uuid, foreign key to auth.users, nullable)
      - `amount` (integer, pack postage cost in cents)
      - `payment_status` (text, enum: pending/completed/failed)
      - `stripe_payment_intent_id` (text, nullable)
      - `stripe_payment_link_id` (text, nullable)
      - `shipping_address` (jsonb, shipping details)
      - `mobile_number` (text, contact number)
      - `created_at` (timestamp)
      - `paid_at` (timestamp, nullable)

  2. Campaign Table Updates
    - Add `pack_payment_status` (text, enum: pending/completed/failed)
    - Add `pack_order_id` (uuid, foreign key to pack_orders, nullable)

  3. Security
    - Enable RLS on `pack_orders` table
    - Add policies for authenticated users and admins
    - Add constraints for data validation

  4. Indexes
    - Index on campaign_id for pack_orders
    - Index on payment_status for filtering
    - Index on created_at for sorting
*/

-- Create pack_orders table
CREATE TABLE IF NOT EXISTS pack_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  user_id uuid,
  amount integer NOT NULL DEFAULT 1000,
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_payment_link_id text,
  shipping_address jsonb NOT NULL,
  mobile_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  
  CONSTRAINT pack_orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'completed', 'failed')),
  CONSTRAINT pack_orders_amount_check 
    CHECK (amount > 0)
);

-- Add pack payment fields to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'pack_payment_status'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN pack_payment_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'pack_order_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN pack_order_id uuid;
  END IF;
END $$;

-- Add constraints to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'campaigns' AND constraint_name = 'campaigns_pack_payment_status_check'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_pack_payment_status_check 
      CHECK (pack_payment_status IN ('pending', 'completed', 'failed'));
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'pack_orders' AND constraint_name = 'pack_orders_campaign_id_fkey'
  ) THEN
    ALTER TABLE pack_orders ADD CONSTRAINT pack_orders_campaign_id_fkey 
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'pack_orders' AND constraint_name = 'pack_orders_user_id_fkey'
  ) THEN
    ALTER TABLE pack_orders ADD CONSTRAINT pack_orders_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'campaigns' AND constraint_name = 'campaigns_pack_order_id_fkey'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_pack_order_id_fkey 
      FOREIGN KEY (pack_order_id) REFERENCES pack_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pack_orders_campaign_id ON pack_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pack_orders_payment_status ON pack_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_pack_orders_created_at ON pack_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pack_orders_user_id ON pack_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_pack_payment_status ON campaigns(pack_payment_status);

-- Enable RLS on pack_orders table
ALTER TABLE pack_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pack_orders
CREATE POLICY "Users can read their own pack orders"
  ON pack_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create pack orders"
  ON pack_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all pack orders"
  ON pack_orders
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() ->> 'role') = 'super_admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'super_admin'
  );

CREATE POLICY "Admins can update pack orders"
  ON pack_orders
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() ->> 'role') = 'super_admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'super_admin'
  );

CREATE POLICY "Public can create pack orders for campaigns"
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