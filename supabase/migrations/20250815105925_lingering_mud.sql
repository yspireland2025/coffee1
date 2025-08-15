/*
  # Create pack_orders table

  1. New Tables
    - `pack_orders`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `user_id` (uuid, foreign key to auth.users)
      - `amount` (integer, pack cost in cents)
      - `pack_type` (text, enum: free/medium/large)
      - `payment_status` (text, enum: pending/completed/failed)
      - `created_at` (timestamp)
*/

CREATE TABLE IF NOT EXISTS pack_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  user_id uuid,
  amount integer NOT NULL DEFAULT 1000,
  pack_type text NOT NULL DEFAULT 'free',
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE pack_orders 
ADD CONSTRAINT IF NOT EXISTS pack_orders_amount_check 
CHECK (amount > 0);

ALTER TABLE pack_orders 
ADD CONSTRAINT IF NOT EXISTS pack_orders_pack_type_check 
CHECK (pack_type = ANY (ARRAY['free'::text, 'medium'::text, 'large'::text]));

ALTER TABLE pack_orders 
ADD CONSTRAINT IF NOT EXISTS pack_orders_payment_status_check 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]));