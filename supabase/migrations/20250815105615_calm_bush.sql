/*
  # Coffee Morning Pack System Migration

  1. New Tables
    - `pack_orders`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `user_id` (uuid, foreign key to auth.users)
      - `amount` (integer, pack cost in cents)
      - `pack_type` (text, enum: free/medium/large)
      - `tshirt_sizes` (jsonb, t-shirt size selections)
      - `payment_status` (text, enum: pending/completed/failed)
      - `stripe_payment_intent_id` (text, nullable)
      - `stripe_payment_link_id` (text, nullable)
      - `shipping_address` (jsonb, delivery address)
      - `mobile_number` (text, contact number)
      - `created_at` (timestamp)
      - `paid_at` (timestamp, nullable)

  2. Campaign Updates
    - Add `pack_payment_status` column to campaigns table
    - Add `pack_order_id` column to campaigns table

  3. Security
    - Enable RLS on `pack_orders` table
    - Add policies for users to manage their own pack orders
    - Add policies for admins to view all pack orders
    - Add policies for public to create pack orders for active campaigns

  4. Indexes
    - Add indexes for efficient querying by campaign_id, user_id, payment_status
*/

-- Create pack_orders table
CREATE TABLE IF NOT EXISTS pack_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  user_id uuid,
  amount integer NOT NULL DEFAULT 1000,
  pack_type text NOT NULL DEFAULT 'free',
  tshirt_sizes jsonb,
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_payment_link_id text,
  shipping_address jsonb NOT NULL,
  mobile_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  
  CONSTRAINT pack_orders_amount_check CHECK (amount > 0),
  CONSTRAINT pack_orders_pack_type_check CHECK (pack_type IN ('free', 'medium', 'large')),
  CONSTRAINT pack_orders_payment_status_check CHECK (payment_status IN ('pending', 'completed', 'failed'))
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pack_orders_campaign_id_fkey'
  ) THEN
    ALTER TABLE pack_orders 
    ADD CONSTRAINT pack_orders_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pack_orders_user_id_fkey'
  ) THEN
    ALTER TABLE pack_orders 
    ADD CONSTRAINT pack_orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add pack-related columns to campaigns table
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

-- Add constraint for pack_payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'campaigns_pack_payment_status_check'
  ) THEN
    ALTER TABLE campaigns 
    ADD CONSTRAINT campaigns_pack_payment_status_check 
    CHECK (pack_payment_status IN ('pending', 'completed', 'failed'));
  END IF;
END $$;

-- Add foreign key for pack_order_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'campaigns_pack_order_id_fkey'
  ) THEN
    ALTER TABLE campaigns 
    ADD CONSTRAINT campaigns_pack_order_id_fkey 
    FOREIGN KEY (pack_order_id) REFERENCES pack_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for pack_orders
CREATE INDEX IF NOT EXISTS idx_pack_orders_campaign_id ON pack_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pack_orders_user_id ON pack_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_orders_payment_status ON pack_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_pack_orders_created_at ON pack_orders(created_at DESC);

-- Create indexes for campaigns pack columns
CREATE INDEX IF NOT EXISTS idx_campaigns_pack_payment_status ON campaigns(pack_payment_status);

-- Enable RLS on pack_orders
ALTER TABLE pack_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pack_orders

-- Users can create pack orders
CREATE POLICY IF NOT EXISTS "Users can create pack orders"
  ON pack_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Public can create pack orders for campaigns (for non-authenticated users)
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
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() ->> 'role') = 'super_admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'super_admin'
  );

-- Admins can update pack orders
CREATE POLICY IF NOT EXISTS "Admins can update pack orders"
  ON pack_orders
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() ->> 'role') = 'super_admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin' OR
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'super_admin'
  );