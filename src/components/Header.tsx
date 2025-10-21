import React from 'react';
import { Coffee, Heart, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onCreateCampaign: () => void;
  showMyCampaigns: boolean;
  setShowMyCampaigns: (show: boolean) => void;
}

export default function Header({ onCreateCampaign, showMyCampaigns, setShowMyCampaigns }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const { user, signOut, resetSessionTimer } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  const handleNavigation = (action: () => void) => {
    resetSessionTimer();
    action();
  };

  return (
    <header className="bg-white shadow-sm border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-[#a8846d]" />
              <Heart className="h-6 w-6 text-[#009ca3]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#009ca3]">YOUTH SUICIDE PREVENTION IRELAND</h1>
              <p className="text-xs text-[#a8846d] hidden sm:block">Let&apos;s Talk Coffee Morning</p>

            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => {
                resetSessionTimer();
                navigate('/campaigns');
              }}
              className="text-gray-700 hover:text-green-700 transition-colors"
            >
              Browse All Campaigns
            </button>
            <button
              onClick={() => {
                resetSessionTimer();
                navigate('/');
                setTimeout(() => {
                  const element = document.getElementById('about');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
              className="text-gray-700 hover:text-green-700 transition-colors"
            >
              About YSPI
            </button>
            <a 
              href="https://ineedhelp.ie" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-green-700 transition-colors"
            >
              Crisis Information
            </a>
            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-700 transition-colors font-medium"
                  >
                    <span>User</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleNavigation(() => {
                            setShowMyCampaigns(true);
                          });
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <Coffee className="h-4 w-4" />
                        <span>Manage Campaigns</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={onCreateCampaign}
                  className="bg-[#a8846d] text-white px-6 py-2 rounded-full hover:bg-[#96785f] transition-colors font-medium"
                >
                  Start Your Campaign
                </button>
              </div>
            ) : (
             <div className="flex items-center space-x-4">
               <button
                 onClick={() => {
                   const event = new CustomEvent('openAuth', { detail: { mode: 'signin' } });
                   window.dispatchEvent(event);
                 }}
                 className="text-gray-700 hover:text-green-700 transition-colors font-medium"
               >
                 Sign In
               </button>
              <button
                onClick={onCreateCampaign}
                className="bg-[#a8846d] text-white px-6 py-2 rounded-full hover:bg-green-800 transition-colors font-medium"
              >
                Start Your Campaign
              </button>
             </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  resetSessionTimer();
                  navigate('/campaigns');
                  setIsMenuOpen(false);
                }}
                className="text-gray-700 hover:text-green-700 transition-colors text-left w-full"
              >
                Browse All Campaigns
              </button>
              <button
                onClick={() => {
                  resetSessionTimer();
                  navigate('/');
                  setIsMenuOpen(false);
                  setTimeout(() => {
                    const element = document.getElementById('about');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="text-gray-700 hover:text-green-700 transition-colors text-left w-full"
              >
                About YSPI
              </button>
              <a 
                href="https://ineedhelp.ie" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-green-700 transition-colors"
              >
                Crisis Information
              </a>
              {user ? (
                <div className="space-y-4">
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                 <button
                   onClick={() => {
                     handleNavigation(() => {
                       setShowMyCampaigns(true);
                     });
                     setIsMenuOpen(false);
                   }}
                   className="text-gray-700 hover:text-green-700 transition-colors text-left w-full"
                 >
                   Manage Campaigns
                 </button>
                  <button
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-700 transition-colors text-left flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                  <button
                    onClick={onCreateCampaign}
                    className="bg-[#a8846d] text-white px-6 py-2 rounded-full hover:bg-green-800 transition-colors font-medium text-left"
                  >
                    Start Your Campaign
                  </button>
                </div>
              ) : (
               <div className="space-y-4">
                 <button
                   onClick={() => {
                     const event = new CustomEvent('openAuth', { detail: { mode: 'signin' } });
                     window.dispatchEvent(event);
                     setIsMenuOpen(false);
                   }}
                   className="text-gray-700 hover:text-green-700 transition-colors text-left w-full"
                 >
                   Sign In
                 </button>
                <button
                  onClick={() => {
                    onCreateCampaign();
                    setIsMenuOpen(false);
                  }}
                  className="bg-[#a8846d] text-white px-6 py-2 rounded-full hover:bg-[#96785f] transition-colors font-medium text-left"
                >
                  Start Your Campaign
                </button>
               </div>
              )}
            </nav>
          </div>
        )}
      </div>
      
      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)}
        ></div>
      )}
    </header>
  );
}