/*
  # Add pack-related columns to campaigns table

  1. Changes
    - Add `pack_payment_status` column to campaigns table
    - Add `pack_order_id` column to campaigns table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'pack_payment_status'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN pack_payment_status text DEFAULT 'pending'::text;
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