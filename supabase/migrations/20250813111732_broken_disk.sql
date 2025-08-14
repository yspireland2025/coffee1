/*
  # Fix campaign raised amount trigger

  1. Updates
    - Drop and recreate the trigger function to properly update campaign raised amounts
    - Ensure the function calculates the total from all donations for a campaign
    - Update existing campaigns with correct raised amounts

  2. Security
    - Function runs with proper permissions to update campaigns table
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_raised_amount_trigger ON donations;
DROP FUNCTION IF EXISTS update_campaign_raised_amount();

-- Create the trigger function to update campaign raised amounts
CREATE OR REPLACE FUNCTION update_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the campaign's raised_amount by summing all donations for that campaign
  UPDATE campaigns 
  SET raised_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM donations 
    WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_raised_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_raised_amount();

-- Update all existing campaigns with correct raised amounts
UPDATE campaigns 
SET raised_amount = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM donations 
  WHERE donations.campaign_id = campaigns.id
),
updated_at = now();