/*
  # Update admin user password with correct bcrypt hash

  1. Updates
    - Updates the admin user password with a properly generated bcrypt hash for "admin123"
    - Uses bcrypt with 12 rounds for security

  2. Security
    - Ensures the password hash is compatible with the bcrypt library used in the Edge Function
*/

UPDATE users 
SET password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW',
    updated_at = now()
WHERE email = 'admin@yspi.ie';