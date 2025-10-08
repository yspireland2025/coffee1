/*
  # Add shipping status to pack orders

  1. Changes
    - Add `shipping_status` column to `pack_orders` table
      - Possible values: 'pending', 'shipped', 'delivered'
      - Defaults to 'pending'
    - Add `shipped_at` timestamp column to track when package was shipped
    - Create trigger to automatically set shipping_status to 'shipped' when tracking_number is added
  
  2. Notes
    - When a tracking number is added, the status will automatically change to 'shipped'
    - The shipped_at timestamp will be set automatically
*/

-- Add shipping_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'shipping_status'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN shipping_status text DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'shipped', 'delivered'));
  END IF;
END $$;

-- Add shipped_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN shipped_at timestamptz;
  END IF;
END $$;

-- Create trigger function to auto-update shipping status when tracking number is added
CREATE OR REPLACE FUNCTION update_shipping_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If tracking_number is being set (from NULL to a value) and shipping_status is still pending
  IF NEW.tracking_number IS NOT NULL 
     AND OLD.tracking_number IS NULL 
     AND NEW.shipping_status = 'pending' THEN
    NEW.shipping_status := 'shipped';
    NEW.shipped_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_shipping_status ON pack_orders;

CREATE TRIGGER set_shipping_status
  BEFORE UPDATE ON pack_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_status();