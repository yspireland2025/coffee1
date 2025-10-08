/*
  # Create Email Templates Table

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text) - Display name of the template
      - `type` (text) - Template type identifier (donation_receipt, campaign_approved, etc.)
      - `subject` (text) - Email subject line with variable placeholders
      - `html_content` (text) - HTML email content with variable placeholders
      - `variables` (jsonb) - Array of variable names available in this template
      - `is_active` (boolean) - Whether this template is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_templates` table
    - Admin users (role = 'admin') can read and update templates
    - Public users cannot access templates directly (emails sent via edge function)

  3. Data
    - Seed with default email templates for all types
*/

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Admin can read all templates (using role from users table)
CREATE POLICY "Admins can read email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin can update templates
CREATE POLICY "Admins can update email templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default templates
INSERT INTO email_templates (name, type, subject, html_content, variables) VALUES
(
  'Donation Receipt',
  'donation_receipt',
  'Thank you for your donation to {{campaign_title}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Thank You!</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your donation makes a real difference</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{donor_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Thank you for your generous donation of <strong>€{{donation_amount}}</strong> to support 
      <strong>{{campaign_title}}</strong> organized by {{organizer_name}}.
    </p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #059669; margin: 0 0 10px 0;">Donation Details</h3>
      <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> €{{donation_amount}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Date:</strong> {{donation_date}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Campaign:</strong> {{campaign_title}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Reference:</strong> {{donation_id}}</p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your support helps Youth Suicide Prevention Ireland continue our vital work in preventing 
      youth suicide through education, support, and community engagement.
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      This email serves as your donation receipt for tax purposes.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{campaign_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Campaign</a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      Registered Charity No. CHY 20866<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>',
  '["donor_name", "donation_amount", "campaign_title", "organizer_name", "donation_date", "donation_id", "campaign_url"]'::jsonb
),
(
  'Campaign Approved',
  'campaign_approved',
  'Your Coffee Morning campaign has been approved!',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations!</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your campaign is now live</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{organizer_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Great news! Your Coffee Morning campaign <strong>"{{campaign_title}}"</strong> has been approved 
      and is now live on our platform.
    </p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin: 0 0 10px 0;">Campaign Details</h3>
      <p style="margin: 5px 0; color: #374151;"><strong>Title:</strong> {{campaign_title}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Goal:</strong> €{{goal_amount}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Event Date:</strong> {{event_date}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Location:</strong> {{event_location}}</p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your campaign is now visible to supporters across Ireland. Start sharing your campaign 
      with friends, family, and your community to maximize your impact.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{campaign_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">View Your Campaign</a>
      <a href="{{share_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Share Campaign</a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>',
  '["organizer_name", "campaign_title", "goal_amount", "event_date", "event_location", "campaign_url", "share_url"]'::jsonb
),
(
  'Pack Payment Pending',
  'pack_payment_pending',
  'Complete your Coffee Morning Pack order - {{campaign_title}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Almost There!</h1>
    <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">Complete your pack order to activate your campaign</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{organizer_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Thank you for registering your Coffee Morning campaign <strong>"{{campaign_title}}"</strong>! 
      Your campaign has been created, but we need you to complete your Coffee Morning Starter Pack order.
    </p>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="color: #92400e; margin: 0 0 10px 0;">Your Free Starter Pack Includes:</h3>
      <ul style="color: #92400e; margin: 0; padding-left: 20px;">
        <li>Event planning guide and timeline</li>
        <li>Promotional materials and posters</li>
        <li>Information leaflets about YSPI</li>
        <li>Donation collection materials</li>
        <li>Social media templates</li>
      </ul>
    </div>
    
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">Postage Payment Required</h3>
      <p style="color: #0c4a6e; margin: 0;">
        The starter pack is completely free! We just ask for a <strong>€10 contribution towards postage costs</strong> 
        to get your pack delivered to your door.
      </p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      <strong>Important:</strong> Your campaign will not be approved for public viewing until the postage payment is completed. 
      Once paid, your campaign will enter our standard review process.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{payment_link}}" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Complete Pack Order - €10</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
      <strong>Order Reference:</strong> {{pack_order_id}}<br>
      If you have any questions about your pack order, please contact us at admin@yspi.ie
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #f59e0b;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>',
  '["organizer_name", "campaign_title", "payment_link", "pack_order_id"]'::jsonb
),
(
  'Welcome Email',
  'welcome',
  'Welcome to the Coffee Morning Challenge!',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Join the Coffee Morning Challenge</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{user_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Welcome to the Youth Suicide Prevention Ireland Coffee Morning Challenge! 
      We''re thrilled to have you join our community of changemakers.
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Every coffee morning creates connections that save lives. Whether you''re hosting 
      your own event or supporting others, you''re making a real difference in the fight 
      against youth suicide.
    </p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #059669; margin: 0 0 15px 0;">Get Started</h3>
      <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
        <li>Browse active coffee morning campaigns</li>
        <li>Support campaigns that resonate with you</li>
        <li>Create your own coffee morning event</li>
        <li>Share campaigns with your network</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{platform_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore Campaigns</a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>',
  '["user_name", "platform_url"]'::jsonb
),
(
  'Message to Host',
  'message_to_host',
  'New message about your Coffee Morning campaign: {{campaign_title}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">New Message</h1>
    <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">Someone wants to connect with you</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{host_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      You''ve received a new message about your Coffee Morning campaign 
      <strong>"{{campaign_title}}"</strong>.
    </p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #3b82f6; margin: 0 0 10px 0;">Contact Details</h3>
      <p style="margin: 5px 0; color: #374151;"><strong>Name:</strong> {{sender_name}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> {{sender_email}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Mobile:</strong> {{sender_mobile}}</p>
    </div>
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="color: #3b82f6; margin: 0 0 10px 0;">Message</h3>
      <p style="color: #374151; line-height: 1.6; font-style: italic;">"{{message}}"</p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      You can reply directly to this email to respond to {{sender_name}}.
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #3b82f6;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>',
  '["host_name", "campaign_title", "sender_name", "sender_email", "sender_mobile", "message"]'::jsonb
),
(
  'Message Confirmation',
  'message_confirmation',
  'Message sent confirmation - {{campaign_title}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Message Sent</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your message has been delivered</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{sender_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your message has been successfully sent to the organizer of 
      <strong>"{{campaign_title}}"</strong>.
    </p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin: 0 0 10px 0;">Your Message</h3>
      <p style="color: #374151; line-height: 1.6; font-style: italic;">"{{message}}"</p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      The campaign organizer will receive your contact details and can respond directly to you. 
      Thank you for your interest in supporting this Coffee Morning campaign!
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      If you''d like to support this campaign, you can also make a donation through our platform.
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>',
  '["sender_name", "campaign_title", "message"]'::jsonb
),
(
  'Contact Form',
  'contact_form',
  'New contact form submission from {{sender_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">New Contact Message</h1>
    <p style="color: #c7d2fe; margin: 10px 0 0 0; font-size: 16px;">Coffee Morning Platform</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <h3 style="color: #6366f1; margin: 0 0 20px 0;">Contact Details</h3>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #374151;"><strong>Name:</strong> {{sender_name}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> {{sender_email}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Mobile:</strong> {{sender_mobile}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Submitted:</strong> {{submitted_at}}</p>
    </div>
    
    <h3 style="color: #6366f1; margin: 20px 0 10px 0;">Message</h3>
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1;">
      <p style="color: #374151; line-height: 1.6; margin: 0; font-style: italic;">"{{message}}"</p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      You can reply directly to this email to respond to the sender.
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      Coffee Morning Platform Contact Form
    </p>
  </div>
</div>',
  '["sender_name", "sender_email", "sender_mobile", "message", "submitted_at"]'::jsonb
),
(
  'Contact Confirmation',
  'contact_confirmation',
  'Thank you for contacting YSPI - We''ll be in touch soon',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Message Received</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Thank you for reaching out</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{sender_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Thank you for contacting Youth Suicide Prevention Ireland about our Coffee Morning Challenge. 
      We''ve received your message and will respond within 24 hours during business days.
    </p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin: 0 0 10px 0;">Your Message</h3>
      <p style="color: #374151; line-height: 1.6; font-style: italic; margin: 0;">"{{message}}"</p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      In the meantime, feel free to browse our active coffee morning campaigns or start planning your own event.
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      <strong>Submitted:</strong> {{submitted_at}}
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>',
  '["sender_name", "message", "submitted_at"]'::jsonb
);

-- Create index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();