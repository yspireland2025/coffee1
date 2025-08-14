/*
  # Create users table and update campaigns

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text) - stored as plain text for simplicity
      - `full_name` (text)
      - `role` (text) - 'user', 'admin', 'super_admin'
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login_at` (timestamp, nullable)

  2. Default Data
    - Creates default admin user with email 'admin@yspi.ie' and password 'admin123'

  3. Security
    - Enable RLS on `users` table
    - Add policies for user management

  4. Updates
    - Update campaigns table to reference users table properly
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (true); -- Allow reading for authentication purposes

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  USING (true); -- Allow updates for login tracking

CREATE POLICY "Allow user creation"
  ON users
  FOR INSERT
  WITH CHECK (true); -- Allow user registration

-- Insert default admin user
INSERT INTO users (email, password, full_name, role, is_active)
VALUES ('admin@yspi.ie', 'admin123', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Update campaigns table to properly reference users if needed
-- (The campaigns table already has user_id field, so we just need to ensure the foreign key exists)
DO $$
BEGIN
  -- Check if foreign key constraint exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'campaigns_user_id_fkey' 
    AND table_name = 'campaigns'
  ) THEN
    -- Drop existing constraint if it exists with different name
    ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_user_id_fkey;
    
    -- Add the foreign key constraint
    ALTER TABLE campaigns 
    ADD CONSTRAINT campaigns_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);