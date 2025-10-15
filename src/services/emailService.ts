import { supabase } from '../lib/supabase';

interface EmailTemplateFromDB {
  id: string;
  type: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
}

export interface EmailTemplate {
  donation_receipt: {
    donor_name: string;
    donation_amount: string;
    campaign_title: string;
    organizer_name: string;
    donation_date: string;
    donation_id: string;
    campaign_url: string;
  };
  campaign_approved: {
    organizer_name: string;
    campaign_title: string;
    goal_amount: string;
    event_date: string;
    event_location: string;
    campaign_url: string;
    share_url: string;
  };
  campaign_rejected: {
    organizer_name: string;
    campaign_title: string;
    rejection_reason: string;
  };
  welcome: {
    user_name: string;
    platform_url: string;
  };
  password_reset: {
    user_name: string;
    reset_url: string;
    expires_at: string;
  };
  message_to_host: {
    host_name: string;
    campaign_title: string;
    sender_name: string;
    sender_email: string;
    sender_mobile: string;
    message: string;
  };
  message_confirmation: {
    sender_name: string;
    campaign_title: string;
    message: string;
  };
  contact_form: {
    sender_name: string;
    sender_email: string;
    sender_mobile: string;
    message: string;
    submitted_at: string;
  };
  contact_confirmation: {
    sender_name: string;
    message: string;
    submitted_at: string;
  };
}

class EmailService {
  private templateCache: Record<string, { subject: string; html: string }> = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private fallbackTemplates: Record<string, { subject: string; html: string }> = {
    donation_receipt: {
      subject: 'Thank you for your donation to {{campaign_title}}',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>`
    },
    campaign_approved: {
      subject: 'Your Coffee Morning campaign has been approved!',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>`
    },
    pack_payment_pending: {
      subject: 'Complete your Coffee Morning Pack order - {{campaign_title}}',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>`
    },
    welcome: {
      subject: 'Welcome to the Coffee Morning Challenge!',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Join the Coffee Morning Challenge</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{user_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Welcome to the Youth Suicide Prevention Ireland Coffee Morning Challenge! 
      We're thrilled to have you join our community of changemakers.
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Every coffee morning creates connections that save lives. Whether you're hosting 
      your own event or supporting others, you're making a real difference in the fight 
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
</div>`
    },
    message_to_host: {
      subject: 'New message about your Coffee Morning campaign: {{campaign_title}}',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">New Message</h1>
    <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">Someone wants to connect with you</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{host_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      You've received a new message about your Coffee Morning campaign 
      <strong>"{{campaign_title}}"</strong>.
    </p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #3b82f6; margin: 0 0 10px 0;">Contact Details</h3>
      <p style="margin: 5px 0; color: #374151;"><strong>Name:</strong> {{sender_name}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> {{sender_email}}</p>
      {{#if sender_mobile}}<p style="margin: 5px 0; color: #374151;"><strong>Mobile:</strong> {{sender_mobile}}</p>{{/if}}
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
</div>`
    },
    message_confirmation: {
      subject: 'Message sent confirmation - {{campaign_title}}',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
      If you'd like to support this campaign, you can also make a donation through our platform.
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>`
    },
    contact_form: {
      subject: 'New contact form submission from {{sender_name}}',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>`
    },
    contact_confirmation: {
      subject: 'Thank you for contacting YSPI - We\'ll be in touch soon',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Message Received</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Thank you for reaching out</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{sender_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Thank you for contacting Youth Suicide Prevention Ireland about our Coffee Morning Challenge. 
      We've received your message and will respond within 24 hours during business days.
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
</div>`
    }
  };

  private async loadTemplatesFromDatabase(): Promise<Record<string, { subject: string; html: string }>> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('type, subject, html_content, is_active')
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        console.warn('No templates found in database, using fallback templates');
        return this.fallbackTemplates;
      }

      const templates: Record<string, { subject: string; html: string }> = {};
      data.forEach((template: any) => {
        templates[template.type] = {
          subject: template.subject,
          html: template.html_content
        };
      });

      return templates;
    } catch (error) {
      console.error('Failed to load templates from database:', error);
      return this.fallbackTemplates;
    }
  }

  private async getTemplates(): Promise<Record<string, { subject: string; html: string }>> {
    const now = Date.now();

    if (Object.keys(this.templateCache).length === 0 || now > this.cacheExpiry) {
      this.templateCache = await this.loadTemplatesFromDatabase();
      this.cacheExpiry = now + this.CACHE_DURATION;
    }

    return this.templateCache;
  }

  private replaceTemplateVariables(template: string, data: Record<string, string>): string {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    
    // Handle conditional blocks like {{#if sender_mobile}}
    result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, field, content) => {
      return data[field] && data[field].trim() ? content : '';
    });
    
    return result;
  }

  async sendEmail(
    to: string,
    templateType: keyof EmailTemplate,
    templateData: EmailTemplate[typeof templateType]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = await this.getTemplates();
      const template = templates[templateType];

      if (!template) {
        throw new Error(`Template ${templateType} not found`);
      }

      const subject = this.replaceTemplateVariables(template.subject, templateData as Record<string, string>);
      const html = this.replaceTemplateVariables(template.html, templateData as Record<string, string>);

      console.log('Sending email:', { to, templateType, subject });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          templateType,
          templateData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);

      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async sendDonationReceipt(donationData: {
    donorEmail: string;
    donorName: string;
    amount: number;
    campaignTitle: string;
    organizerName: string;
    donationId: string;
    campaignId: string;
    campaignNumber: number;
  }): Promise<{ success: boolean; error?: string }> {
    const campaignUrl = `${window.location.origin}/campaign/${donationData.campaignNumber}`;

    return this.sendEmail(donationData.donorEmail, 'donation_receipt', {
      donor_name: donationData.donorName,
      donation_amount: donationData.amount.toFixed(2),
      campaign_title: donationData.campaignTitle,
      organizer_name: donationData.organizerName,
      donation_date: new Date().toLocaleDateString(),
      donation_id: donationData.donationId,
      campaign_url: campaignUrl
    });
  }

  async sendCampaignApproval(campaignData: {
    organizerEmail: string;
    organizerName: string;
    campaignTitle: string;
    goalAmount: number;
    eventDate: string;
    eventLocation: string;
    campaignId: string;
    campaignNumber: number;
  }): Promise<{ success: boolean; error?: string }> {
    const campaignUrl = `${window.location.origin}/campaign/${campaignData.campaignNumber}`;

    return this.sendEmail(campaignData.organizerEmail, 'campaign_approved', {
      organizer_name: campaignData.organizerName,
      campaign_title: campaignData.campaignTitle,
      goal_amount: campaignData.goalAmount.toLocaleString(),
      event_date: new Date(campaignData.eventDate).toLocaleDateString(),
      event_location: campaignData.eventLocation,
      campaign_url: campaignUrl,
      share_url: campaignUrl
    });
  }

  async sendPackPaymentPending(packData: {
    organizerEmail: string;
    organizerName: string;
    campaignTitle: string;
    paymentLink: string;
    packOrderId: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail(packData.organizerEmail, 'pack_payment_pending', {
      organizer_name: packData.organizerName,
      campaign_title: packData.campaignTitle,
      payment_link: packData.paymentLink,
      pack_order_id: packData.packOrderId
    });
  }

  async sendWelcomeEmail(userData: {
    email: string;
    name: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail(userData.email, 'welcome', {
      user_name: userData.name,
      platform_url: window.location.origin
    });
  }

  async sendMessageToHost(messageData: {
    hostEmail: string;
    hostName: string;
    campaignTitle: string;
    senderName: string;
    senderEmail: string;
    senderMobile: string;
    message: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail(messageData.hostEmail, 'message_to_host', {
      host_name: messageData.hostName,
      campaign_title: messageData.campaignTitle,
      sender_name: messageData.senderName,
      sender_email: messageData.senderEmail,
      sender_mobile: messageData.senderMobile || '',
      message: messageData.message
    });
  }

  async sendMessageConfirmation(confirmationData: {
    senderEmail: string;
    senderName: string;
    campaignTitle: string;
    message: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail(confirmationData.senderEmail, 'message_confirmation', {
      sender_name: confirmationData.senderName,
      campaign_title: confirmationData.campaignTitle,
      message: confirmationData.message
    });
  }

  async sendContactForm(contactData: {
    senderName: string;
    senderEmail: string;
    senderMobile: string;
    message: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail('admin@yspi.ie', 'contact_form', {
      sender_name: contactData.senderName,
      sender_email: contactData.senderEmail,
      sender_mobile: contactData.senderMobile || 'Not provided',
      message: contactData.message,
      submitted_at: new Date().toLocaleString()
    });
  }

  async sendContactConfirmation(confirmationData: {
    senderEmail: string;
    senderName: string;
    message: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail(confirmationData.senderEmail, 'contact_confirmation', {
      sender_name: confirmationData.senderName,
      message: confirmationData.message,
      submitted_at: new Date().toLocaleString()
    });
  }
}

export const emailService = new EmailService();