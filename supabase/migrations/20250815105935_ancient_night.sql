/*
  # Add foreign key constraints to pack_orders table

  1. Changes
    - Add foreign key constraint for campaign_id
    - Add foreign key constraint for user_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pack_orders_campaign_id_fkey'
    AND table_name = 'pack_orders'
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
    AND table_name = 'pack_orders'
  ) THEN
    ALTER TABLE pack_orders 
    ADD CONSTRAINT pack_orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;