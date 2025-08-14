/*
  # Create messages table for campaign host communication

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `sender_name` (text, required)
      - `sender_email` (text, required)
      - `sender_mobile` (text, optional)
      - `message` (text, required)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `messages` table
    - Add policy for campaign owners to read messages for their campaigns
    - Add policy for public to create messages
    - Add policy for admins to read all messages

  3. Indexes
    - Index on campaign_id for efficient queries
    - Index on created_at for sorting
    - Index on is_read for filtering unread messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  sender_mobile text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- RLS Policies

-- Campaign owners can read messages for their campaigns
CREATE POLICY "Campaign owners can read their messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = messages.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Anyone can create messages (public contact form)
CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = messages.campaign_id 
      AND campaigns.is_approved = true 
      AND campaigns.is_active = true
    )
  );

-- Campaign owners can update read status of their messages
CREATE POLICY "Campaign owners can update their messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = messages.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = messages.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Admins can read all messages
CREATE POLICY "Admins can read all messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR 
    (auth.jwt() ->> 'role' = 'super_admin') OR
    ((auth.jwt() -> 'app_metadata') ->> 'role' = 'admin') OR
    ((auth.jwt() -> 'app_metadata') ->> 'role' = 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR 
    (auth.jwt() ->> 'role' = 'super_admin') OR
    ((auth.jwt() -> 'app_metadata') ->> 'role' = 'admin') OR
    ((auth.jwt() -> 'app_metadata') ->> 'role' = 'super_admin')
  );