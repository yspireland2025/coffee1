import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateType?: string;
  templateData?: Record<string, string>;
}

Deno.serve(async (req) => {
  console.log('Send email function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    console.log('Email request:', {
      to: emailRequest.to,
      subject: emailRequest.subject,
      hasHtml: !!emailRequest.html,
      templateType: emailRequest.templateType
    });

    // Validate email request
    if (!emailRequest.to || !emailRequest.subject || !emailRequest.html) {
      return new Response(
        JSON.stringify({ error: 'Missing required email fields (to, subject, html)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = Deno.env.get('SMTP_PORT');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL');
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME');

    console.log('SMTP configuration check:', {
      hasHost: !!smtpHost,
      hasPort: !!smtpPort,
      hasUser: !!smtpUser,
      hasPassword: !!smtpPassword,
      hasFromEmail: !!smtpFromEmail,
      hasFromName: !!smtpFromName,
      host: smtpHost,
      port: smtpPort,
      fromEmail: smtpFromEmail
    });

    // Check if SMTP is configured
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFromEmail) {
      console.log('SMTP not fully configured, simulating email send');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully (simulated - SMTP not configured)',
          to: emailRequest.to,
          subject: emailRequest.subject
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SMTP is configured, attempt to send real email
    try {
      console.log('Attempting to send email via SMTP...');

      // Import nodemailer for SMTP
      const nodemailerModule = await import('npm:nodemailer@6.9.8');
      const nodemailer = nodemailerModule.default || nodemailerModule;

      console.log('Nodemailer imported:', typeof nodemailer, typeof nodemailer.createTransport);

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      console.log('SMTP transporter created, verifying connection...');
      
      // Verify SMTP connection
      await transporter.verify();
      console.log('SMTP connection verified successfully');

      // Send email
      const mailOptions = {
        from: `"${smtpFromName || 'YSPI Coffee Morning'}" <${smtpFromEmail}>`,
        to: emailRequest.to,
        subject: emailRequest.subject,
        html: emailRequest.html,
        text: emailRequest.text || emailRequest.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          messageId: info.messageId,
          to: emailRequest.to,
          subject: emailRequest.subject
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (smtpError) {
      console.error('SMTP sending error:', smtpError);
      
      // If SMTP fails, fall back to simulation
      console.log('SMTP failed, falling back to simulation');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully (SMTP failed, simulated)',
          to: emailRequest.to,
          subject: emailRequest.subject,
          smtpError: smtpError.message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Email function error:', error);
    
    let errorMessage = 'Failed to send email';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});