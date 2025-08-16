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

    // For now, simulate successful email sending since SMTP is not configured
    console.log('Simulating email send (SMTP not configured):', {
      to: emailRequest.to,
      subject: emailRequest.subject,
      templateType: emailRequest.templateType
    });

    // In a real deployment, you would configure SMTP settings here
    // For demo purposes, we'll just log the email and return success
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully (simulated)',
        to: emailRequest.to,
        subject: emailRequest.subject,
        note: 'SMTP not configured - email was simulated'
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