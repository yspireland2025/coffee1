/*
  # Add Campaign Number Field

  1. Changes
    - Add `campaign_number` integer field to campaigns table
    - Create sequence starting at 1000
    - Create trigger to auto-increment campaign_number on insert
    - Update existing campaigns with sequential numbers starting at 1000
    
  2. Details
    - campaign_number is unique and not null
    - Auto-increments for each new campaign
    - Provides user-friendly URLs like /campaign/1001
    
  3. Notes
    - Existing campaigns will be numbered sequentially from 1000
    - New campaigns will continue incrementing from the highest number
*/

-- Add campaign_number column (nullable first for existing data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'campaign_number'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN campaign_number integer;
  END IF;
END $$;

-- Create sequence for campaign numbers starting at 1000
CREATE SEQUENCE IF NOT EXISTS campaign_number_seq START WITH 1000 INCREMENT BY 1;

-- Update existing campaigns with sequential numbers starting at 1000
DO $$
DECLARE
  campaign_record RECORD;
  current_number integer := 1000;
BEGIN
  FOR campaign_record IN 
    SELECT id FROM campaigns WHERE campaign_number IS NULL ORDER BY created_at
  LOOP
    UPDATE campaigns 
    SET campaign_number = current_number 
    WHERE id = campaign_record.id;
    current_number := current_number + 1;
  END LOOP;
  
  -- Set the sequence to continue from the last assigned number
  PERFORM setval('campaign_number_seq', current_number);
END $$;

-- Make campaign_number NOT NULL and UNIQUE
ALTER TABLE campaigns ALTER COLUMN campaign_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_campaign_number_unique ON campaigns(campaign_number);

-- Create function to auto-assign campaign numbers
CREATE OR REPLACE FUNCTION assign_campaign_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_number IS NULL THEN
    NEW.campaign_number := nextval('campaign_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign campaign numbers on insert
DROP TRIGGER IF EXISTS set_campaign_number ON campaigns;
CREATE TRIGGER set_campaign_number
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION assign_campaign_number();
