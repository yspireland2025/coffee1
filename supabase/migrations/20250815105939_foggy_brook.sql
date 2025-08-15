/*
  # Add indexes to pack_orders table

  1. Indexes
    - Add index on campaign_id for efficient campaign lookups
    - Add index on user_id for user pack order queries
    - Add index on payment_status for status filtering
    - Add index on created_at for chronological ordering
*/

CREATE INDEX IF NOT EXISTS idx_pack_orders_campaign_id 
ON pack_orders (campaign_id);

CREATE INDEX IF NOT EXISTS idx_pack_orders_user_id 
ON pack_orders (user_id);

CREATE INDEX IF NOT EXISTS idx_pack_orders_payment_status 
ON pack_orders (payment_status);

CREATE INDEX IF NOT EXISTS idx_pack_orders_created_at 
ON pack_orders (created_at DESC);