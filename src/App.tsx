import React, { useState, useEffect } from 'react';
import { Coffee, AlertCircle, MapPin, Mail, Phone, MessageSquare, Target } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useCampaigns } from './hooks/useCampaigns';
import { useAdmin } from './hooks/useAdmin';
import { campaignService } from './services/campaignService';
import { Campaign } from './types';

import Header from './components/Header';
import Hero from './components/Hero';
import CampaignCard from './components/CampaignCard';
import CampaignDetail from './components/CampaignDetail';
import DonationModal from './components/DonationModal';
import AuthModal from './components/AuthModal';
import CampaignsPage from './components/CampaignsPage';
import MyCampaignsModal from './components/MyCampaignsModal';
import AboutSection from './components/AboutSection';
import CreateCampaignModal from './components/campaign/CreateCampaignModal';
import ContactForm from './components/ContactForm';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  console.log('=== APP COMPONENT STARTING ===');
  
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

  console.log('=== APP STATE ===', {
    isAdmin,
    showAdminLogin,
    showCampaignsPage,
    showCreateCampaign,
    showAuthModal,
    showMyCampaigns,
    user: !!user,
    campaignsCount: campaigns.length,
    loading,
    error
  });

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
    console.log('=== CREATE CAMPAIGN CLICKED ===');
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
    console.log('=== RENDERING ADMIN DASHBOARD ===');
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // Show admin login if requested
  if (showAdminLogin) {
    console.log('=== RENDERING ADMIN LOGIN ===');
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  // Show campaigns page
  if (showCampaignsPage) {
    console.log('=== RENDERING CAMPAIGNS PAGE ===');
    return (
      <CampaignsPage
        campaigns={campaigns}
        onBack={() => setShowCampaignsPage(false)}
      />
    );
  }

  console.log('=== RENDERING MAIN APP ===');

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

      {/* Testimonials Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from the amazing people who have hosted coffee mornings and made a real difference
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150"
                  alt="Sarah O'Brien"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Sarah O'Brien</h4>
                  <p className="text-gray-600 text-sm">Cork</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4">
                "Hosting a coffee morning was one of the most rewarding experiences. We raised €2,400 and brought our community together for such an important cause. The starter pack made everything so easy!"
              </p>
              <div className="flex text-yellow-400">
                {'★'.repeat(5)}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150"
                  alt="Michael Chen"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Michael Chen</h4>
                  <p className="text-gray-600 text-sm">Dublin</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4">
                "The support from YSPI was incredible. From the planning materials to the promotional help, everything was provided. We exceeded our goal and had meaningful conversations about mental health."
              </p>
              <div className="flex text-yellow-400">
                {'★'.repeat(5)}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150"
                  alt="Emma Walsh"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Emma Walsh</h4>
                  <p className="text-gray-600 text-sm">Galway</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4">
                "I was nervous about organizing an event, but the step-by-step guide made it simple. Our coffee morning raised €1,800 and created lasting friendships in our community."
              </p>
              <div className="flex text-yellow-400">
                {'★'.repeat(5)}
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">Ready to create your own success story?</p>
            <button
              onClick={handleCreateCampaign}
              className="bg-[#a8846d] text-white px-8 py-4 rounded-full hover:bg-[#96785f] transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
            >
              Start Your Coffee Morning
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#009ca3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Our Impact Across Ireland</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              See how YSPI is making a difference in communities nationwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-8">
              <div className="bg-white/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                356
              </p>
              <p className="text-white/90 text-lg">Crisis Contacts</p>
              <p className="text-white/70 text-sm mt-2">Handled per day on average</p>
            </div>

            <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-8">
              <div className="bg-white/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Coffee className="h-10 w-10 text-white" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                1,486
              </p>
              <p className="text-white/90 text-lg">Schools Reached</p>
              <p className="text-white/70 text-sm mt-2">Mental health packs sent to secondary schools</p>
            </div>

            <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-8">
              <div className="bg-white/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-white" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                4,516
              </p>
              <p className="text-white/90 text-lg">Youth Organisations</p>
              <p className="text-white/70 text-sm mt-2">Resource packs sent to GAA clubs & youth groups</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mt-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-8">
              <div className="bg-white/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-10 w-10 text-white" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                112,344
              </p>
              <p className="text-white/90 text-lg">Publications Downloaded</p>
              <p className="text-white/70 text-sm mt-2">Mental health resources accessed online</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-white/90 text-lg mb-6">
              Join these amazing communities making a difference
            </p>
            <button
              onClick={handleCreateCampaign}
              className="bg-white text-[#009ca3] px-8 py-4 rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
            >
              Start Your Coffee Morning
            </button>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about hosting a coffee morning or need support? We're here to help.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Our team is ready to support you in creating a successful coffee morning. 
                  Whether you need guidance on planning your event or have questions about our mission, 
                  we're here to help every step of the way.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#009ca3] p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                    <p className="text-gray-600">
                      83A New Street<br />
                      Killarney, County Kerry<br />
                      V93 W3KT Ireland
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#a8846d] p-3 rounded-full">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                    <a 
                      href="mailto:admin@yspi.ie" 
                      className="text-[#009ca3] hover:text-[#007a7f] transition-colors"
                    >
                      admin@yspi.ie
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#009ca3] p-3 rounded-full">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                    <a 
                      href="tel:1800828888" 
                      className="text-[#009ca3] hover:text-[#007a7f] transition-colors"
                    >
                      1800 828 888
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2">Office Hours</h4>
                <div className="text-blue-800 text-sm space-y-1">
                  <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p>Saturday: 10:00 AM - 2:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Are You Ready to Proceed Section */}
      <section className="py-16 bg-gradient-to-br from-[#009ca3] to-[#a8846d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Are You Ready to Proceed?
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Join hundreds of community champions across Ireland who are making a real difference. 
            Your coffee morning could be the conversation that saves a life.
          </p>
          <p className="text-lg text-white/80 mb-12">
            Every cup of coffee shared, every story told, and every euro raised brings us closer 
            to a future where no young person feels alone in their struggles.
          </p>
          <button
            onClick={handleCreateCampaign}
            className="bg-white text-[#009ca3] px-12 py-4 rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 font-bold text-xl shadow-xl"
          >
            Start Your Coffee Morning Today
          </button>
        </div>
      </section>

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