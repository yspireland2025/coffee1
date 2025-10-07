/*
  # Add System Settings Table

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting key name
      - `value` (text) - Setting value
      - `description` (text) - Human-readable description
      - `is_secret` (boolean) - Whether this is sensitive data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for public read access to non-secret settings
    - Add policy for authenticated admin write access
  
  3. Initial Data
    - Insert Google Maps API key setting
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  is_secret boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read non-secret settings"
  ON system_settings
  FOR SELECT
  USING (is_secret = false);

CREATE POLICY "Authenticated users can read all settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage settings"
  ON system_settings
  FOR ALL
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

INSERT INTO system_settings (key, value, description, is_secret)
VALUES (
  'google_maps_api_key',
  'AIzaSyDWJUaXEfQWqNvafQsj3ecoOxxOU6gTPyE',
  'Google Maps API key for geocoding and map display',
  false
)
ON CONFLICT (key) DO NOTHING;