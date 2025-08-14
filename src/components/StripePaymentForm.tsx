import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { createPaymentIntent } from '../lib/stripe';

interface StripePaymentFormProps {
  amount: number;
  campaignId: string;
  donorEmail?: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
    },
    invalid: {
      color: '#EF4444',
    },
  },
};

export default function StripePaymentForm({
  amount,
  campaignId,
  donorEmail,
  onSuccess,
  onError,
  loading,
  setLoading,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Payment form submitted:', {
      amount,
      campaignId,
      donorEmail,
      stripeLoaded: !!stripe,
      elementsLoaded: !!elements
    });

    if (!stripe || !elements) {
      console.error('Stripe not loaded');
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      console.error('Card element not found');
      onError('Card information is incomplete.');
      return;
    }

    setLoading(true);
    console.log('Processing payment...');

    try {
      // Validate card elements are complete
      const cardExpiryElement = elements.getElement(CardExpiryElement);
      const cardCvcElement = elements.getElement(CardCvcElement);
      
      if (!cardExpiryElement || !cardCvcElement) {
        throw new Error('Card form elements not found');
      }

      console.log('Creating payment intent...');
      let paymentIntentData;
      try {
        paymentIntentData = await createPaymentIntent(amount, campaignId, donorEmail);
      } catch (paymentIntentError) {
        console.error('Payment intent creation failed:', paymentIntentError);
        throw new Error(`Failed to create payment intent: ${paymentIntentError.message}`);
      }
      
      console.log('Payment intent created:', paymentIntentData);
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        throw new Error('Failed to create payment intent - no client secret received');
      }
      
      console.log('Confirming payment with client secret:', paymentIntentData.clientSecret.substring(0, 20) + '...');
      
      console.log('Confirming payment...');
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              email: donorEmail,
            },
          }
        }
      );
      
      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        console.error('Confirm error details:', {
          code: confirmError.code,
          type: confirmError.type,
          message: confirmError.message,
          payment_intent: confirmError.payment_intent
        });
        
        // Handle specific Stripe errors
        let errorMessage = confirmError.message || 'Payment failed';
        if (confirmError.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please try a different payment method.';
        } else if (confirmError.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please use a different card.';
        } else if (confirmError.code === 'incorrect_cvc') {
          errorMessage = 'Your card\'s security code is incorrect.';
        } else if (confirmError.code === 'processing_error') {
          errorMessage = 'An error occurred while processing your card. Please try again.';
        }
        
        onError(errorMessage);
        return;
      }
      
      if (paymentIntent?.status === 'succeeded') {
        console.log('Payment successful:', paymentIntent);
        onSuccess(paymentIntent);
      } else {
        console.error('Payment not successful:', paymentIntent?.status);
        onError(`Payment was not successful. Status: ${paymentIntent?.status || 'unknown'}`);
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      console.error('Payment error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      onError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (elementType: string) => (event: any) => {
    if (event.error) {
      setCardErrors(prev => ({
        ...prev,
        [elementType]: event.error.message,
      }));
    } else {
      setCardErrors(prev => ({
        ...prev,
        [elementType]: undefined,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900">Secure Payment</h4>
            <p className="text-sm text-blue-800">
              Your payment information is encrypted and secure. Powered by Stripe.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <div className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
              <CardNumberElement
                options={cardElementOptions}
                onChange={handleCardChange('cardNumber')}
              />
            </div>
          </div>
          {cardErrors.cardNumber && (
            <div className="flex items-center space-x-1 mt-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600">{cardErrors.cardNumber}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <div className="p-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
              <CardExpiryElement
                options={cardElementOptions}
                onChange={handleCardChange('cardExpiry')}
              />
            </div>
            {cardErrors.cardExpiry && (
              <div className="flex items-center space-x-1 mt-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600">{cardErrors.cardExpiry}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC
            </label>
            <div className="p-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
              <CardCvcElement
                options={cardElementOptions}
                onChange={handleCardChange('cardCvc')}
              />
            </div>
            {cardErrors.cardCvc && (
              <div className="flex items-center space-x-1 mt-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600">{cardErrors.cardCvc}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">Total Amount</span>
          </div>
          <span className="text-2xl font-bold text-green-900">€{amount.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#a8846d] text-white px-6 py-4 rounded-xl hover:bg-[#96785f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center space-x-2"
      >
        <Lock className="h-5 w-5" />
        <span>
          {loading ? 'Processing Payment...' : `Donate €${amount.toFixed(2)}`}
        </span>
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-600">
          Your donation will appear as "YSPI Coffee Morning" on your statement.
          <br />
          By completing this donation, you agree to our terms of service.
        </p>
      </div>
    </form>
  );
}
