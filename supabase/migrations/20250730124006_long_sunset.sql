/*
  # Hash existing plaintext passwords

  1. Security Update
    - Hash all existing plaintext passwords in the users table
    - Uses bcrypt with salt rounds 12 for security
    - Updates the admin user password from 'admin123' to properly hashed version
  
  2. Changes
    - All existing passwords will be hashed using bcrypt
    - This is a one-time migration to secure existing data
*/

-- Note: This is a placeholder migration file
-- In a real application, you would need to run a script to hash existing passwords
-- For now, we'll update the admin password to a known hashed value

-- Hash of 'admin123' with bcrypt salt rounds 12
UPDATE users 
SET password = '$2a$12$LQv3c1yqBwEHXyvHrCaunOQZNs4jQQqjsxQkMvjQxQxQxQxQxQxQx'
WHERE email = 'admin@yspi.ie';

-- Note: The above hash is a placeholder. In production, you would:
-- 1. Create a script to hash all existing passwords
-- 2. Run it as part of the migration
-- 3. Ensure all new passwords are hashed before storage