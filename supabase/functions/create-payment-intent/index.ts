import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('Payment intent function called with method:', req.method);
  console.log('Request URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing payment intent request...');
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body received:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { amount, currency = 'eur', campaignId, donorEmail } = requestBody;

    console.log('Creating payment intent with params:', { 
      amount, 
      currency, 
      campaignId, 
      donorEmail,
      amountType: typeof amount,
      amountValue: amount 
    });

    // Validate required environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    console.log('Environment variables check:', {
      hasStripeKey: !!stripeSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      stripeKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 7) + '...' : 'missing',
      stripeKeyType: stripeSecretKey?.startsWith('sk_live_') ? 'live' : 
                     stripeSecretKey?.startsWith('sk_test_') ? 'test' : 'unknown'
    });
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error - missing Stripe key' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Validate inputs
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount:', amount, typeof amount);
      return new Response(
        JSON.stringify({ error: `Invalid amount: ${amount}. Must be a positive number.` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!campaignId) {
      console.error('Missing campaignId');
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Stripe with error handling
    let stripe;
    try {
      console.log('Initializing Stripe...');
      const Stripe = (await import('npm:stripe@17.0.0')).default;
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-11-20.acacia',
      });
      console.log('Stripe initialized successfully');
    } catch (stripeError) {
      console.error('Failed to initialize Stripe:', stripeError);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize payment service' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Create payment intent with comprehensive error handling
    let paymentIntent;
    try {
      console.log('Creating Stripe payment intent...');
      
      const paymentIntentParams = {
        amount: amount, // Amount should already be in cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          campaignId: campaignId.toString(),
          donorEmail: donorEmail || 'anonymous',
          source: 'coffee-morning-platform'
        },
        description: `Coffee Morning Campaign Donation - Campaign ${campaignId}`,
      };

      // Add receipt email if provided
      if (donorEmail && donorEmail.includes('@')) {
        paymentIntentParams.receipt_email = donorEmail;
      }

      console.log('Payment intent parameters:', paymentIntentParams);

      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
      
      console.log('Payment intent created successfully:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        client_secret_exists: !!paymentIntent.client_secret
      });

    } catch (stripeApiError) {
      console.error('Stripe API error:', stripeApiError);
      console.error('Stripe error details:', {
        type: stripeApiError.type,
        code: stripeApiError.code,
        message: stripeApiError.message,
        param: stripeApiError.param
      });
      
      let errorMessage = 'Payment service error';
      if (stripeApiError.message) {
        errorMessage = `Stripe error: ${stripeApiError.message}`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: stripeApiError.code || 'unknown_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Validate payment intent was created properly
    if (!paymentIntent || !paymentIntent.id) {
      console.error('Payment intent created but missing ID');
      return new Response(
        JSON.stringify({ error: 'Payment intent creation failed - no ID returned' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    if (!paymentIntent.client_secret) {
      console.error('Payment intent created but missing client secret');
      return new Response(
        JSON.stringify({ error: 'Payment intent creation failed - no client secret' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('Returning successful response:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      hasClientSecret: !!paymentIntent.client_secret
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Unexpected error in payment intent function:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Unexpected payment processing error';
    if (error instanceof Error) {
      errorMessage = `Server error: ${error.message}`;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
});