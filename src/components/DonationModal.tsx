import React, { useState, useEffect } from 'react';
import { X, Heart, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import StripePaymentForm from './StripePaymentForm';
import { Campaign } from '../types';
import { emailService } from '../services/emailService';

interface DonationModalProps {
  campaign: Campaign;
  onClose: () => void;
  onDonate: (donationData: any) => Promise<boolean>;
}

export default function DonationModal({ campaign, onClose, onDonate }: DonationModalProps) {
  const [donationAmount, setDonationAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorEmail, setDonorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const presetAmounts = [25, 50, 100, 250, 500];

  // Reset session timer on any donation activity
  const resetUserSession = () => {
    const event = new CustomEvent('resetUserSession');
    window.dispatchEvent(event);
  };

  // Load saved form data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`donation_form_${campaign.id}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setDonationAmount(parsed.donationAmount || '');
        setCustomAmount(parsed.customAmount || '');
        setDonorName(parsed.donorName || '');
        setMessage(parsed.message || '');
        setIsAnonymous(parsed.isAnonymous || false);
        setDonorEmail(parsed.donorEmail || '');
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, [campaign.id]);

  // Save form data whenever it changes
  useEffect(() => {
    const formData = {
      donationAmount,
      customAmount,
      donorName,
      message,
      isAnonymous,
      donorEmail
    };
    localStorage.setItem(`donation_form_${campaign.id}`, JSON.stringify(formData));
  }, [donationAmount, customAmount, donorName, message, isAnonymous, donorEmail, campaign.id]);

  const handleAmountSelect = (amount: number) => {
    resetUserSession();
    const newAmount = amount.toString();
    setDonationAmount(newAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    resetUserSession();
    setCustomAmount(value);
    setDonationAmount(value);
  };

  const handleProceedToPayment = () => {
    console.log('Proceed to payment clicked');
    resetUserSession();
    
    // Clear any previous errors
    setPaymentError('');
    
    // Validate donation amount
    const amount = parseFloat(donationAmount);
    if (!donationAmount || isNaN(amount) || amount < 1) {
      setPaymentError('Please enter a valid donation amount (minimum €1)');
      return;
    }
    
    // Validate donor name (if not anonymous)
    if (!isAnonymous && !donorName.trim()) {
      setPaymentError('Please enter your full name or check "Donate anonymously"');
      return;
    }
    
    // Validate email
    if (!donorEmail.trim()) {
      setPaymentError('Please enter your email address for the receipt');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail)) {
      setPaymentError('Please enter a valid email address');
      return;
    }
    
    console.log('Validation passed, proceeding to payment');
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      console.log('Payment successful, saving donation to database...');
      
      // Store donation data for admin dashboard
      const donationRecord = {
        id: paymentIntent.id,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        amount: parseFloat(donationAmount),
        donorName: isAnonymous ? null : donorName,
        donorEmail,
        message,
        isAnonymous,
        createdAt: new Date().toISOString(),
        paymentStatus: 'completed'
      };
      
      // Get existing donations from localStorage
      const existingDonations = JSON.parse(localStorage.getItem('demo_donations') || '[]');
      existingDonations.push(donationRecord);
      localStorage.setItem('demo_donations', JSON.stringify(existingDonations));
      
      console.log('Donation stored in localStorage:', donationRecord);
      
      // Save donation to database after successful payment
      const success = await onDonate({
        campaignId: campaign.id,
        amount: parseFloat(donationAmount),
        donorName: isAnonymous ? null : donorName,
        donorEmail,
        message,
        isAnonymous,
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'completed'
      });
      
      if (success) {
        console.log('Donation saved successfully!');
        
        // Send donation receipt email
        if (donorEmail && !isAnonymous && donorName) {
          console.log('Sending donation receipt email...');
          const emailResult = await emailService.sendDonationReceipt({
            donorEmail,
            donorName,
            amount: parseFloat(donationAmount),
            campaignTitle: campaign.title,
            organizerName: campaign.organizer,
            donationId: paymentIntent.id
          });
          
          if (emailResult.success) {
            console.log('Donation receipt email sent successfully');
          } else {
            console.error('Failed to send donation receipt email:', emailResult.error);
          }
        }
        
        // Dispatch event to notify admin dashboard
        window.dispatchEvent(new CustomEvent('donationCompleted', { detail: donationRecord }));
        // Clear saved form data on success
        localStorage.removeItem(`donation_form_${campaign.id}`);
        setPaymentSuccess(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        console.error('Failed to save donation');
        setPaymentError('Failed to record donation. Please contact support.');
      }
    } catch (error) {
      console.error('Error saving donation:', error);
      setPaymentError('Payment succeeded but failed to record donation. Please contact support.');
    }
  };

  const handlePaymentError = (error: string) => {
    console.log('Payment error occurred:', error);
    setPaymentError(error);
    setLoading(false);
  };

  const handleBackToForm = () => {
    console.log('Going back to donation form');
    setShowPayment(false);
    setPaymentError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {paymentSuccess ? (
            <div className="text-center py-8">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600 mb-4">
                Your donation of €{donationAmount} has been processed successfully.
              </p>
              <p className="text-sm text-gray-500">
                You will receive a receipt via email shortly. This window will close automatically.
              </p>
            </div>
          ) : showPayment ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBackToForm}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to donation details</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Donating to: {campaign.title}</h3>
                <p className="text-sm text-gray-600">by {campaign.organizer}</p>
                {!isAnonymous && donorName && (
                  <p className="text-sm text-gray-600 mt-1">Donor: {donorName}</p>
                )}
                {message && (
                  <p className="text-sm text-gray-600 mt-1 italic">"{message}"</p>
                )}
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <X className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 text-sm">{paymentError}</p>
                  </div>
                </div>
              )}

              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    amount={parseFloat(donationAmount)}
                    campaignId={campaign.id}
                    donorEmail={donorEmail}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    loading={loading}
                    setLoading={setLoading}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800 font-medium">Payment system configuration error</p>
                    <p className="text-red-600 text-sm mt-1">
                      Stripe publishable key is missing. Please check environment configuration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Heart className="h-5 w-5 text-green-700" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Make a Donation</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                <p className="text-sm text-gray-600">by {campaign.organizer}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose donation amount (€)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={`p-3 rounded-xl border-2 transition-colors font-medium ${
                        donationAmount === amount.toString()
                          ? 'border-green-700 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      €{amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter custom amount"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name {!isAnonymous && '*'}
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  disabled={isAnonymous}
                />
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Donate anonymously</span>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for donation receipt and updates on how your donation is making a difference.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message of support (optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Leave a message of encouragement..."
                />
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Secure Payment</h4>
                    <p className="text-sm text-blue-800">
                      Payments are processed securely through Stripe. Your donation goes directly to
                      Youth Suicide Prevention Ireland.
                    </p>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <X className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 text-sm">{paymentError}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="w-full bg-[#a8846d] text-white px-6 py-4 rounded-xl hover:bg-[#96785f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>
                  {loading ? 'Processing...' : `Continue to Payment ${donationAmount ? `€${donationAmount}` : ''}`}
                </span>
              </button>

              <p className="text-xs text-gray-600 text-center mt-4">
                By donating, you agree to our terms and confirm that you are authorized to use this payment method.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}