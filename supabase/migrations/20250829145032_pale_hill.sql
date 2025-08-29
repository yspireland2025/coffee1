/*
  # Remove NOT NULL constraint from password column

  1. Schema Changes
    - Modify `users` table `password` column to allow NULL values
    - This allows Supabase auth users to have NULL passwords while preserving admin password functionality

  2. Security
    - No changes to existing RLS policies
    - Existing password records for admin users remain intact
*/

-- Remove NOT NULL constraint from password column
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;