import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle,
  Calendar, MapPin, DollarSign, Users, Clock, Download,
  AlertTriangle, AlertCircle, Mail, Phone, Send
} from 'lucide-react';
import { useCampaigns } from '../../hooks/useCampaigns';
import { supabase } from '../../lib/supabase';
import { emailService } from '../../services/emailService';
import { packOrderService } from '../../services/packOrderService';

interface Campaign {
  id: string;
  title: string;
  organizer: string;
  email: string;
  county: string;
  goal_amount: number;
  raised_amount: number;
  event_date: string;
  event_time: string;
  location: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  story: string;
}

export default function CampaignManagement() {
  const { campaigns: publicCampaigns, loading: publicLoading } = useCampaigns();
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sendingPaymentLink, setSendingPaymentLink] = useState<string | null>(null);

  // Load ALL campaigns (including pending ones) for admin view
  useEffect(() => {
    const loadAllCampaigns = async () => {
      try {
        setLoading(true);
        console.log('CampaignManagement: Starting to load campaigns...');
        
        // Fetch ALL campaigns from database (including pending ones)
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('CampaignManagement: Raw database response:', { data, error });
        
        if (error) {
          console.error('Error loading campaigns:', error);
          console.error('Error details:', error.message, error.details, error.hint);
          throw error;
        }

        console.log('CampaignManagement: Raw campaign data from database:', data);
        console.log('CampaignManagement: Number of campaigns found:', data?.length || 0);

        // Convert to admin format
        const adminCampaigns: Campaign[] = data.map(campaign => ({
          id: campaign.id,
          title: campaign.title,
          organizer: campaign.organizer,
          email: campaign.email,
          county: campaign.county,
          goal_amount: campaign.goal_amount,
          raised_amount: Math.round(campaign.raised_amount / 100), // Convert cents to euros
          event_date: campaign.event_date,
          event_time: campaign.event_time,
          location: campaign.location,
          is_approved: campaign.is_approved,
          is_active: campaign.is_active,
          created_at: campaign.created_at,
          story: campaign.story
        }));

        console.log('CampaignManagement: Formatted campaigns for admin:', adminCampaigns);
        setAllCampaigns(adminCampaigns);
        setFilteredCampaigns(adminCampaigns);
      } catch (error) {
        console.error('Error loading campaigns:', error);
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
        errorToast.innerHTML = `❌ Failed to load campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`;
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 5000);
      } finally {
        setLoading(false);
      }
    };

    loadAllCampaigns();

    // Set up real-time subscription for campaign changes
    const subscription = supabase
      .channel('admin_campaigns')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'campaigns' },
        (payload) => {
          console.log('Campaign change detected:', payload);
          loadAllCampaigns(); // Reload campaigns when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter campaigns based on search and filters
  useEffect(() => {
    let filtered = allCampaigns;

    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        filtered = filtered.filter(campaign => campaign.is_approved && campaign.is_active);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(campaign => !campaign.is_approved && campaign.is_active && campaign.pack_payment_status === 'completed');
      } else if (statusFilter === 'pack_pending') {
        filtered = filtered.filter(campaign => campaign.pack_payment_status === 'pending');
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(campaign => !campaign.is_active);
      }
    }

    if (countyFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.county === countyFilter);
    }

    setFilteredCampaigns(filtered);
  }, [allCampaigns, searchTerm, statusFilter, countyFilter]);

  const handleApprove = (campaignId: string) => {
    const approveCampaign = async () => {
      try {
        const { error } = await supabase
          .from('campaigns')
          .update({ is_approved: true })
          .eq('id', campaignId);

        if (error) throw error;

        // Update local state
        setAllCampaigns(prev => prev.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, is_approved: true }
            : campaign
        ));
        
        // Send approval email to campaign organizer
        const approvedCampaign = allCampaigns.find(c => c.id === campaignId);
        if (approvedCampaign) {
          console.log('Sending campaign approval email...');
          const emailResult = await emailService.sendCampaignApproval({
            organizerEmail: approvedCampaign.email,
            organizerName: approvedCampaign.organizer,
            campaignTitle: approvedCampaign.title,
            goalAmount: approvedCampaign.goal_amount,
            eventDate: approvedCampaign.event_date,
            eventLocation: approvedCampaign.location,
            campaignId: approvedCampaign.id,
            campaignNumber: approvedCampaign.campaign_number
          });
          
          if (emailResult.success) {
            console.log('Campaign approval email sent successfully');
          } else {
            console.error('Failed to send campaign approval email:', emailResult.error);
          }
        }
        
        // Show success toast
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
        successToast.innerHTML = '✅ Campaign approved successfully! It will now appear on the public website.';
        document.body.appendChild(successToast);
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 4000);
      } catch (error) {
        console.error('Error approving campaign:', error);
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
        errorToast.innerHTML = '❌ Failed to approve campaign. Please try again.';
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 3000);
      }
    };

    approveCampaign();
  };

  const handleReject = (campaignId: string) => {
    const rejectCampaign = async () => {
      try {
        const { error } = await supabase
          .from('campaigns')
          .update({ is_approved: false, is_active: false })
          .eq('id', campaignId);

        if (error) throw error;

        // Update local state
        setAllCampaigns(prev => prev.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, is_approved: false, is_active: false }
            : campaign
        ));
        
        // Show warning toast
        const warningToast = document.createElement('div');
        warningToast.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-200 text-yellow-800 px-6 py-3 rounded-lg shadow-lg z-50';
        warningToast.innerHTML = '⚠️ Campaign rejected and deactivated.';
        document.body.appendChild(warningToast);
        setTimeout(() => {
          if (document.body.contains(warningToast)) {
            document.body.removeChild(warningToast);
          }
        }, 3000);
      } catch (error) {
        console.error('Error rejecting campaign:', error);
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
        errorToast.innerHTML = '❌ Failed to reject campaign. Please try again.';
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 3000);
      }
    };

    rejectCampaign();
  };

  const handleDeactivate = (campaignId: string) => {
    const deactivateCampaign = async () => {
      try {
        const { error } = await supabase
          .from('campaigns')
          .update({ is_active: false })
          .eq('id', campaignId);

        if (error) throw error;

        // Update local state
        setAllCampaigns(prev => prev.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, is_active: false }
            : campaign
        ));
        
        // Show info toast
        const infoToast = document.createElement('div');
        infoToast.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-200 text-blue-800 px-6 py-3 rounded-lg shadow-lg z-50';
        infoToast.innerHTML = 'ℹ️ Campaign deactivated successfully.';
        document.body.appendChild(infoToast);
        setTimeout(() => {
          if (document.body.contains(infoToast)) {
            document.body.removeChild(infoToast);
          }
        }, 3000);
      } catch (error) {
        console.error('Error deactivating campaign:', error);
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
        errorToast.innerHTML = '❌ Failed to deactivate campaign. Please try again.';
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 3000);
      }
    };

    deactivateCampaign();
  };

  const handleSendPaymentLink = async (campaign: Campaign) => {
    if (!campaign.pack_order_id) {
      alert('No pack order found for this campaign');
      return;
    }

    setSendingPaymentLink(campaign.id);

    try {
      const result = await packOrderService.createPaymentLink({
        packOrderId: campaign.pack_order_id,
        campaignTitle: campaign.title,
        organizerName: campaign.organizer,
        organizerEmail: campaign.email,
        sendEmail: true
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
      successToast.innerHTML = `Payment link sent to ${campaign.organizer} at ${campaign.email}`;
      document.body.appendChild(successToast);
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 5000);
    } catch (error) {
      console.error('Error sending payment link:', error);

      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
      errorToast.innerHTML = `Failed to send payment link: ${error instanceof Error ? error.message : 'Unknown error'}`;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 5000);
    } finally {
      setSendingPaymentLink(null);
    }
  };

  const getStatusBadge = (campaign: Campaign) => {
    if (!campaign.is_active) {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Inactive</span>;
    }
    if (campaign.is_approved && campaign.is_active) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Live</span>;
    }
    if (campaign.pack_payment_status === 'pending') {
      return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">Pack Payment Pending</span>;
    }
    if (!campaign.is_approved && campaign.is_active && campaign.pack_payment_status === 'completed') {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Awaiting Approval</span>;
    }
    return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending</span>;
  };

  const counties = [...new Set(allCampaigns.map(c => c.county))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      {allCampaigns.some(c => c.pack_payment_status === 'pending' && !c.is_approved && c.is_active) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Some campaigns have pending pack payments. Campaigns cannot be approved until the organizer completes their pack payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="approved">Live</option>
            <option value="pending">Pending</option>
            <option value="pack_pending">Pack Payment Pending</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Counties</option>
            {counties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 min-w-[200px]">Campaign</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden sm:table-cell">Organizer</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden md:table-cell">Location</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden lg:table-cell">Progress</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden md:table-cell">Event Date</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Status</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-3 sm:px-6">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.title}</p>
                      <p className="text-xs text-gray-500">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
                      <div className="sm:hidden mt-1">
                        <p className="text-xs text-gray-600">{campaign.organizer}</p>
                        <p className="text-xs text-gray-500">{campaign.county}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden sm:table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.organizer}</p>
                      <p className="text-sm text-gray-500">{campaign.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden md:table-cell">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{campaign.county}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden lg:table-cell">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          €{campaign.raised_amount.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          €{campaign.goal_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min((campaign.raised_amount / campaign.goal_amount) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden md:table-cell">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {new Date(campaign.event_date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6">
                    {getStatusBadge(campaign)}
                  </td>
                  <td className="py-4 px-3 sm:px-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setShowDetails(true);
                        }}
                        className="bg-blue-100 text-blue-700 p-1.5 sm:p-2 rounded-lg hover:bg-blue-200 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      
                      {!campaign.is_approved && campaign.is_active && (
                        <>
                          {campaign.pack_payment_status === 'completed' ? (
                            <>
                          <button
                            onClick={() => handleApprove(campaign.id)}
                            className="bg-green-100 text-green-700 p-1.5 sm:p-2 rounded-lg hover:bg-green-200 transition-colors"
                            title="Approve campaign"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(campaign.id)}
                            className="bg-red-100 text-red-700 p-1.5 sm:p-2 rounded-lg hover:bg-red-200 transition-colors"
                            title="Reject campaign"
                          >
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 italic" title="Cannot approve until pack payment is completed">
                                Awaiting payment
                              </span>
                              <button
                                onClick={() => handleSendPaymentLink(campaign)}
                                disabled={sendingPaymentLink === campaign.id}
                                className="bg-blue-100 text-blue-700 p-1.5 sm:p-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Send payment link to organizer"
                              >
                                {sendingPaymentLink === campaign.id ? (
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      
                      {campaign.is_active && (
                        <button
                          onClick={() => handleDeactivate(campaign.id)}
                          className="bg-gray-100 text-gray-700 p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Deactivate campaign"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Details Modal */}
      {showDetails && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Campaign Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Campaign Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Title:</span> {selectedCampaign.title}</p>
                      <p><span className="font-medium">Organizer:</span> {selectedCampaign.organizer}</p>
                      <p><span className="font-medium">Email:</span> {selectedCampaign.email}</p>
                      <p><span className="font-medium">County:</span> {selectedCampaign.county}</p>
                      <p><span className="font-medium">Location:</span> {selectedCampaign.location}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Date:</span> {new Date(selectedCampaign.event_date).toLocaleDateString()}</p>
                      <p><span className="font-medium">Time:</span> {selectedCampaign.event_time}</p>
                      <p><span className="font-medium">Goal:</span> €{selectedCampaign.goal_amount.toLocaleString()}</p>
                      <p><span className="font-medium">Raised:</span> €{selectedCampaign.raised_amount.toLocaleString()}</p>
                      <p><span className="font-medium">Status:</span> {getStatusBadge(selectedCampaign)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Campaign Story</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedCampaign.story}</p>
                </div>

                <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                  {!selectedCampaign.is_approved && selectedCampaign.is_active && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedCampaign.id);
                          setShowDetails(false);
                        }}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve Campaign</span>
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedCampaign.id);
                          setShowDetails(false);
                        }}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject Campaign</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowDetails(false)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}