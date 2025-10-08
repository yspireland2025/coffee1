/*
  # Add pack contents table

  1. New Tables
    - `pack_contents`
      - `id` (uuid, primary key)
      - `pack_type` (text) - free, medium, or large
      - `item_name` (text) - name of the item
      - `quantity` (integer) - how many of this item
      - `display_order` (integer) - order to display items
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `pack_contents` table
    - Add policy for public read access (anyone can view pack contents)
    - Add policy for authenticated admin users to manage contents
  
  3. Notes
    - This table defines what items are in each pack type
    - Will be used to generate packing lists with proper quantities
    - Display order helps organize the packing list logically
*/

-- Create pack_contents table
CREATE TABLE IF NOT EXISTS pack_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_type text NOT NULL CHECK (pack_type IN ('free', 'medium', 'large')),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pack_contents ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view pack contents
CREATE POLICY "Anyone can view pack contents"
  ON pack_contents
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only authenticated admins can insert pack contents
CREATE POLICY "Admins can insert pack contents"
  ON pack_contents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Only authenticated admins can update pack contents
CREATE POLICY "Admins can update pack contents"
  ON pack_contents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Only authenticated admins can delete pack contents
CREATE POLICY "Admins can delete pack contents"
  ON pack_contents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Insert default pack contents
INSERT INTO pack_contents (pack_type, item_name, quantity, display_order) VALUES
  -- Free pack items
  ('free', 'Fundraising Guide', 1, 1),
  ('free', 'Poster A3', 5, 2),
  ('free', 'Poster A4', 10, 3),
  ('free', 'Collection Buckets', 2, 4),
  ('free', 'Raffle Books', 5, 5),
  ('free', 'Sponsor Cards', 20, 6),
  
  -- Medium pack items
  ('medium', 'Fundraising Guide', 1, 1),
  ('medium', 'Poster A3', 10, 2),
  ('medium', 'Poster A4', 20, 3),
  ('medium', 'Collection Buckets', 4, 4),
  ('medium', 'Raffle Books', 10, 5),
  ('medium', 'Sponsor Cards', 50, 6),
  ('medium', 'T-Shirts', 2, 7),
  ('medium', 'Branded Pens', 10, 8),
  
  -- Large pack items
  ('large', 'Fundraising Guide', 2, 1),
  ('large', 'Poster A3', 20, 2),
  ('large', 'Poster A4', 40, 3),
  ('large', 'Collection Buckets', 6, 4),
  ('large', 'Raffle Books', 20, 5),
  ('large', 'Sponsor Cards', 100, 6),
  ('large', 'T-Shirts', 4, 7),
  ('large', 'Branded Pens', 25, 8),
  ('large', 'Banner (Large)', 1, 9)
ON CONFLICT DO NOTHING;