/*
  # Fix donation amount conversion issues

  1. Problem Analysis
    - Donations are being stored in cents (25 EUR = 2500 cents)
    - But the trigger function is summing cents and storing as euros
    - This causes double conversion issues

  2. Solution
    - Update the trigger function to properly convert cents to euros
    - Fix any existing incorrect raised amounts
*/

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS update_raised_amount_trigger ON donations;
DROP FUNCTION IF EXISTS update_campaign_raised_amount();

-- Create the corrected function that properly converts cents to euros
CREATE OR REPLACE FUNCTION update_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the campaign's raised_amount by summing all donations and converting from cents to euros
  UPDATE campaigns 
  SET raised_amount = (
    SELECT COALESCE(SUM(amount), 0) / 100.0  -- Convert cents to euros
    FROM donations 
    WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
  )
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_raised_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_raised_amount();

-- Fix existing campaign raised amounts by recalculating from donations
UPDATE campaigns 
SET raised_amount = (
  SELECT COALESCE(SUM(donations.amount), 0) / 100.0  -- Convert cents to euros
  FROM donations 
  WHERE donations.campaign_id = campaigns.id
);