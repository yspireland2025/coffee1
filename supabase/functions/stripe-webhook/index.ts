import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    console.log('Webhook received, signature present:', !!signature);

    // Import Stripe
    const Stripe = (await import('npm:stripe@12.0.0')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
    });

    let event;

    // Verify webhook signature if secret is configured
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
        console.log('Webhook signature verified');
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Parse without verification (for testing)
      console.log('Processing webhook without signature verification');
      event = JSON.parse(body);
    }

    console.log('Processing event:', event.type);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Checkout session completed:', event.data.object.id);
        await handleCheckoutCompleted(supabase, event.data.object);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded:', event.data.object.id);
        await handlePaymentSucceeded(supabase, event.data.object);
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment intent failed:', event.data.object.id);
        await handlePaymentFailed(supabase, event.data.object);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Webhook processing failed',
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckoutCompleted(supabase: any, session: any) {
  console.log('Processing checkout completion...');
  console.log('Session metadata:', session.metadata);

  const packOrderId = session.metadata?.pack_order_id;
  
  if (!packOrderId) {
    console.log('No pack_order_id in metadata, checking payment_intent');
    
    // Try to get from payment intent
    if (session.payment_intent) {
      const { data: packOrder } = await supabase
        .from('pack_orders')
        .select('id')
        .eq('stripe_payment_intent_id', session.payment_intent)
        .single();
      
      if (packOrder) {
        await updatePackOrderStatus(supabase, packOrder.id);
      }
    }
    return;
  }

  await updatePackOrderStatus(supabase, packOrderId);
}

async function handlePaymentSucceeded(supabase: any, paymentIntent: any) {
  console.log('Processing payment success...');
  console.log('Payment intent metadata:', paymentIntent.metadata);

  const packOrderId = paymentIntent.metadata?.pack_order_id;
  
  if (!packOrderId) {
    console.log('No pack_order_id in payment intent metadata');
    return;
  }

  await updatePackOrderStatus(supabase, packOrderId);
}

async function handlePaymentFailed(supabase: any, paymentIntent: any) {
  console.log('Processing payment failure...');

  const packOrderId = paymentIntent.metadata?.pack_order_id;
  
  if (!packOrderId) {
    console.log('No pack_order_id in payment intent metadata');
    return;
  }

  // Update pack order to failed
  const { error: orderError } = await supabase
    .from('pack_orders')
    .update({ 
      payment_status: 'failed'
    })
    .eq('id', packOrderId);

  if (orderError) {
    console.error('Error updating pack order to failed:', orderError);
  } else {
    console.log('Pack order marked as failed:', packOrderId);
  }
}

async function updatePackOrderStatus(supabase: any, packOrderId: string) {
  console.log('Updating pack order status for:', packOrderId);

  // Update pack order
  const { error: orderError } = await supabase
    .from('pack_orders')
    .update({ 
      payment_status: 'completed',
      paid_at: new Date().toISOString()
    })
    .eq('id', packOrderId);

  if (orderError) {
    console.error('Error updating pack order:', orderError);
    throw orderError;
  }

  console.log('Pack order updated successfully');

  // Update campaign pack_payment_status
  const { error: campaignError } = await supabase
    .from('campaigns')
    .update({ pack_payment_status: 'completed' })
    .eq('pack_order_id', packOrderId);

  if (campaignError) {
    console.error('Error updating campaign:', campaignError);
    throw campaignError;
  }

  console.log('Campaign pack payment status updated successfully');
}