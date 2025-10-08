import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Coffee, DollarSign, TrendingUp, Calendar,
  Bell, Settings, LogOut, Shield, AlertTriangle, CheckCircle, Key, Package,
  Clock, MapPin, Mail, Phone, Eye, Edit, Trash2, Download
} from 'lucide-react';
import AdminMetrics from './AdminMetrics';
import CampaignManagement from './CampaignManagement';
import UserManagement from './UserManagement';
import DonationManagement from './DonationManagement';
import SystemSettings from './SystemSettings';
import PackManagement from './PackManagement';
import ChangePasswordModal from './ChangePasswordModal';
import { useAdmin } from '../../hooks/useAdmin';

type AdminView = 'dashboard' | 'campaigns' | 'users' | 'donations' | 'packs' | 'settings';

interface AdminDashboardProps {
  onLogout: () => void;
}


export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { resetSessionTimer } = useAdmin();

  const handleNavigation = (view: AdminView) => {
    resetSessionTimer();
    setCurrentView(view);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'campaigns', label: 'Campaigns', icon: Coffee },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'donations', label: 'Donations', icon: DollarSign },
    { id: 'packs', label: 'Pack Management', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminMetrics />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'users':
        return <UserManagement />;
      case 'donations':
        return <DonationManagement />;
      case 'packs':
        return <PackManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminMetrics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar */}
      <div className="lg:w-64 bg-white shadow-lg border-r border-gray-200 lg:block hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">YSPI Admin</h1>
              <p className="text-xs text-gray-500">Administration Portal</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.id as AdminView)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">YSPI Admin</h1>
              <p className="text-xs text-gray-500 capitalize">{currentView}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-1 p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id as AdminView)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {currentView === 'dashboard' ? 'Overview Dashboard' : currentView}
              </h2>
              <p className="text-gray-600">
                {currentView === 'dashboard' && 'Monitor system performance and key metrics'}
                {currentView === 'campaigns' && 'Manage coffee morning campaigns'}
                {currentView === 'users' && 'Manage user accounts and permissions'}
                {currentView === 'donations' && 'Track and manage donations'}
                {currentView === 'packs' && 'Manage pack orders and shipping'}
                {currentView === 'settings' && 'Configure system settings'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
                <div className="bg-blue-600 p-2 rounded-full">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">System Administrator</p>
                </div>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Change Password"
                >
                  <Key className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderCurrentView()}
        </main>

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePasswordModal
            onClose={() => setShowChangePassword(false)}
            onSuccess={() => {
              setShowChangePassword(false);
              const successToast = document.createElement('div');
              successToast.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
              successToast.innerHTML = '✅ Password changed successfully!';
              document.body.appendChild(successToast);
              setTimeout(() => {
                if (document.body.contains(successToast)) {
                  document.body.removeChild(successToast);
                }
              }, 3000);
            }}
          />
        )}
      </div>
    </div>
  );
}