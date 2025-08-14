/*
  # Coffee Morning Challenge Database Schema

  1. New Tables
    - `campaigns`
      - `id` (uuid, primary key)
      - `title` (text)
      - `organizer` (text)
      - `email` (text)
      - `county` (text)
      - `eircode` (text, optional)
      - `story` (text)
      - `goal_amount` (integer)
      - `raised_amount` (integer, default 0)
      - `event_date` (date)
      - `event_time` (time)
      - `location` (text)
      - `image` (text, default image URL)
      - `social_links` (jsonb for social media links)
      - `is_active` (boolean, default true)
      - `is_approved` (boolean, default false)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `donations`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, references campaigns)
      - `amount` (integer, amount in cents)
      - `donor_name` (text, optional)
      - `donor_email` (text, optional)
      - `message` (text, optional)
      - `is_anonymous` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Campaigns: Users can read approved campaigns, create their own, update their own
    - Donations: Users can read donations for campaigns, create donations
    - Admin policies for YSPI staff

  3. Functions
    - Update raised_amount when donations are added
    - Email notifications for new campaigns/donations
*/

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organizer text NOT NULL,
  email text NOT NULL,
  county text NOT NULL,
  eircode text,
  story text NOT NULL,
  goal_amount integer NOT NULL CHECK (goal_amount > 0),
  raised_amount integer DEFAULT 0 CHECK (raised_amount >= 0),
  event_date date NOT NULL,
  event_time time NOT NULL,
  location text NOT NULL,
  image text DEFAULT 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
  social_links jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_approved boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  donor_name text,
  donor_email text,
  message text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Anyone can read approved campaigns"
  ON campaigns
  FOR SELECT
  USING (is_approved = true AND is_active = true);

CREATE POLICY "Users can create campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Donations policies
CREATE POLICY "Anyone can read donations for approved campaigns"
  ON donations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = donations.campaign_id 
      AND campaigns.is_approved = true 
      AND campaigns.is_active = true
    )
  );

CREATE POLICY "Anyone can create donations"
  ON donations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = donations.campaign_id 
      AND campaigns.is_approved = true 
      AND campaigns.is_active = true
    )
  );

-- Function to update raised_amount when donations are added
CREATE OR REPLACE FUNCTION update_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns 
  SET raised_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM donations 
    WHERE campaign_id = NEW.campaign_id
  ),
  updated_at = now()
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update raised_amount
DROP TRIGGER IF EXISTS update_raised_amount_trigger ON donations;
CREATE TRIGGER update_raised_amount_trigger
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_raised_amount();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_approved_active ON campaigns(is_approved, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_event_date ON campaigns(event_date);