import React, { useState } from 'react';
import { 
  Settings, Save, RefreshCw, Shield, Mail, Bell, Database,
  Globe, Lock, Users, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import EmailTemplateManager from './EmailTemplateManager';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Youth Suicide Prevention Ireland - Coffee Morning Challenge',
    siteDescription: 'Creating communities where every young life is valued and protected.',
    contactEmail: 'admin@yspi.ie',
    supportPhone: '1800 828 888',
    
    // Campaign Settings
    autoApproval: false,
    minGoalAmount: 100,
    maxGoalAmount: 50000,
    campaignDuration: 90, // days
    
    // Email Settings
    emailNotifications: true,
    adminNotifications: true,
    donorReceipts: true,
    campaignUpdates: true,
    
    // Security Settings
    requireEmailVerification: true,
    passwordMinLength: 8,
    sessionTimeout: 24, // hours
    
    // Payment Settings
    stripePublishableKey: 'pk_test_...',
    stripeSecretKey: '••••••••••••••••',
    paymentProcessingFee: 2.9, // percentage
    
    // Notification Settings
    slackWebhook: '',
    discordWebhook: '',
    telegramBotToken: '',
    telegramChatId: '',
    
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.'
  });

  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'campaigns', label: 'Campaigns', icon: Users },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email-templates', label: 'Email Templates', icon: Mail },
    { id: 'maintenance', label: 'Maintenance', icon: AlertTriangle }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
              <textarea
                rows={3}
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'campaigns':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="autoApproval"
                checked={settings.autoApproval}
                onChange={(e) => setSettings({ ...settings, autoApproval: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoApproval" className="text-sm font-medium text-gray-700">
                Auto-approve campaigns (not recommended)
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Goal Amount (€)</label>
                <input
                  type="number"
                  value={settings.minGoalAmount}
                  onChange={(e) => setSettings({ ...settings, minGoalAmount: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Goal Amount (€)</label>
                <input
                  type="number"
                  value={settings.maxGoalAmount}
                  onChange={(e) => setSettings({ ...settings, maxGoalAmount: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Duration (days)</label>
              <input
                type="number"
                value={settings.campaignDuration}
                onChange={(e) => setSettings({ ...settings, campaignDuration: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">How long campaigns remain active by default</p>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                  Enable email notifications
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="adminNotifications"
                  checked={settings.adminNotifications}
                  onChange={(e) => setSettings({ ...settings, adminNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="adminNotifications" className="text-sm font-medium text-gray-700">
                  Send admin notifications for new campaigns
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="donorReceipts"
                  checked={settings.donorReceipts}
                  onChange={(e) => setSettings({ ...settings, donorReceipts: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="donorReceipts" className="text-sm font-medium text-gray-700">
                  Send donation receipts automatically
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="campaignUpdates"
                  checked={settings.campaignUpdates}
                  onChange={(e) => setSettings({ ...settings, campaignUpdates: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="campaignUpdates" className="text-sm font-medium text-gray-700">
                  Send campaign progress updates to organizers
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requireEmailVerification"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="requireEmailVerification" className="text-sm font-medium text-gray-700">
                Require email verification for new accounts
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.passwordMinLength}
                  onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800 text-sm font-medium">
                  Payment settings are sensitive. Changes require system restart.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Publishable Key</label>
              <input
                type="text"
                value={settings.stripePublishableKey}
                onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Secret Key</label>
              <input
                type="password"
                value={settings.stripeSecretKey}
                onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Processing Fee (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.paymentProcessingFee}
                onChange={(e) => setSettings({ ...settings, paymentProcessingFee: parseFloat(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Stripe processing fee percentage</p>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slack Webhook URL</label>
              <input
                type="url"
                value={settings.slackWebhook}
                onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://hooks.slack.com/services/..."
              />
              <p className="text-xs text-gray-500 mt-1">Receive notifications in Slack</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discord Webhook URL</label>
              <input
                type="url"
                value={settings.discordWebhook}
                onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-xs text-gray-500 mt-1">Receive notifications in Discord</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Bot Token</label>
              <input
                type="text"
                value={settings.telegramBotToken}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <p className="text-xs text-gray-500 mt-1">Bot token from @BotFather</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Chat ID</label>
              <input
                type="text"
                value={settings.telegramChatId}
                onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="-1001234567890"
              />
              <p className="text-xs text-gray-500 mt-1">Chat ID where notifications will be sent</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Setting up Telegram Notifications</h4>
                  <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                    <li>Create a bot by messaging @BotFather on Telegram</li>
                    <li>Copy the bot token and paste it above</li>
                    <li>Add the bot to your group/channel</li>
                    <li>Get the chat ID using @userinfobot or similar</li>
                    <li>Test notifications using the button below</li>
                  </ol>
                </div>
              </div>
            </div>
            {settings.telegramBotToken && settings.telegramChatId && (
              <button
                onClick={() => {
                  // Show success toast
                  const successToast = document.createElement('div');
                  successToast.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
                  successToast.innerHTML = '✅ Test notification sent to Telegram!';
                  document.body.appendChild(successToast);
                  setTimeout(() => {
                    document.body.removeChild(successToast);
                  }, 3000);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Test Notification
              </button>
            )}
          </div>
        );

      case 'email-templates':
        return <EmailTemplateManager />;

      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                Enable maintenance mode
              </label>
            </div>
            {settings.maintenanceMode && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 text-sm font-medium">
                    Maintenance mode is enabled - site is not accessible to users
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Message</label>
              <textarea
                rows={4}
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Message shown to users during maintenance</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
        <div className="flex items-center space-x-2">
          {saved && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}