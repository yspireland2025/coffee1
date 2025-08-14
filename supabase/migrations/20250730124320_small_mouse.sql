/*
  # Update admin password with proper bcrypt hash

  1. Security
    - Updates the existing admin user password with a proper bcrypt hash
    - Ensures the password column can store the full hash length
  
  2. Changes
    - Modifies password column to ensure sufficient length for bcrypt hashes
    - Updates admin@yspi.ie password with bcrypt hash of "admin123"
*/

-- Ensure password column can store bcrypt hashes (they're typically 60 characters)
ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);

-- Update the admin user's password with a proper bcrypt hash
-- This is the bcrypt hash for "admin123" with salt rounds 12
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBksURs5q.BQ5W',
    updated_at = now()
WHERE email = 'admin@yspi.ie';

-- Verify the update was successful
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE email = 'admin@yspi.ie' 
    AND password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBksURs5q.BQ5W'
  ) THEN
    RAISE EXCEPTION 'Admin password update failed';
  END IF;
END $$;