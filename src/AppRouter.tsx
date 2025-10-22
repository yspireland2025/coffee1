import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useCampaigns } from './hooks/useCampaigns';
import { useAdmin } from './hooks/useAdmin';
import { campaignService } from './services/campaignService';
import { Campaign } from './types';

import Header from './components/Header';
import DonationModal from './components/DonationModal';
import AuthModal from './components/AuthModal';
import MyCampaignsModal from './components/MyCampaignsModal';
import CreateCampaignModal from './components/campaign/CreateCampaignModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import HomePage from './pages/HomePage';
import CampaignPage from './pages/CampaignPage';
import CampaignsPage from './components/CampaignsPage';
import EmailTestPage from './pages/EmailTestPage';

export default function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, resetSessionTimer } = useAuth();
  const { campaigns } = useCampaigns();
  const { adminUser, adminLogin, adminLogout, isAdmin } = useAdmin();

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showMyCampaigns, setShowMyCampaigns] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    const checkRoutes = () => {
      if (window.location.hash === '#admin') {
        if (!isAdmin) {
          setShowAdminLogin(true);
        }
      } else if (window.location.hash.startsWith('#reset-password')) {
        setShowResetPassword(true);
      }
    };

    checkRoutes();
    window.addEventListener('hashchange', checkRoutes);
    return () => window.removeEventListener('hashchange', checkRoutes);
  }, [isAdmin]);

  useEffect(() => {
    const handleOpenAuth = (event: any) => {
      setAuthMode(event.detail?.mode || 'signin');
      setShowAuthModal(true);
    };

    const handleResetUserSession = () => {
      resetSessionTimer();
    };

    window.addEventListener('openAuth', handleOpenAuth);
    window.addEventListener('resetUserSession', handleResetUserSession);

    return () => {
      window.removeEventListener('openAuth', handleOpenAuth);
      window.removeEventListener('resetUserSession', handleResetUserSession);
    };
  }, [resetSessionTimer]);

  const handleCreateCampaign = () => {
    resetSessionTimer();
    setShowCreateCampaign(true);
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
      const result = await campaignService.createCampaign(campaignData, user?.id);
      return result;
    } catch (error) {
      console.error('Error creating campaign:', error);
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

  if (isAdmin) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        onCreateCampaign={handleCreateCampaign}
        showMyCampaigns={showMyCampaigns}
        setShowMyCampaigns={setShowMyCampaigns}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onCreateCampaign={handleCreateCampaign}
              onDonate={handleDonate}
            />
          }
        />
        <Route
          path="/campaign/:id"
          element={<CampaignPage onDonate={handleDonate} />}
        />
        <Route
          path="/campaigns"
          element={
            <CampaignsPage
              campaigns={campaigns}
              onBack={() => navigate('/')}
            />
          }
        />
        <Route
          path="/email-test"
          element={<EmailTestPage />}
        />
      </Routes>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Coffee className="h-8 w-8 text-[#a8846d]" />
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
                <p>Registered Charity No. 20070670</p>
                <p>Address: 83A New Street, Killarney, County Kerry V93 W3KT Ireland</p>
                <p>Email: admin@yspi.ie</p>
                <p>Phone: 1800 828 888</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/#about" className="hover:text-white transition-colors">About YSPI</a></li>
                <li><a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => navigate('/campaigns')} className="hover:text-white transition-colors text-left">Browse Campaigns</button></li>
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

      {showResetPassword && (
        <ResetPasswordModal
          onClose={() => {
            setShowResetPassword(false);
            window.location.hash = '';
          }}
        />
      )}
    </div>
  );
}
