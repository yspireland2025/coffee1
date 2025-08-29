/*
  # Add Coffee Morning Pack Orders System

  1. New Tables
    - `pack_orders`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `user_id` (uuid, foreign key to auth.users)
      - `amount` (integer, in cents - €10 = 1000)
      - `payment_status` (enum: pending, completed, failed)
      - `stripe_payment_intent_id` (text, nullable)
      - `stripe_payment_link_id` (text, nullable)
      - `shipping_address` (jsonb)
      - `mobile_number` (text)
      - `created_at` (timestamp)
      - `paid_at` (timestamp, nullable)

  2. Campaign Updates
    - Add `pack_payment_status` column to campaigns
    - Add `pack_order_id` foreign key reference

  3. Security
    - Enable RLS on `pack_orders` table
    - Add policies for users to read their own orders
    - Add policies for admins to manage all orders

  4. Indexes
    - Index on payment_status for admin queries
    - Index on campaign_id for lookups
*/

-- Create pack_orders table
CREATE TABLE IF NOT EXISTS pack_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 1000, -- €10 in cents
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  stripe_payment_intent_id text,
  stripe_payment_link_id text,
  shipping_address jsonb NOT NULL,
  mobile_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Add pack payment status to campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'pack_payment_status'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN pack_payment_status text DEFAULT 'pending' CHECK (pack_payment_status IN ('pending', 'completed', 'failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'pack_order_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN pack_order_id uuid REFERENCES pack_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
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

CREATE POLICY "Users can update their own pack orders"
  ON pack_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pack orders"
  ON pack_orders
  FOR ALL
  TO authenticated
  USING (
    ((jwt() ->> 'role'::text) = 'admin'::text) OR 
    ((jwt() ->> 'role'::text) = 'super_admin'::text) OR 
    (((jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR 
    (((jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'super_admin'::text)
  )
  WITH CHECK (
    ((jwt() ->> 'role'::text) = 'admin'::text) OR 
    ((jwt() ->> 'role'::text) = 'super_admin'::text) OR 
    (((jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR 
    (((jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'super_admin'::text)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pack_orders_payment_status ON pack_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_pack_orders_campaign_id ON pack_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pack_orders_user_id ON pack_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_orders_created_at ON pack_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_pack_payment_status ON campaigns(pack_payment_status);