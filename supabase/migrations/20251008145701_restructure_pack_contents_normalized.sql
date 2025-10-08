/*
  # Restructure Pack Contents - Normalized Design

  1. Changes
    - Create `items` table for fundraising pack items
    - Create `pack_items` junction table linking items to pack types with quantities
    - Migrate data from old `pack_contents` table
    - Drop old `pack_contents` table

  2. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `display_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pack_items`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key to items)
      - `pack_type` (text: free, medium, large)
      - `quantity` (integer)
      - `created_at` (timestamp)
      - Unique constraint on (item_id, pack_type)

  3. Security
    - Enable RLS on both tables
    - Public can view items and pack_items
    - Only admins can insert/update/delete
*/

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pack_items junction table
CREATE TABLE IF NOT EXISTS pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  pack_type text NOT NULL CHECK (pack_type IN ('free', 'medium', 'large')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, pack_type)
);

-- Migrate data from pack_contents to new structure
-- First, extract unique items
INSERT INTO items (name, display_order)
SELECT DISTINCT 
  item_name,
  MIN(display_order) as display_order
FROM pack_contents
GROUP BY item_name
ON CONFLICT (name) DO NOTHING;

-- Then, create pack_items entries
INSERT INTO pack_items (item_id, pack_type, quantity)
SELECT 
  i.id,
  pc.pack_type,
  pc.quantity
FROM pack_contents pc
JOIN items i ON i.name = pc.item_name
ON CONFLICT (item_id, pack_type) DO NOTHING;

-- Drop old table
DROP TABLE IF EXISTS pack_contents;

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update items"
  ON items FOR UPDATE
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

CREATE POLICY "Admins can delete items"
  ON items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for pack_items
CREATE POLICY "Anyone can view pack items"
  ON pack_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert pack items"
  ON pack_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update pack items"
  ON pack_items FOR UPDATE
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

CREATE POLICY "Admins can delete pack items"
  ON pack_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pack_items_item_id ON pack_items(item_id);
CREATE INDEX IF NOT EXISTS idx_pack_items_pack_type ON pack_items(pack_type);
CREATE INDEX IF NOT EXISTS idx_items_display_order ON items(display_order);
