import React, { useState, useEffect } from 'react';
import { X, Edit, Calendar, MapPin, Target, Clock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { campaignService } from '../services/campaignService';
import { authService } from '../services/authService';
import { irishCounties } from '../data/counties';

interface MyCampaignsModalProps {
  onClose: () => void;
  onCreateCampaign?: () => void;
}

interface UserCampaign {
  id: string;
  title: string;
  organizer: string;
  email: string;
  county: string;
  eircode: string | null;
  story: string;
  goal_amount: number;
  raised_amount: number;
  event_date: string;
  event_time: string;
  location: string;
  social_links: Record<string, string>;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
}

export default function MyCampaignsModal({ onClose, onCreateCampaign }: MyCampaignsModalProps) {
  const { user, resetSessionTimer } = useAuth();
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState<UserCampaign | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (user) {
      resetSessionTimer();
      loadUserCampaigns();
    }
  }, [user]);

  const loadUserCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getUserCampaigns(user!.id);
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (campaign: UserCampaign) => {
    resetSessionTimer();
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      organizer: campaign.organizer,
      story: campaign.story,
      goal_amount: campaign.goal_amount.toString(),
      event_date: campaign.event_date,
      event_time: campaign.event_time,
      location: campaign.location,
      county: campaign.county,
      eircode: campaign.eircode || '',
      social_links: campaign.social_links || {}
    });
  };

  const handleSaveChanges = async () => {
    if (!editingCampaign) return;

    resetSessionTimer();

    try {
      await campaignService.updateCampaign(editingCampaign.id, {
        title: formData.title,
        organizer: formData.organizer,
        story: formData.story,
        goal_amount: parseInt(formData.goal_amount),
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location,
        county: formData.county,
        eircode: formData.eircode || null,
        social_links: formData.social_links,
        updated_at: new Date().toISOString()
      });

      setEditingCampaign(null);
      loadUserCampaigns();
      
      // Show success feedback
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.innerHTML = '✅ Campaign updated successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Error updating campaign:', error);
      
      // Show error feedback
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
      errorMessage.innerHTML = '❌ Failed to update campaign. Please try again.';
      document.body.appendChild(errorMessage);
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 3000);
    }
  };

  const getStatusBadge = (campaign: UserCampaign) => {
    if (!campaign.is_approved && campaign.is_active) {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending Approval</span>;
    }
    if (campaign.is_approved && campaign.is_active) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Live</span>;
    }
    if (!campaign.is_active) {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Inactive</span>;
    }
    return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Rejected</span>;
  };

  if (editingCampaign) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Edit Campaign</h2>
              <button
                onClick={() => setEditingCampaign(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Story</label>
                <textarea
                  rows={4}
                  value={formData.story}
                  onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Fundraising Goal (€)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                  <select
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {irishCounties.map((county) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Eircode</label>
                  <input
                    type="text"
                    value={formData.eircode}
                    onChange={(e) => setFormData({ ...formData, eircode: e.target.value.toUpperCase() })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    maxLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Event Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  onClick={() => setEditingCampaign(null)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="flex-1 bg-[#a8846d] text-white px-6 py-3 rounded-xl hover:bg-[#96785f] transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Campaigns</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading your campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven't created any campaigns yet.</p>
              <button
                onClick={() => {
                  onClose();
                  if (onCreateCampaign) {
                    onCreateCampaign();
                  }
                }}
                className="bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 transition-colors font-medium"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{campaign.title}</h3>
                      <p className="text-gray-600">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(campaign)}
                      <button
                        onClick={() => handleEditClick(campaign)}
                        className="bg-blue-100 text-blue-700 p-2 rounded-full hover:bg-blue-200 transition-colors"
                        title="Edit campaign"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Fundraising Progress</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min((campaign.raised_amount / campaign.goal_amount) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          €{campaign.raised_amount.toLocaleString()} / €{campaign.goal_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Event Details</p>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(campaign.event_date).toLocaleDateString()} at {campaign.event_time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{campaign.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-2">{campaign.story}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}