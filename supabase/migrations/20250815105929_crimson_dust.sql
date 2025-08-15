/*
  # Add remaining columns to pack_orders table

  1. Changes
    - Add `tshirt_sizes` (jsonb, t-shirt size selections)
    - Add `stripe_payment_intent_id` (text, nullable)
    - Add `stripe_payment_link_id` (text, nullable)
    - Add `shipping_address` (jsonb, delivery address)
    - Add `mobile_number` (text, contact number)
    - Add `paid_at` (timestamp, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'tshirt_sizes'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN tshirt_sizes jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN stripe_payment_intent_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'stripe_payment_link_id'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN stripe_payment_link_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'shipping_address'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'mobile_number'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN mobile_number text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN paid_at timestamptz;
  END IF;
END $$;