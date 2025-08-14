/*
  # Confirm Admin Email

  This migration confirms the email for the admin user and ensures they can log in immediately.
  
  1. Updates
     - Sets email_confirmed_at timestamp for admin user
     - Ensures the user is marked as confirmed
  
  2. Notes
     - Run this after creating the admin user in Supabase Auth
     - Replace the email if you're using a different admin email
*/

-- Confirm the admin user's email
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@yspi.ie';

-- Verify the update worked
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'admin@yspi.ie';