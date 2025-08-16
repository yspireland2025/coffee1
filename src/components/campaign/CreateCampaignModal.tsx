import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AuthStep from './steps/AuthStep';
import BasicInfoStep from './steps/BasicInfoStep';
import EventDetailsStep from './steps/EventDetailsStep';
import FundraisingGoalStep from './steps/FundraisingGoalStep';
import SocialMediaStep from './steps/SocialMediaStep';
import PackSelectionStep from './steps/PackSelectionStep';
import ShippingStep from './steps/ShippingStep';
import PaymentStep from './steps/PaymentStep';
import { CampaignFormData, AuthFormData, ShippingAddress, TshirtSizes } from './types';

interface CreateCampaignModalProps {
  onClose: () => void;
  onSubmit: (campaignData: any) => Promise<any>;
}

export default function CreateCampaignModal({ onClose, onSubmit }: CreateCampaignModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [campaignData, setCampaignData] = useState<CampaignFormData>({
    title: '',
    organizer: '',
    email: '',
    county: '',
    eircode: '',
    story: '',
    goalAmount: '',
    eventDate: '',
    eventTime: '10:00',
    location: '',
    image: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      whatsapp: ''
    }
  });

  const [authData, setAuthData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    confirmEmail: '',
    county: '',
    eircode: ''
  });

  const [selectedPack, setSelectedPack] = useState<'free' | 'medium' | 'large'>('free');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: user?.user_metadata?.full_name || user?.full_name || '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: user?.user_metadata?.county || '',
    eircode: user?.user_metadata?.eircode || '',
    country: 'Ireland'
  });
  const [mobileNumber, setMobileNumber] = useState('');
  const [tshirtSizes, setTshirtSizes] = useState<TshirtSizes>({
    shirt_1: 'M',
    shirt_2: 'M',
    shirt_3: 'M',
    shirt_4: 'M'
  });

  const [createdCampaign, setCreatedCampaign] = useState<any>(null);
  const [createdPackOrder, setCreatedPackOrder] = useState<any>(null);

  const totalSteps = user ? 6 : 7;

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

  const handleAuthSuccess = () => {
    // Pre-fill campaign data with auth data
    setCampaignData(prev => ({
      ...prev,
      email: authData.email,
      organizer: authData.fullName,
      county: authData.county,
      eircode: authData.eircode
    }));
    
    // Also prefill shipping address with auth data
    setShippingAddress(prev => ({
      ...prev,
      name: authData.fullName,
      county: authData.county,
      eircode: authData.eircode
    }));
    
    setCurrentStep(2);
  };

  const handleCampaignSubmit = async () => {
    try {
      const campaignSubmitData = {
        ...campaignData,
        goalAmount: parseInt(campaignData.goalAmount),
        userId: user?.id,
        county: user.user_metadata?.county || '',
        eircode: user.user_metadata?.eircode || ''
      };
      
      const createdCampaign = await onSubmit(campaignSubmitData);
      setCreatedCampaign(createdCampaign);
      setCurrentStep(totalSteps);
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const renderCurrentStep = () => {
    // Step 1: Authentication (only if not logged in)
    if (!user && currentStep === 1) {
      return (
        <AuthStep
          authData={authData}
          setAuthData={setAuthData}
          onSuccess={handleAuthSuccess}
        />
      );
    }

    const adjustedStep = user ? currentStep : currentStep - 1;

    switch (adjustedStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={campaignData}
            setFormData={setCampaignData}
            user={user}
          />
        );
      case 2:
        return (
          <EventDetailsStep
            formData={campaignData}
            setFormData={setCampaignData}
          />
        );
      case 3:
        return (
          <FundraisingGoalStep
            formData={campaignData}
            setFormData={setCampaignData}
          />
        );
      case 4:
        return (
          <SocialMediaStep
            formData={campaignData}
            setFormData={setCampaignData}
          />
        );
      case 5:
        return (
          <PackSelectionStep
            selectedPack={selectedPack}
            setSelectedPack={setSelectedPack}
            shippingAddress={shippingAddress}
            setShippingAddress={setShippingAddress}
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            tshirtSizes={tshirtSizes}
            setTshirtSizes={setTshirtSizes}
          />
        );
      case 6:
        return (
          <PaymentStep
            campaignData={campaignData}
            selectedPack={selectedPack}
            shippingAddress={shippingAddress}
            createdCampaign={createdCampaign}
            createdPackOrder={createdPackOrder}
            setCreatedPackOrder={setCreatedPackOrder}
            onClose={onClose}
          />
        );
      default:
        return null;
    }
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
      return false; // AuthStep handles its own validation
    }

    const adjustedStep = user ? currentStep : currentStep - 1;

    switch (adjustedStep) {
      case 1:
        return campaignData.title && campaignData.organizer && campaignData.email && campaignData.story;
      case 2:
        return campaignData.county && campaignData.location && campaignData.eventDate && campaignData.eventTime && campaignData.eircode;
      case 3:
        return campaignData.goalAmount && parseInt(campaignData.goalAmount) >= 100;
      case 4:
        return true; // Social media is optional
      case 5:
        return true; // Pack selection step - just need to select a pack
      case 6:
        return shippingAddress.name && shippingAddress.address_line_1 && 
               shippingAddress.city && shippingAddress.county && shippingAddress.eircode && mobileNumber;
      case 7:
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

          {renderCurrentStep()}

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