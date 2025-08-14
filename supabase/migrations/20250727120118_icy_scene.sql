/*
  # Fix raised amounts calculation

  Update the raised amount calculation function to ensure proper currency handling
*/

-- Update the function to properly calculate raised amounts
CREATE OR REPLACE FUNCTION update_campaign_raised_amount(campaign_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET raised_amount = COALESCE((
    SELECT SUM(amount) 
    FROM donations 
    WHERE donations.campaign_id = update_campaign_raised_amount.campaign_id
  ), 0)
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Update all existing campaigns to have correct raised amounts
UPDATE campaigns 
SET raised_amount = COALESCE((
  SELECT SUM(donations.amount) 
  FROM donations 
  WHERE donations.campaign_id = campaigns.id
), 0);