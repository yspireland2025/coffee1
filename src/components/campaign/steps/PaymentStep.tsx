import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Package } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../../lib/stripe';
import PackPaymentForm from '../../PackPaymentForm';
import { packOrderService } from '../../../services/packOrderService';
import { emailService } from '../../../services/emailService';
import { CampaignFormData, ShippingAddress, TshirtSizes } from '../types';

interface PaymentStepProps {
  campaignData: CampaignFormData;
  selectedPack: 'free' | 'medium' | 'large';
  shippingAddress: ShippingAddress;
  mobileNumber: string;
  tshirtSizes: TshirtSizes;
  createdCampaign: any;
  createdPackOrder: any;
  setCreatedPackOrder: (order: any) => void;
  onClose: () => void;
}

const packOptions = [
  { id: 'free', name: 'Free Starter Pack', price: 10 },
  { id: 'medium', name: 'Medium Pack', price: 35 },
  { id: 'large', name: 'Large Pack', price: 60 }
];

export default function PaymentStep({
  campaignData,
  selectedPack,
  shippingAddress,
  mobileNumber,
  tshirtSizes,
  createdCampaign,
  createdPackOrder,
  setCreatedPackOrder,
  onClose
}: PaymentStepProps) {
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  // Create pack order when component mounts
  useEffect(() => {
    if (createdCampaign && !orderCreated) {
      createPackOrder();
    }
  }, [createdCampaign, orderCreated]);

  const createPackOrder = async () => {
    try {
      const packOrderData = {
        campaignId: createdCampaign.id,
        userId: createdCampaign.user_id,
        packType: selectedPack,
        amount: packOptions.find(p => p.id === selectedPack)!.price * 100,
        tshirtSizes: (selectedPack === 'medium' || selectedPack === 'large') ? tshirtSizes : null,
        shippingAddress,
        mobileNumber: mobileNumber
      };
      
      const result = await packOrderService.createPackOrder(packOrderData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setCreatedPackOrder(result.data);
      setOrderCreated(true);
    } catch (error) {
      console.error('Error creating pack order:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to create pack order');
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      if (!createdPackOrder) {
        throw new Error('No pack order found');
      }
      
      const updateResult = await packOrderService.updatePackOrderPayment(
        createdPackOrder.id,
        {
          payment_status: 'completed',
          stripe_payment_intent_id: paymentIntent.id
        }
      );
      
      if (updateResult.error) {
        throw new Error(updateResult.error);
      }
      
      setPaymentSuccess(true);
      
      setTimeout(() => {
        onClose();

        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
        successToast.innerHTML = `✅ Payment successful! Campaign created and ${selectedPack} pack ordered. Check your email for receipt.`;
        document.body.appendChild(successToast);
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 5000);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating pack payment:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment succeeded but failed to update order');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);

    const errorToast = document.createElement('div');
    errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
    errorToast.innerHTML = `❌ Payment failed: ${error}. Please try again.`;
    document.body.appendChild(errorToast);
    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        document.body.removeChild(errorToast);
      }
    }, 7000);
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">
          Your payment of €{packOptions.find(p => p.id === selectedPack)?.price} has been processed successfully.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 font-medium mb-2">
            ✓ Payment confirmed
          </p>
          <p className="text-green-800 font-medium mb-2">
            ✓ {packOptions.find(p => p.id === selectedPack)?.name} ordered
          </p>
          <p className="text-green-800 font-medium">
            ✓ Campaign created
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          You will receive an email receipt shortly at <span className="font-medium">{campaignData.email}</span>
        </p>
        <p className="text-sm text-gray-500">
          Your campaign will be reviewed and approved within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Your Order</h3>
        <p className="text-gray-600">
          Your campaign has been created! Complete payment to get your {packOptions.find(p => p.id === selectedPack)?.name.toLowerCase()}.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="font-semibold text-green-900 mb-4">Order Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-green-800">Campaign:</span>
            <span className="font-medium text-green-900">{campaignData.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-800">Pack:</span>
            <span className="font-medium text-green-900">
              {packOptions.find(p => p.id === selectedPack)?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-800">Delivery to:</span>
            <span className="font-medium text-green-900">{shippingAddress.name}</span>
          </div>
          <div className="border-t border-green-200 pt-3 flex justify-between">
            <span className="text-green-800 font-semibold">Total:</span>
            <span className="font-bold text-green-900 text-lg">
              €{packOptions.find(p => p.id === selectedPack)?.price}
            </span>
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 text-sm">{paymentError}</p>
          </div>
        </div>
      )}

      {!stripePromise ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Payment System Not Configured</h4>
              <p className="text-amber-800 text-sm mb-3">
                Stripe payment processing is not currently configured. Please contact the administrator to complete your payment.
              </p>
              <p className="text-amber-700 text-xs">
                Your campaign and pack order have been created. Once payment is configured, you can complete your order.
              </p>
            </div>
          </div>
        </div>
      ) : !createdPackOrder ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Preparing payment form...</p>
          </div>
        </div>
      ) : (
        <Elements stripe={stripePromise}>
          <PackPaymentForm
            packOrderId={createdPackOrder.id}
            amount={packOptions.find(p => p.id === selectedPack)!.price}
            packType={selectedPack}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>
      )}
    </div>
  );
}