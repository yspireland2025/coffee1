/*
  # Remove Campaign Coordinates

  1. Changes
    - Remove `latitude` column from campaigns table (no longer needed - Google Maps handles geocoding)
    - Remove `longitude` column from campaigns table (no longer needed - Google Maps handles geocoding)
  
  2. Notes
    - Google Maps natively handles eircode geocoding
    - Coordinates are no longer stored in the database
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN latitude;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN longitude;
  END IF;
END $$;
