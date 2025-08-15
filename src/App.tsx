import React, { useState, useEffect } from 'react';
import { Coffee, Heart, Menu, X, User, LogOut, ChevronDown, Users, Target, Calendar, MapPin, Clock, Share2, Facebook, Twitter, Instagram, MessageCircle, Mail, Phone, MessageSquare, Send, CheckCircle, Eye, EyeOff, AlertCircle, Package, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './lib/stripe';
import { useAuth } from './hooks/useAuth';
import { useCampaigns } from './hooks/useCampaigns';
import { useAdmin } from './hooks/useAdmin';
import { supabase } from './lib/supabase';
import { campaignService } from './services/campaignService';
import { emailService } from './services/emailService';
import { messageService } from './services/messageService';
import { packOrderService } from './services/packOrderService';
import { irishCounties } from './data/counties';
import { Campaign } from './types';

import Header from './components/Header';
import Hero from './components/Hero';
import CampaignCard from './components/CampaignCard';
import CampaignDetail from './components/CampaignDetail';
import DonationModal from './components/DonationModal';
import AuthModal from './components/AuthModal';
import CampaignsPage from './components/CampaignsPage';
import MyCampaignsModal from './components/MyCampaignsModal';
import MessageHostModal from './components/MessageHostModal';
import AboutSection from './components/AboutSection';
import CreateCampaignModal from './components/campaign/CreateCampaignModal';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  const { campaigns, loading, error } = useCampaigns();
  const { user, resetSessionTimer } = useAuth();
  const { adminUser, adminLogin, adminLogout, isAdmin } = useAdmin();
  
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showCampaignsPage, setShowCampaignsPage] = useState(false);
  const [showMyCampaigns, setShowMyCampaigns] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Check for admin route
  useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.hash === '#admin') {
        if (!isAdmin) {
          setShowAdminLogin(true);
        }
      }
    };

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, [isAdmin]);

  // Listen for custom events
  useEffect(() => {
    const handleOpenAuth = (event: any) => {
      setAuthMode(event.detail?.mode || 'signin');
      setShowAuthModal(true);
    };

    const handleShowCampaignsPage = () => {
      setShowCampaignsPage(true);
    };

    const handleResetUserSession = () => {
      resetSessionTimer();
    };

    window.addEventListener('openAuth', handleOpenAuth);
    window.addEventListener('showCampaignsPage', handleShowCampaignsPage);
    window.addEventListener('resetUserSession', handleResetUserSession);

    return () => {
      window.removeEventListener('openAuth', handleOpenAuth);
      window.removeEventListener('showCampaignsPage', handleShowCampaignsPage);
      window.removeEventListener('resetUserSession', handleResetUserSession);
    };
  }, [resetSessionTimer]);

  const handleCreateCampaign = () => {
    resetSessionTimer();
    setShowCreateCampaign(true);
  };

  const handleViewCampaign = (campaign: Campaign) => {
    resetSessionTimer();
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const handleDonate = (campaign: Campaign) => {
    resetSessionTimer();
    setSelectedCampaign(campaign);
    setShowDonationModal(true);
  };

  const handleDonationSubmit = async (donationData: any) => {
    try {
      await campaignService.createDonation(donationData);
      return true;
    } catch (error) {
      console.error('Error processing donation:', error);
      return false;
    }
  };

  const handleCampaignSubmit = async (campaignData: any) => {
    try {
      console.log('App: Creating campaign with data:', campaignData);
      const result = await campaignService.createCampaign(campaignData, user?.id);
      console.log('App: Campaign created successfully:', result);
      return result;
    } catch (error) {
      console.error('App: Error creating campaign:', error);
      throw error;
    }
  };

  const handleAdminLogin = async (credentials: { email: string; password: string }) => {
    const success = await adminLogin(credentials);
    if (success) {
      setShowAdminLogin(false);
      window.location.hash = '#admin';
    }
    return success;
  };

  const handleAdminLogout = async () => {
    await adminLogout();
    setShowAdminLogin(false);
    window.location.hash = '';
  };

  // Show admin dashboard if admin is logged in
  if (isAdmin) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // Show admin login if requested
  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  // Show campaigns page
  if (showCampaignsPage) {
    return (
      <CampaignsPage
        campaigns={campaigns}
        onBack={() => setShowCampaignsPage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onCreateCampaign={handleCreateCampaign}
        showMyCampaigns={showMyCampaigns}
        setShowMyCampaigns={setShowMyCampaigns}
      />
      
      <Hero onCreateCampaign={handleCreateCampaign} />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Creating your coffee morning is simple. Follow these easy steps to make a difference.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[#a8846d] p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Your Campaign</h3>
              <p className="text-gray-600">
                Tell your story and set up your coffee morning event. Choose your starter pack and we'll send you everything you need.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#009999] p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Host Your Event</h3>
              <p className="text-gray-600">
                Bring people together for coffee, conversation, and community. Use our materials to create awareness and collect donations.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#a8846d] p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Make an Impact</h3>
              <p className="text-gray-600">
                Watch your fundraising goal come to life as your community rallies behind youth mental health support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Coffee Mornings</h2>
              <p className="text-xl text-gray-600">
                Support these amazing community events happening across Ireland
              </p>
            </div>
            <button
              onClick={() => setShowCampaignsPage(true)}
              className="border-2 border-[#a8846d] text-[#a8846d] px-6 py-3 rounded-full hover:bg-[#a8846d] hover:text-white transition-colors font-medium"
            >
              View All Campaigns
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a8846d] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Campaigns</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Campaigns</h3>
              <p className="text-gray-600 mb-6">Be the first to create a coffee morning campaign!</p>
              <button
                onClick={handleCreateCampaign}
                className="bg-[#a8846d] text-white px-8 py-3 rounded-full hover:bg-[#96785f] transition-colors font-medium"
              >
                Start Your Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.slice(0, 6).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onViewCampaign={handleViewCampaign}
                  onDonate={handleDonate}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <AboutSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Coffee className="h-8 w-8 text-[#a8846d]" />
                <Heart className="h-6 w-6 text-[#009ca3]" />
                <div>
                  <h3 className="text-lg font-bold text-[#009ca3]">YOUTH SUICIDE PREVENTION IRELAND</h3>
                  <p className="text-sm text-[#a8846d]">Let's Talk Coffee Morning</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Creating communities where every young life is valued and protected through 
                meaningful conversations over coffee.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Registered Charity No. CHY 20866</p>
                <p>Email: admin@yspi.ie</p>
                <p>Crisis Line: 1800 828 888</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#about" className="hover:text-white transition-colors">About YSPI</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => setShowCampaignsPage(true)} className="hover:text-white transition-colors">Browse Campaigns</button></li>
                <li><a href="https://ineedhelp.ie" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Crisis Information</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="mailto:admin@yspi.ie" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#admin" className="hover:text-white transition-colors">Admin Portal</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Youth Suicide Prevention Ireland. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showCampaignDetail && selectedCampaign && (
        <CampaignDetail
          campaign={selectedCampaign}
          onClose={() => setShowCampaignDetail(false)}
          onDonate={handleDonate}
        />
      )}

      {showDonationModal && selectedCampaign && (
        <DonationModal
          campaign={selectedCampaign}
          onClose={() => setShowDonationModal(false)}
          onDonate={handleDonationSubmit}
        />
      )}

      {showCreateCampaign && (
        <CreateCampaignModal
          onClose={() => setShowCreateCampaign(false)}
          onSubmit={handleCampaignSubmit}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      )}

      {showMyCampaigns && (
        <MyCampaignsModal
          onClose={() => setShowMyCampaigns(false)}
          onCreateCampaign={handleCreateCampaign}
        />
      )}
    </div>
  );
}