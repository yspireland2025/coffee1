/*
  # Create Password Reset Tokens Table

  1. New Tables
    - `password_reset_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, unique) - secure random token
      - `email` (text) - user's email
      - `expires_at` (timestamptz) - token expiration
      - `used` (boolean) - whether token has been used
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `password_reset_tokens` table
    - No public access - only edge functions can access
    - Tokens expire after 1 hour
    - Tokens can only be used once

  3. Indexes
    - Index on token for fast lookups
    - Index on email for user queries
    - Index on expires_at for cleanup
*/

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No public access - only service role (edge functions) can access
CREATE POLICY "Service role only access"
  ON password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
