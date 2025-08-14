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
    const { packOrderId, campaignTitle, organizerName, organizerEmail } = requestBody;

    console.log('Creating pack payment link for:', { packOrderId, campaignTitle, organizerName });

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
              name: 'Coffee Morning Starter Pack - Postage',
              description: `Postage for Coffee Morning Starter Pack - ${campaignTitle}`,
              images: ['https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400'],
            },
            unit_amount: 1000, // €10 in cents
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabaseClient
        .from('pack_orders')
        .update({ stripe_payment_link_id: paymentLink.id })
        .eq('id', packOrderId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink: paymentLink.url,
        paymentLinkId: paymentLink.id
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