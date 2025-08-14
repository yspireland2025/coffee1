import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CampaignCard from './components/CampaignCard';
import CampaignDetail from './components/CampaignDetail';
import DonationModal from './components/DonationModal';
import CreateCampaignModal from './components/CreateCampaignModal';
import AuthModal from './components/AuthModal';
import AboutSection from './components/AboutSection';
import CampaignsPage from './components/CampaignsPage';
import MyCampaignsModal from './components/MyCampaignsModal';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { useAuth } from './hooks/useAuth';
import { useAdmin } from './hooks/useAdmin';
import { useCampaigns } from './hooks/useCampaigns';
import { campaignService } from './services/campaignService';
import { Campaign } from './types';

function App() {
  console.log('App component rendering');
  
  const { user } = useAuth();
  const { adminUser, adminLogin, adminLogout, loading: adminLoading } = useAdmin();
  const { campaigns, loading: campaignsLoading, error: campaignsError } = useCampaigns();
  
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showCampaignsPage, setShowCampaignsPage] = useState(false);
  const [showMyCampaigns, setShowMyCampaigns] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Check URL hash for admin access
  useEffect(() => {
    const checkAdminHash = () => {
      if (window.location.hash === '#admin') {
        setShowAdminLogin(true);
      }
    };
    
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);
    
    return () => {
      window.removeEventListener('hashchange', checkAdminHash);
    };
  }, []);

  // Listen for custom events
  useEffect(() => {
    const handleOpenAuth = (event: CustomEvent) => {
      setAuthMode(event.detail.mode);
      setShowAuth(true);
    };

    const handleShowCampaignsPage = () => {
      setShowCampaignsPage(true);
    };

    window.addEventListener('openAuth', handleOpenAuth as EventListener);
    window.addEventListener('showCampaignsPage', handleShowCampaignsPage);

    return () => {
      window.removeEventListener('openAuth', handleOpenAuth as EventListener);
      window.removeEventListener('showCampaignsPage', handleShowCampaignsPage);
    };
  }, []);

  // Handle my campaigns modal
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#my-campaigns') {
        setShowMyCampaigns(true);
      }
    };

    handleHashChange(); // Check initial hash
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const handleDonate = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDonationModal(true);
  };

  const handleCreateCampaign = () => {
    setShowCreateCampaign(true);
  };

  const handleCampaignSubmit = async (campaignData: any) => {
    try {
      console.log('Creating campaign with data:', campaignData);
      const createdCampaign = await campaignService.createCampaign(campaignData, user?.id);
      console.log('Campaign created successfully');
      return createdCampaign; // Return the created campaign object with its ID
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
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

  // Show admin dashboard if admin is logged in
  if (adminUser && !adminLoading) {
    return <AdminDashboard onLogout={adminLogout} />;
  }

  // Show admin login if requested
  if (showAdminLogin && !adminUser) {
    return (
      <AdminLogin 
        onLogin={async (credentials) => {
          const success = await adminLogin(credentials);
          if (success) {
            setShowAdminLogin(false);
            window.location.hash = '';
          }
          return success;
        }}
      />
    );
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

  // Main application
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onCreateCampaign={handleCreateCampaign}
        showMyCampaigns={showMyCampaigns}
        setShowMyCampaigns={setShowMyCampaigns}
      />
      
      <main>
        <Hero onCreateCampaign={handleCreateCampaign} />
        
        {/* Featured Campaigns */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Coffee Mornings
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join these inspiring coffee mornings and help make a difference in young lives across Ireland.
              </p>
            </div>

            {campaignsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            ) : campaignsError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error loading campaigns: {campaignsError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-[#a8846d] text-white px-6 py-3 rounded-full hover:bg-[#96785f] transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : campaigns.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {campaigns.slice(0, 6).map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onViewCampaign={handleViewCampaign}
                      onDonate={handleDonate}
                    />
                  ))}
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => setShowCampaignsPage(true)}
                    className="bg-[#a8846d] text-white px-8 py-4 rounded-full hover:bg-[#96785f] transition-colors font-semibold text-lg"
                  >
                    View All Campaigns
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-6">No campaigns available at the moment.</p>
                <button
                  onClick={handleCreateCampaign}
                  className="bg-[#a8846d] text-white px-8 py-4 rounded-full hover:bg-[#96785f] transition-colors font-semibold"
                >
                  Be the First to Create a Campaign
                </button>
              </div>
            )}
          </div>
        </section>

        <AboutSection />

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Starting your coffee morning is simple. Follow these easy steps to make a difference.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-green-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-green-700">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Your Campaign</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set up your coffee morning campaign with your story, goal, and event details. 
                  Our team will review and approve it within 24 hours.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-green-700">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Share & Invite</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share your campaign with friends, family, and community. Use social media, 
                  email, and word of mouth to spread awareness.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-green-700">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Host & Raise Funds</h3>
                <p className="text-gray-600 leading-relaxed">
                  Host your coffee morning event and watch donations come in. Every euro 
                  goes directly to Youth Suicide Prevention Ireland.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Impact</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how your coffee morning contributions are making a real difference in preventing youth suicide.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center bg-green-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-green-700 mb-2">€25</div>
                <p className="text-gray-700 font-medium mb-2">Provides</p>
                <p className="text-gray-600 text-sm">Crisis support materials for one young person</p>
              </div>

              <div className="text-center bg-blue-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-blue-700 mb-2">€50</div>
                <p className="text-gray-700 font-medium mb-2">Funds</p>
                <p className="text-gray-600 text-sm">One hour of professional counseling support</p>
              </div>

              <div className="text-center bg-purple-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-purple-700 mb-2">€100</div>
                <p className="text-gray-700 font-medium mb-2">Enables</p>
                <p className="text-gray-600 text-sm">Mental health workshop for 20 students</p>
              </div>

              <div className="text-center bg-orange-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-orange-700 mb-2">€250</div>
                <p className="text-gray-700 font-medium mb-2">Supports</p>
                <p className="text-gray-600 text-sm">Training for teachers and parents in one school</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16" style={{ background: 'linear-gradient(to bottom right, #009ca3, #007a7f)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Join hundreds of others across Ireland who are hosting coffee mornings to prevent youth suicide. 
              Every conversation matters, every connection counts, and every euro saves lives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCreateCampaign}
                className="bg-white text-[#a8846d] px-8 py-4 rounded-full hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
              >
                Start Your Coffee Morning
              </button>
              <button
                onClick={() => setShowCampaignsPage(true)}
                className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-[#a8846d] transition-colors font-semibold text-lg"
              >
                Support Existing Campaigns
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4.2 2 2.21 0 4.8-1.79 4.8-4 0-1.66-1.34-3-3-3zM20.5 10.5v.5h-1.5v4c0 1.45-1.19 2.5-2.5 2.5s-2.5-1.05-2.5-2.5v-4H12v.5c0 1.25-1.16 2.5-2.5 2.5S7 12.75 7 11.5V7c0-2.2 1.8-4 4-4s4 1.8 4 4v4.5h1.5v-1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"/>
                    </svg>
                  </div>
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Youth Suicide Prevention Ireland</h3>
                  <p className="text-gray-400 text-sm">Coffee Morning Challenge</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Creating communities where every young life is valued and protected. Through coffee mornings, 
                conversations, and connections, we're working together to prevent youth suicide across Ireland.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.04 2c2.793 0 3.148.01 4.85.07 2.929.133 4.395 1.580 4.528 4.528.06 1.702.07 2.057.07 4.85s-.01 3.148-.07 4.85c-.133 2.948-1.599 4.395-4.528 4.528-1.702.06-2.057.07-4.85.07s-3.148-.01-4.85-.07c-2.929-.133-4.395-1.580-4.528-4.528-.06-1.702-.07-2.057-.07-4.85s.01-3.148.07-4.85C2.775 3.580 4.241 2.133 7.17 2c1.702-.06 2.057-.07 4.87-.07zM12.04 7.27a4.733 4.733 0 1 0 0 9.460 4.733 4.733 0 0 0 0-9.460zM18.205 6.855a1.125 1.125 0 1 0 0-2.250 1.125 1.125 0 0 0 0 2.250zm-6.161 3.029a3.096 3.096 0 1 1 0 6.191 3.096 3.096 0 0 1 0-6.191z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About YSPI</a></li>
                <li><a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => setShowCampaignsPage(true)} className="text-gray-300 hover:text-white transition-colors text-left">Browse Campaigns</button></li>
                <li><button onClick={handleCreateCampaign} className="text-gray-300 hover:text-white transition-colors text-left">Start Campaign</button></li>
                <li><a href="https://ineedhelp.ie" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">Crisis Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Contact & Support</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/>
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/>
                  </svg>
                  <a href="mailto:admin@yspi.ie" className="text-gray-300 hover:text-white transition-colors">admin@yspi.ie</a>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">1800 828 888</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="h-4 w-4 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                  </svg>
                  <div className="text-gray-300">
                    <div>83A New Street</div>
                    <div>Killarney, County Kerry</div>
                    <div>V93 W3KT</div>
                  </div>
                </li>
                <li className="text-gray-400 text-sm">
                  Registered Charity No. 20070670
                </li>
                <li>
                  <button
                    onClick={() => setShowAdminLogin(true)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Admin System
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Youth Suicide Prevention Ireland. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
              </div>
            </div>
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

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      )}

      {showMyCampaigns && (
        <MyCampaignsModal
          onClose={() => {
            setShowMyCampaigns(false);
            window.location.hash = '';
          }}
          onCreateCampaign={() => {
            setShowMyCampaigns(false);
            setShowCreateCampaign(true);
          }}
        />
      )}
    </div>
  );
}

export default App;