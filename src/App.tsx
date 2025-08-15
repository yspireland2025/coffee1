import React, { useState } from 'react';
import { X, User, Mail, MapPin, Calendar, Clock, Target, Image, Share2, Package, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './lib/stripe';
import PackPaymentForm from './components/PackPaymentForm';
import { useAuth } from './hooks/useAuth';
import { irishCounties } from './data/counties';
import { packOrderService } from './services/packOrderService';
import { emailService } from './services/emailService';

interface CreateCampaignModalProps {
  onClose: () => void;
  onSubmit: (campaignData: any) => Promise<any>;
}

interface PackOption {
  id: 'free' | 'medium' | 'large';
  name: string;
  price: number;
  description: string;
  items: string[];
  popular?: boolean;
}

const packOptions: PackOption[] = [
  {
    id: 'free',
    name: 'Free Starter Pack',
    price: 10, // Just postage
    description: 'Everything you need to get started',
    items: [
      'Event planning guide',
      'Promotional posters',
      'Information leaflets',
      'Donation collection materials',
      'Social media templates'
    ],
    popular: true
  },
  {
    id: 'medium',
    name: 'Medium Pack',
    price: 35, // €25 + €10 postage
    description: 'Enhanced materials for bigger events',
    items: [
      'Everything in Free Pack',
      '2 YSPI branded t-shirts',
      'Table banners',
      'Recipe cards for coffee treats',
      'Thank you cards for donors'
    ]
  },
  {
    id: 'large',
    name: 'Large Pack',
    price: 60, // €50 + €10 postage
    description: 'Complete kit for community events',
    items: [
      'Everything in Medium Pack',
      '4 YSPI branded t-shirts',
      'Large event banner',
      'Coffee morning games pack',
      'Professional photo props',
      'Certificate of appreciation'
    ]
  }
];

const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function CreateCampaignModal({ onClose, onSubmit }: CreateCampaignModalProps) {
  const { user, signUp, signIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    email: '',
    county: 'Cork',
    eircode: '',
    story: '',
    goalAmount: '',
    eventDate: '',
    eventTime: '',
    location: '',
    image: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      whatsapp: ''
    }
  });

  // Auth state for step 1
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    confirmEmail: '',
    county: 'Cork',
    eircode: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Pack selection state
  const [selectedPack, setSelectedPack] = useState<'free' | 'medium' | 'large'>('free');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: 'Cork',
    eircode: '',
    country: 'Ireland'
  });
  const [mobileNumber, setMobileNumber] = useState('');
  const [tshirtSizes, setTshirtSizes] = useState({
    shirt_1: 'M',
    shirt_2: 'M',
    shirt_3: 'M',
    shirt_4: 'M'
  });

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);
  const [createdPackOrder, setCreatedPackOrder] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const totalSteps = user ? 6 : 7; // 7 steps if not authenticated, 6 if authenticated

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (authData.email !== authData.confirmEmail) {
          setAuthError('Email addresses do not match');
          return;
        }
        if (authData.password !== authData.confirmPassword) {
          setAuthError('Passwords do not match');
          return;
        }
        
        const { error } = await signUp(authData.email, authData.password, { full_name: authData.fullName });
        if (error) throw error;
        
        // Pre-fill form with user data
        setFormData(prev => ({
          ...prev,
          email: authData.email,
          organizer: authData.fullName,
          county: authData.county,
          eircode: authData.eircode
        }));
        
        setCurrentStep(2);
      } else {
        const { error } = await signIn(authData.email, authData.password);
        if (error) throw error;
        
        setCurrentStep(2);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCampaignSubmit = async () => {
    try {
      console.log('Creating campaign with form data:', formData);
      
      // Create the campaign first
      const campaignData = {
        ...formData,
        goalAmount: parseInt(formData.goalAmount),
        userId: user?.id
      };
      
      const createdCampaign = await onSubmit(campaignData);
      console.log('Campaign created:', createdCampaign);
      setCreatedCampaign(createdCampaign);
      
      // Create pack order
      const packOrderData = {
        campaignId: createdCampaign.id,
        userId: user?.id,
        packType: selectedPack,
        amount: packOptions.find(p => p.id === selectedPack)!.price * 100, // Convert to cents
        tshirtSizes: selectedPack !== 'free' ? tshirtSizes : null,
        shippingAddress,
        mobileNumber
      };
      
      console.log('Creating pack order:', packOrderData);
      const packOrderResult = await packOrderService.createPackOrder(packOrderData);
      
      if (packOrderResult.error) {
        throw new Error(packOrderResult.error);
      }
      
      console.log('Pack order created:', packOrderResult.data);
      setCreatedPackOrder(packOrderResult.data);
      
      // Update campaign with pack order ID
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ pack_order_id: packOrderResult.data!.id })
        .eq('id', createdCampaign.id);
      
      if (updateError) {
        console.error('Error linking pack order to campaign:', updateError);
      }
      
      // Move to payment step
      setCurrentStep(totalSteps);
      
    } catch (error) {
      console.error('Error in campaign creation process:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      console.log('Pack payment successful, updating order status...');
      
      if (!createdPackOrder) {
        throw new Error('No pack order found');
      }
      
      // Update pack order payment status
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
      
      console.log('Pack order payment updated successfully');
      
      // Send confirmation email
      if (createdCampaign && formData.email) {
        console.log('Sending pack payment confirmation email...');
        const emailResult = await emailService.sendPackPaymentConfirmation({
          organizerEmail: formData.email,
          organizerName: formData.organizer,
          campaignTitle: formData.title,
          packType: selectedPack,
          amount: packOptions.find(p => p.id === selectedPack)!.price,
          packOrderId: createdPackOrder.id
        });
        
        if (!emailResult.success) {
          console.error('Failed to send pack payment confirmation:', emailResult.error);
        }
      }
      
      setPaymentSuccess(true);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
        
        // Show success message
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
        successToast.innerHTML = `✅ Campaign created and ${selectedPack} pack ordered! Your campaign will be reviewed within 24 hours.`;
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
    console.log('Pack payment failed:', error);
    setPaymentError(error);
    
    // Campaign is still created, just payment failed
    // Show appropriate message to user
    const warningToast = document.createElement('div');
    warningToast.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-200 text-yellow-800 px-6 py-3 rounded-lg shadow-lg z-50';
    warningToast.innerHTML = `⚠️ Campaign created but payment failed. You can retry payment later from your dashboard.`;
    document.body.appendChild(warningToast);
    setTimeout(() => {
      if (document.body.contains(warningToast)) {
        document.body.removeChild(warningToast);
      }
    }, 5000);
  };

  const renderStepContent = () => {
    // Step 1: Authentication (only if not logged in)
    if (!user && currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {authMode === 'signup' ? 'Create Your Account' : 'Sign In to Continue'}
            </h3>
            <p className="text-gray-600">
              {authMode === 'signup' 
                ? 'Create an account to manage your coffee morning campaign'
                : 'Sign in to your existing account'
              }
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 text-sm">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={authData.fullName}
                  onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Confirm Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={authData.confirmEmail}
                    onChange={(e) => setAuthData({ ...authData, confirmEmail: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirm your email address"
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={authData.confirmPassword}
                    onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                </div>
              )}
            </div>

            {authMode === 'signup' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    County *
                  </label>
                  <select
                    required
                    value={authData.county}
                    onChange={(e) => setAuthData({ ...authData, county: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {irishCounties.map((county) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eircode (Optional)
                  </label>
                  <input
                    type="text"
                    value={authData.eircode}
                    onChange={(e) => setAuthData({ ...authData, eircode: e.target.value.toUpperCase() })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="A65 F4E2"
                    maxLength={8}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {authLoading ? 'Please wait...' : (authMode === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue')}
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-600">
              {authMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                className="text-green-700 hover:text-green-800 font-medium"
              >
                {authMode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      );
    }

    // Adjust step numbers if user is already authenticated
    const adjustedStep = user ? currentStep : currentStep - 1;

    // Step 2: Basic Information
    if (adjustedStep === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tell Us About Your Coffee Morning</h3>
            <p className="text-gray-600">Share your story and inspire others to support your cause</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="inline h-4 w-4 mr-1" />
              Campaign Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Sarah's Coffee Morning for Hope"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Story *
            </label>
            <textarea
              required
              rows={4}
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Share why you're hosting this coffee morning and how it connects to YSPI's mission..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Tell people why this cause matters to you. Personal stories create stronger connections.
            </p>
          </div>
        </div>
      );
    }

    // Step 3: Location & Event Details
    if (adjustedStep === 2) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Event Details</h3>
            <p className="text-gray-600">When and where will your coffee morning take place?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County *
              </label>
              <select
                required
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {irishCounties.map((county) => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eircode (Optional)
              </label>
              <input
                type="text"
                value={formData.eircode}
                onChange={(e) => setFormData({ ...formData, eircode: e.target.value.toUpperCase() })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="A65 F4E2"
                maxLength={8}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Event Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Community Centre, Main Street, Cork"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Event Time *
              </label>
              <input
                type="time"
                required
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      );
    }

    // Step 4: Fundraising Goal
    if (adjustedStep === 3) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Set Your Fundraising Goal</h3>
            <p className="text-gray-600">How much would you like to raise for Youth Suicide Prevention Ireland?</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="inline h-4 w-4 mr-1" />
              Fundraising Goal (€) *
            </label>
            <input
              type="number"
              required
              min="100"
              max="50000"
              value={formData.goalAmount}
              onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 2000"
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum €100, maximum €50,000. Consider what's realistic for your network and event size.
            </p>
          </div>

          <div className="bg-green-50 rounded-2xl p-6">
            <h4 className="font-semibold text-green-900 mb-4">Your Impact</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-green-800">€25 = Crisis support materials for one young person</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-green-800">€50 = One hour of professional counseling</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-green-800">€100 = Mental health workshop for 20 students</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-green-800">€250 = Teacher training in one school</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Step 5: Social Media (Optional)
    if (adjustedStep === 4) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Social Media</h3>
            <p className="text-gray-600">Help people find and follow your campaign (optional)</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Share2 className="inline h-4 w-4 mr-1" />
                Facebook Page
              </label>
              <input
                type="url"
                value={formData.socialLinks.facebook}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="url"
                value={formData.socialLinks.instagram}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://instagram.com/youraccount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter/X
              </label>
              <input
                type="url"
                value={formData.socialLinks.twitter}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://twitter.com/youraccount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Group
              </label>
              <input
                type="url"
                value={formData.socialLinks.whatsapp}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, whatsapp: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
            <p className="text-blue-800 text-sm">
              Social media links help build trust and allow supporters to follow your journey. 
              You can always add these later if you don't have them ready now.
            </p>
          </div>
        </div>
      );
    }

    // Step 6: Pack Selection
    if (adjustedStep === 5) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Your Coffee Morning Pack</h3>
            <p className="text-gray-600">Select the pack that best suits your event size and needs</p>
          </div>

          <div className="grid gap-6">
            {packOptions.map((pack) => (
              <div
                key={pack.id}
                className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedPack === pack.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                } ${pack.popular ? 'ring-2 ring-green-200' : ''}`}
                onClick={() => setSelectedPack(pack.id)}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-6 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{pack.name}</h4>
                    <p className="text-gray-600">{pack.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">€{pack.price}</div>
                    <div className="text-sm text-gray-500">
                      {pack.id === 'free' ? 'Postage only' : 'Inc. €10 postage'}
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {pack.items.map((item, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  <input
                    type="radio"
                    id={pack.id}
                    name="pack"
                    checked={selectedPack === pack.id}
                    onChange={() => setSelectedPack(pack.id)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={pack.id}
                    className={`block w-full text-center py-2 px-4 rounded-lg font-medium transition-colors ${
                      selectedPack === pack.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPack === pack.id ? 'Selected' : 'Select This Pack'}
                  </label>
                </div>

                {/* T-shirt sizes for medium and large packs */}
                {selectedPack === pack.id && pack.id !== 'free' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-3">
                      T-shirt Sizes ({pack.id === 'medium' ? '2 shirts' : '4 shirts'})
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: pack.id === 'medium' ? 2 : 4 }, (_, i) => (
                        <div key={i}>
                          <label className="block text-sm text-gray-700 mb-1">
                            Shirt {i + 1}
                          </label>
                          <select
                            value={tshirtSizes[`shirt_${i + 1}` as keyof typeof tshirtSizes]}
                            onChange={(e) => setTshirtSizes({
                              ...tshirtSizes,
                              [`shirt_${i + 1}`]: e.target.value
                            })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {tshirtSizes.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Step 7: Shipping Information
    if (adjustedStep === 6) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Shipping Information</h3>
            <p className="text-gray-600">Where should we send your Coffee Morning pack?</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={shippingAddress.name}
              onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Full name for delivery"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 1 *
            </label>
            <input
              type="text"
              required
              value={shippingAddress.address_line_1}
              onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_1: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              value={shippingAddress.address_line_2}
              onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_2: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Town *
              </label>
              <input
                type="text"
                required
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="City or town"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County *
              </label>
              <select
                required
                value={shippingAddress.county}
                onChange={(e) => setShippingAddress({ ...shippingAddress, county: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {irishCounties.map((county) => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eircode *
              </label>
              <input
                type="text"
                required
                value={shippingAddress.eircode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, eircode: e.target.value.toUpperCase() })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="A65 F4E2"
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="+353 87 123 4567"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <Package className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Delivery Information</h4>
                <p className="text-blue-800 text-sm">
                  Your {packOptions.find(p => p.id === selectedPack)?.name} will be posted to this address within 3-5 business days after payment confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Final Step: Payment
    if (adjustedStep === totalSteps - (user ? 0 : 1)) {
      if (paymentSuccess) {
        return (
          <div className="text-center py-8">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Campaign Created Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Your campaign has been created and your {packOptions.find(p => p.id === selectedPack)?.name.toLowerCase()} has been ordered.
            </p>
            <p className="text-sm text-gray-500">
              Your campaign will be reviewed and approved within 24 hours. You'll receive an email confirmation shortly.
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
                <span className="font-medium text-green-900">{formData.title}</span>
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

          {stripePromise && createdPackOrder ? (
            <Elements stripe={stripePromise}>
              <PackPaymentForm
                packOrderId={createdPackOrder.id}
                amount={packOptions.find(p => p.id === selectedPack)!.price}
                packType={selectedPack}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-medium">Payment system configuration error</p>
                <p className="text-red-600 text-sm mt-1">
                  Unable to load payment form. Please contact support.
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const getStepTitle = () => {
    if (!user && currentStep === 1) return 'Account Setup';
    
    const adjustedStep = user ? currentStep : currentStep - 1;
    
    switch (adjustedStep) {
      case 1: return 'Basic Information';
      case 2: return 'Event Details';
      case 3: return 'Fundraising Goal';
      case 4: return 'Social Media';
      case 5: return 'Pack Selection';
      case 6: return 'Payment';
      default: return 'Create Campaign';
    }
  };

  const canProceed = () => {
    if (!user && currentStep === 1) {
      if (authMode === 'signup') {
        return authData.email && authData.confirmEmail && authData.password && authData.confirmPassword && authData.fullName && authData.county;
      } else {
        return authData.email && authData.password;
      }
    }

    const adjustedStep = user ? currentStep : currentStep - 1;

    switch (adjustedStep) {
      case 1:
        return formData.title && formData.organizer && formData.email && formData.story;
      case 2:
        return formData.county && formData.location && formData.eventDate && formData.eventTime;
      case 3:
        return formData.goalAmount && parseInt(formData.goalAmount) >= 100;
      case 4:
        return true; // Social media is optional
      case 5:
        return selectedPack && shippingAddress.name && shippingAddress.address_line_1 && 
               shippingAddress.city && shippingAddress.county && shippingAddress.eircode && mobileNumber;
      case 6:
        return false; // Payment step, no "next" button
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Your Coffee Morning</h2>
              <p className="text-gray-600">Step {currentStep} of {totalSteps}: {getStepTitle()}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200">
            <button
              onClick={currentStep === 1 ? onClose : handleBack}
              className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            {currentStep < totalSteps && (
              <button
                onClick={currentStep === totalSteps - 1 ? handleCampaignSubmit : handleNext}
                disabled={!canProceed()}
                className="bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {currentStep === totalSteps - 1 ? 'Create Campaign & Continue' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}