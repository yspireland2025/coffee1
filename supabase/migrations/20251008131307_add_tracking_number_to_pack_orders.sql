/*
  # Add tracking number to pack orders

  1. Changes
    - Add `tracking_number` column to `pack_orders` table (text, nullable)
    - This will store the shipping tracking number for each pack order

  2. Notes
    - Tracking number is nullable as it may not be available immediately
    - Can be updated by admins once the pack has been shipped
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN tracking_number text;
  END IF;
END $$;