import { createClient } from 'npm:@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: RequestBody = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const user = userData.users.find((u) => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate secure random token
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        email,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error('Error creating reset token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to create reset token' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send email with reset link
    const resetUrl = `${req.headers.get('origin') || 'https://coffeemorning.yspi.ie'}/#reset-password?token=${token}`;

    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Reset Your Password - Coffee Morning Challenge',
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Reset your account password</p>
  </div>

  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello,</p>

    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      We received a request to reset your password for your Coffee Morning Challenge account.
      Click the button below to create a new password.
    </p>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Important:</strong> This link will expire in 1 hour for security reasons.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
      If you didn't request this password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>

    <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="color: #059669; word-break: break-all;">${resetUrl}</span>
    </p>
  </div>

  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>
        `,
        templateType: 'password_reset_custom',
        templateData: {}
      })
    });

    if (!emailResponse.ok) {
      console.error('Failed to send reset email');
      return new Response(
        JSON.stringify({ error: 'Failed to send reset email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
