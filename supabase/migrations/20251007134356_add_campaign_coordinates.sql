/*
  # Add Coordinates to Campaigns

  1. Changes
    - Add `latitude` column to campaigns table (decimal for GPS coordinates)
    - Add `longitude` column to campaigns table (decimal for GPS coordinates)
    - Add index on latitude and longitude for efficient geospatial queries
  
  2. Notes
    - Latitude and longitude will be used for mapping campaigns
    - Coordinates can be derived from eircode via geocoding service
    - NULL values allowed as not all campaigns may have coordinates initially
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN latitude decimal(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN longitude decimal(10, 7);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_coordinates ON campaigns(latitude, longitude);