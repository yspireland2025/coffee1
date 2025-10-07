import { loadStripe } from '@stripe/stripe-js';

// Hardcoded Stripe publishable key
const stripePublishableKey = 'pk_live_wmKHTbS7JPKnJVd72FNPHw7z';

const isValidStripeKey = stripePublishableKey &&
  stripePublishableKey !== 'your_stripe_publishable_key_here' &&
  (stripePublishableKey.startsWith('pk_test_') || stripePublishableKey.startsWith('pk_live_'));

console.log('Stripe configuration:', {
  hasPublishableKey: !!stripePublishableKey,
  isValidKey: isValidStripeKey,
  keyPrefix: isValidStripeKey ? stripePublishableKey.substring(0, 12) + '...' : 'missing or invalid',
  keyType: stripePublishableKey?.startsWith('pk_live_') ? 'live' :
           stripePublishableKey?.startsWith('pk_test_') ? 'test' : 'not configured'
});

if (!isValidStripeKey) {
  console.warn('⚠️ Stripe publishable key is not properly configured. Payments will not work.');
}

export const stripePromise = isValidStripeKey ? loadStripe(stripePublishableKey).catch(err => {
  console.error('Failed to load Stripe:', err);
  return null;
}) : Promise.resolve(null);

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
    
    // Hardcoded Supabase configuration
    const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';
    
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