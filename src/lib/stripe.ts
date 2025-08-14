import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe configuration:', {
  hasPublishableKey: !!stripePublishableKey,
  keyPrefix: stripePublishableKey ? stripePublishableKey.substring(0, 12) + '...' : 'missing',
  keyType: stripePublishableKey?.startsWith('pk_live_') ? 'live' : 
           stripePublishableKey?.startsWith('pk_test_') ? 'test' : 'unknown'
});

if (!stripePublishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
  throw new Error('Stripe publishable key is required');
}

export const stripePromise = loadStripe(stripePublishableKey);

export const createPaymentIntent = async (amount: number, campaignId: string, donorEmail?: string) => {
  try {
    console.log('Creating payment intent for amount:', amount, 'campaignId:', campaignId, 'donorEmail:', donorEmail);
    
    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }
    
    // Check if Supabase URL is available
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrl: supabaseUrl
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please check environment variables.');
    }
    
    // Call your Supabase edge function to create payment intent
    const url = `${supabaseUrl}/functions/v1/create-payment-intent`;
    console.log('Calling edge function at:', url);
    
    const requestBody = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      campaignId,
      donorEmail: donorEmail || null
    };
    
    console.log('Request body:', requestBody);
    console.log('Calling edge function at URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Edge function response status:', response.status);
    console.log('Edge function response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error response:', errorText);
      
      // Try to parse error as JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(`Payment service error (${response.status}): ${errorData.error || errorText || 'Unknown error'}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error('Invalid response from payment service');
    }
    
    console.log('Payment intent created:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Payment intent creation failed - no success flag');
    }
    
    if (!data.clientSecret) {
      throw new Error('No client secret received from payment service. Response: ' + JSON.stringify(data));
    }
    
    console.log('Payment intent creation successful:', {
      hasClientSecret: !!data.clientSecret,
      hasPaymentIntentId: !!data.paymentIntentId,
      clientSecretPrefix: data.clientSecret?.substring(0, 20) + '...'
    });
    
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};