/*
  # Add constraints and foreign keys for pack columns in campaigns table

  1. Changes
    - Add check constraint for pack_payment_status
    - Add foreign key constraint for pack_order_id
    - Add index for pack_payment_status
*/

-- Add check constraint for pack_payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'campaigns_pack_payment_status_check'
    AND table_name = 'campaigns'
  ) THEN
    ALTER TABLE campaigns 
    ADD CONSTRAINT campaigns_pack_payment_status_check 
    CHECK (pack_payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]));
  END IF;
END $$;

-- Add foreign key constraint for pack_order_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'campaigns_pack_order_id_fkey'
    AND table_name = 'campaigns'
  ) THEN
    ALTER TABLE campaigns 
    ADD CONSTRAINT campaigns_pack_order_id_fkey 
    FOREIGN KEY (pack_order_id) REFERENCES pack_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for pack_payment_status
CREATE INDEX IF NOT EXISTS idx_campaigns_pack_payment_status 
ON campaigns (pack_payment_status);