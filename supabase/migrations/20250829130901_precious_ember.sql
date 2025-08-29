/*
  # Add user location fields to users table

  1. Schema Changes
    - Add `county` field to users table (text, nullable)
    - Add `eircode` field to users table (text, nullable)
    - Add index on county for efficient filtering

  2. Purpose
    - Store user's personal county and eircode (home address)
    - Separate from campaign event location (stored in campaigns table)
    - Allows for analytics and user management by location

  3. Notes
    - Fields are nullable since existing users won't have this data
    - County should match Irish county names
    - Eircode follows Irish postal code format
*/

-- Add county and eircode fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'county'
  ) THEN
    ALTER TABLE users ADD COLUMN county text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'eircode'
  ) THEN
    ALTER TABLE users ADD COLUMN eircode text;
  END IF;
END $$;

-- Add index on county for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_county ON users(county);

-- Add comment to clarify purpose
COMMENT ON COLUMN users.county IS 'User''s home county (personal address)';
COMMENT ON COLUMN users.eircode IS 'User''s home eircode (personal address)';