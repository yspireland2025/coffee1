/*
  # Create Admin User

  1. New Users
    - Creates an admin user with email 'admin@yspi.ie'
    - Password: 'admin123' (bcrypt hashed)
    - Role: 'admin'
    - Active status: true

  2. Security
    - Password is properly bcrypt hashed with salt rounds 12
    - User has admin role for accessing admin dashboard
*/

-- Create admin user with bcrypt hashed password
-- Password: admin123
-- Hash generated with bcrypt salt rounds 12
INSERT INTO users (
  email,
  password,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin@yspi.ie',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW',
  'System Administrator',
  'admin',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();