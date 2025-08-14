/*
  # Add Sample Campaign Data

  1. Sample Data
    - Adds 3 sample coffee morning campaigns
    - Includes approved and pending campaigns for testing
    - Uses realistic Irish locations and data

  2. Data includes
    - Campaign details (title, organizer, story, goals)
    - Event information (date, time, location)
    - Social media links
    - Approval status for testing admin functionality
*/

-- Insert sample campaigns
INSERT INTO campaigns (
  title,
  organizer,
  email,
  county,
  eircode,
  story,
  goal_amount,
  raised_amount,
  event_date,
  event_time,
  location,
  image,
  social_links,
  is_active,
  is_approved,
  created_at,
  updated_at
) VALUES 
(
  'Sarah''s Coffee Morning for Hope',
  'Sarah O''Brien',
  'sarah.obrien@email.ie',
  'Cork',
  'T12 XY34',
  'After losing my brother to suicide two years ago, I''ve made it my mission to raise awareness and funds for youth mental health. Join me for a cozy coffee morning where we''ll share stories, support each other, and raise vital funds for YSPI.',
  2000,
  1450,
  '2025-03-15',
  '10:00',
  'Community Centre, Cork',
  'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
  '{"facebook": "https://facebook.com/sarahscoffeemorning", "instagram": "https://instagram.com/sarahscoffeemorning"}',
  true,
  true,
  '2025-01-15T10:00:00Z',
  '2025-01-15T10:00:00Z'
),
(
  'Dublin Tech Coffee Connect',
  'Michael Chen',
  'michael.chen@techie.ie',
  'Dublin',
  'D02 XY45',
  'As someone in the tech industry, I''ve seen firsthand how mental health struggles affect young professionals. Let''s come together over great coffee and meaningful conversations to support youth suicide prevention.',
  3000,
  2100,
  '2025-03-22',
  '09:30',
  'Tech Hub Dublin, Dublin 2',
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
  '{"twitter": "https://twitter.com/techchoffee"}',
  true,
  false,
  '2025-01-18T14:30:00Z',
  '2025-01-18T14:30:00Z'
),
(
  'Galway Community Caffeine Crusade',
  'Emma Walsh',
  'emma.walsh@gmail.com',
  'Galway',
  'H91 AB12',
  'Growing up in Galway, I''ve witnessed the impact of mental health challenges on our youth. This coffee morning is about creating a safe space for conversation and raising funds for a cause close to my heart.',
  1500,
  890,
  '2025-03-29',
  '11:00',
  'Galway Bay Hotel, Galway',
  'https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=800',
  '{"facebook": "https://facebook.com/galwaycoffeemorning"}',
  true,
  true,
  '2025-01-20T16:45:00Z',
  '2025-01-20T16:45:00Z'
),
(
  'Limerick Latte for Life',
  'James Murphy',
  'james.murphy@outlook.ie',
  'Limerick',
  'V94 T1K2',
  'Mental health awareness saved my life when I was struggling as a teenager. Now I want to give back to ensure other young people get the support they need. Join us for coffee, cake, and conversation.',
  2500,
  0,
  '2025-04-05',
  '14:00',
  'Limerick City Library, Limerick',
  'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
  '{"instagram": "https://instagram.com/limericklatteforlife", "whatsapp": "https://wa.me/353871234567"}',
  true,
  false,
  '2025-01-22T09:15:00Z',
  '2025-01-22T09:15:00Z'
),
(
  'Waterford Warriors Coffee Morning',
  'Aoife Kelly',
  'aoife.kelly@yahoo.ie',
  'Waterford',
  'X91 PQ78',
  'As a teacher, I see the daily struggles our young people face. This coffee morning is my way of bringing our community together to support mental health initiatives and show our youth they are not alone.',
  1800,
  1200,
  '2025-04-12',
  '10:30',
  'Waterford Crystal Visitor Centre, Waterford',
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
  '{"facebook": "https://facebook.com/waterfordwarriors"}',
  true,
  true,
  '2025-01-25T11:20:00Z',
  '2025-01-25T11:20:00Z'
);