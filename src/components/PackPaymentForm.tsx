import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle, Package, Shield } from 'lucide-react';
import { createPaymentIntent } from '../lib/stripe';

interface PackPaymentFormProps {
  packOrderId: string;
  amount: number;
  packType: 'free' | 'medium' | 'large';
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
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

export default function PackPaymentForm({
  packOrderId,
  amount,
  packType,
  onSuccess,
  onError,
}: PackPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Pack payment form submitted');

    if (!stripe || !elements) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      onError('Card information is incomplete.');
      return;
    }

    setLoading(true);

    try {
      console.log('Creating payment intent for pack order...');
      
      // Create payment intent for pack payment
      const paymentIntentData = await createPaymentIntent(
        amount, 
        `pack-${packOrderId}`, // Use pack order ID as campaign ID
        undefined // No donor email for pack payments
      );
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        throw new Error('Failed to create payment intent');
      }
      
      console.log('Confirming pack payment...');
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: 'Pack Order Payment',
            },
          }
        }
      );
      
      if (confirmError) {
        console.error('Pack payment confirmation error:', confirmError);
        
        let errorMessage = confirmError.message || 'Payment failed';
        if (confirmError.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please try a different payment method.';
        } else if (confirmError.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please use a different card.';
        } else if (confirmError.code === 'incorrect_cvc') {
          errorMessage = 'Your card\'s security code is incorrect.';
        }
        
        onError(errorMessage);
        return;
      }
      
      if (paymentIntent?.status === 'succeeded') {
        console.log('Pack payment successful:', paymentIntent);
        onSuccess(paymentIntent);
      } else {
        onError(`Payment was not successful. Status: ${paymentIntent?.status || 'unknown'}`);
      }
      
    } catch (err) {
      console.error('Pack payment error:', err);
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
          <Shield className="h-5 w-5 text-blue-600" />
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

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-900">
              {packType === 'free' ? 'Free Starter Pack' : 
               packType === 'medium' ? 'Medium Pack' : 'Large Pack'}
            </span>
          </div>
          <span className="text-2xl font-bold text-amber-900">€{amount.toFixed(2)}</span>
        </div>
        <p className="text-amber-800 text-sm mt-2">
          {packType === 'free' ? 'Postage fee for your free Coffee Morning Starter Pack' :
           `Pack cost + €10 postage for your ${packType} Coffee Morning Pack`}
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#a8846d] text-white px-6 py-4 rounded-xl hover:bg-[#96785f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center space-x-2"
      >
        <Lock className="h-5 w-5" />
        <span>
          {loading ? 'Processing Payment...' : `Pay €${amount.toFixed(2)} for ${packType === 'free' ? 'Postage' : 'Pack + Postage'}`}
        </span>
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-600">
          Your payment will appear as "YSPI Coffee Morning Pack" on your statement.
          <br />
          By completing this payment, you agree to our terms of service.
        </p>
      </div>
    </form>
  );
}