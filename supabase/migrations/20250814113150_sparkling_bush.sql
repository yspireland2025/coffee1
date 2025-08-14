/*
  # Add pack type and t-shirt sizes to pack orders

  1. Schema Changes
    - Add `pack_type` column to `pack_orders` table (enum: free, medium, large)
    - Add `tshirt_sizes` column to `pack_orders` table (jsonb for storing t-shirt size selections)

  2. Data Migration
    - Set default pack_type to 'free' for existing records
    - Set default tshirt_sizes to null for existing records

  3. Constraints
    - Add check constraint for valid pack types
*/

-- Add pack_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'pack_type'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN pack_type text DEFAULT 'free';
  END IF;
END $$;

-- Add tshirt_sizes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pack_orders' AND column_name = 'tshirt_sizes'
  ) THEN
    ALTER TABLE pack_orders ADD COLUMN tshirt_sizes jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add check constraint for pack_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pack_orders_pack_type_check'
  ) THEN
    ALTER TABLE pack_orders ADD CONSTRAINT pack_orders_pack_type_check 
    CHECK (pack_type IN ('free', 'medium', 'large'));
  END IF;
END $$;

-- Update existing records to have pack_type = 'free'
UPDATE pack_orders SET pack_type = 'free' WHERE pack_type IS NULL;

-- Make pack_type NOT NULL after setting defaults
ALTER TABLE pack_orders ALTER COLUMN pack_type SET NOT NULL;