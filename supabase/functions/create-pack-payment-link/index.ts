import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PackPaymentRequest {
  packOrderId: string;
  campaignTitle: string;
  organizerName: string;
  organizerEmail: string;
  amount?: number;
  packType?: string;
  sendEmail?: boolean;
}

Deno.serve(async (req) => {
  console.log('Pack payment link function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const requestBody: PackPaymentRequest = await req.json();
    const { packOrderId, campaignTitle, organizerName, organizerEmail, amount, packType, sendEmail } = requestBody;

    console.log('Creating pack payment link for:', { packOrderId, campaignTitle, organizerName, amount, packType });

    // Initialize Supabase to get pack order details
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let packAmount = amount || 1000; // Default to €10
    let packTypeName = packType || 'Free Starter Pack';

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

      const { data: packOrder } = await supabaseClient
        .from('pack_orders')
        .select('amount, pack_type')
        .eq('id', packOrderId)
        .single();

      if (packOrder) {
        packAmount = packOrder.amount;
        packTypeName = packOrder.pack_type === 'free' ? 'Free Starter Pack' :
                      packOrder.pack_type === 'medium' ? 'Medium Pack' : 'Large Pack';
      }
    }

    // Initialize Stripe
    const Stripe = (await import('npm:stripe@12.0.0')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
    });

    // Create Stripe Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Coffee Morning ${packTypeName}`,
              description: `${packTypeName} for campaign: ${campaignTitle}`,
              images: ['https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400'],
            },
            unit_amount: packAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        pack_order_id: packOrderId,
        campaign_title: campaignTitle,
        organizer_name: organizerName,
        type: 'pack_postage'
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${Deno.env.get('SITE_URL') || 'https://coffee.yspi.ie'}?pack_payment=success&order_id=${packOrderId}`
        }
      },
      allow_promotion_codes: false,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['IE'] // Ireland only
      }
    });

    console.log('Payment link created:', paymentLink.id);

    // Update pack order with payment link ID
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

      await supabaseClient
        .from('pack_orders')
        .update({ stripe_payment_link_id: paymentLink.id })
        .eq('id', packOrderId);
    }

    // Send email if requested
    if (sendEmail && organizerEmail) {
      try {
        console.log('Sending payment link email to:', organizerEmail);

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #2d5016; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .details { background-color: white; padding: 15px; border-left: 4px solid #2d5016; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Complete Your Pack Payment</h1>
    </div>
    <div class="content">
      <p>Dear ${organizerName},</p>

      <p>Thank you for creating your Coffee Morning campaign! We're excited to help you raise funds for youth projects.</p>

      <div class="details">
        <strong>Campaign:</strong> ${campaignTitle}<br>
        <strong>Pack Type:</strong> ${packTypeName}<br>
        <strong>Amount Due:</strong> €${(packAmount / 100).toFixed(2)}
      </div>

      <p>To complete your campaign setup and receive your fundraising pack, please complete your payment using the secure link below:</p>

      <div style="text-align: center;">
        <a href="${paymentLink.url}" class="button">Complete Payment</a>
      </div>

      <p style="margin-top: 30px;">Once your payment is confirmed, your campaign will be reviewed and approved within 24 hours.</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Best regards,<br>
      The YSPI Coffee Morning Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email from YSPI Coffee Morning Platform</p>
    </div>
  </div>
</body>
</html>`;

        const emailText = `
Dear ${organizerName},

Thank you for creating your Coffee Morning campaign! We're excited to help you raise funds for youth projects.

Campaign: ${campaignTitle}
Pack Type: ${packTypeName}
Amount Due: €${(packAmount / 100).toFixed(2)}

To complete your campaign setup and receive your fundraising pack, please complete your payment using the secure link below:

${paymentLink.url}

Once your payment is confirmed, your campaign will be reviewed and approved within 24 hours.

If you have any questions, please don't hesitate to contact us.

Best regards,
The YSPI Coffee Morning Team
`;

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: organizerEmail,
            subject: `Complete Your Coffee Morning Pack Payment - ${campaignTitle}`,
            html: emailHtml,
            text: emailText
          })
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text());
        } else {
          console.log('Payment link email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending payment link email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink: paymentLink.url,
        paymentLinkId: paymentLink.id,
        emailSent: sendEmail || false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Pack payment link creation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to create payment link',
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});