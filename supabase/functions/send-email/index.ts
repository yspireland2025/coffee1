import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL');
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME') || 'Youth Suicide Prevention Ireland';

    console.log('SMTP Configuration:', {
      hasHost: !!smtpHost,
      hasUser: !!smtpUser,
      hasPassword: !!smtpPassword,
      hasFromEmail: !!smtpFromEmail,
      port: smtpPort
    });

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      console.error('Missing SMTP configuration');
      return new Response(
        JSON.stringify({ error: 'SMTP configuration incomplete' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Import SMTP library
    const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: smtpPort === 465, // Use TLS for port 465, STARTTLS for others
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    console.log('Connecting to SMTP server...');

    // Send email
    await client.send({
      from: `${smtpFromName} <${smtpFromEmail}>`,
      to: emailRequest.to,
      subject: emailRequest.subject,
      content: emailRequest.text || 'Please view this email in HTML format.',
      html: emailRequest.html,
    });

    console.log('Email sent successfully to:', emailRequest.to);

    // Close SMTP connection
    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        to: emailRequest.to,
        subject: emailRequest.subject
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email sending error:', error);
    
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