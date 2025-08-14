import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Coffee, DollarSign, Calendar,
  MapPin, Clock, AlertTriangle, CheckCircle, Eye, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

export default function AdminMetrics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadAllCampaigns = async () => {
      try {
        setLoading(true);
        
        // Get campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (campaignsError) {
          console.error('Error loading campaigns for metrics:', campaignsError);
          throw campaignsError;
        }

        // Get all donations to calculate actual raised amounts
        // Get donations from Supabase
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('campaign_id, amount');

        if (donationsError) {
          console.error('Error loading donations for metrics:', donationsError);
        }

        // Also get donations from localStorage (demo donations)
        const storedDonations = localStorage.getItem('demo_donations');
        let demoDonations: any[] = [];
        if (storedDonations) {
          demoDonations = JSON.parse(storedDonations);
        }

        // Combine all donations for total calculations
        const allDonationsForTotal = [
          ...(donationsData || []).map(d => ({ amount: d.amount })), // Supabase donations (in cents)
          ...demoDonations.map(d => ({ amount: Math.round((d.amount || 0) * 100) })) // Demo donations (convert to cents)
        ];
        setDonations(allDonationsForTotal);

        // Calculate raised amounts per campaign from actual donations
        const raisedAmounts: Record<string, number> = {};
        if (donationsData) {
          donationsData.forEach(donation => {
            if (!raisedAmounts[donation.campaign_id]) {
              raisedAmounts[donation.campaign_id] = 0;
            }
            raisedAmounts[donation.campaign_id] += donation.amount; // amount is in cents
          });
        }

        // Also add demo donations to campaign totals
        demoDonations.forEach(donation => {
          const campaignId = donation.campaignId;
          if (campaignId) {
            if (!raisedAmounts[campaignId]) {
              raisedAmounts[campaignId] = 0;
            }
            raisedAmounts[campaignId] += Math.round((donation.amount || 0) * 100); // Convert to cents
          }
        });

        const metricsData = campaignsData.map(campaign => ({
          id: campaign.id,
          title: campaign.title,
          organizer: campaign.organizer,
          location: campaign.location,
          raisedAmount: Math.round((raisedAmounts[campaign.id] || 0) / 100), // Convert cents to euros
          isActive: campaign.is_active,
          isApproved: campaign.is_approved,
          createdAt: campaign.created_at
        }));

        setCampaigns(metricsData);

        // Load users
        const storedUsers = localStorage.getItem('demo_users') || '[]';
        setUsers(JSON.parse(storedUsers));
      } catch (error) {
        console.error('Error loading campaigns for metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllCampaigns();

    const subscription = supabase
      .channel('admin_metrics')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'campaigns' },
        () => {
          loadAllCampaigns();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.isActive && c.isApproved).length;
  const pendingCampaigns = campaigns.filter(c => !c.isApproved && c.isActive).length;
  const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0); // Keep in cents, convert for display
  const avgDonation = donations.length > 0 ? totalDonations / donations.length : 0;
  const totalUsers = users.length + 3;

  const metrics: MetricCard[] = [
    {
      title: 'Total Campaigns',
      value: totalCampaigns.toString(),
      change: '+0%',
      trend: 'neutral',
      icon: Coffee,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Users',
      value: totalUsers.toString(),
      change: '+0%',
      trend: 'neutral',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Total Donations',
      value: `€${(totalDonations / 100).toLocaleString()}`,
      change: '+0%',
      trend: 'neutral',
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: 'Avg. Donation',
      value: `€${(avgDonation / 100).toLocaleString()}`,
      change: '+0%',
      trend: 'neutral',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  const recentActivity = [
    ...donations.slice(0, 3).map((donation, index) => ({
      id: `donation-${index}`,
      type: 'donation',
      action: 'Donation received',
      user: donation.isAnonymous ? 'Anonymous' : donation.donorName || 'Unknown',
      time: new Date(donation.createdAt).toLocaleString(),
      status: 'completed'
    })),
    ...campaigns.slice(0, 2).map((campaign, index) => ({
      id: `campaign-${index}`,
      type: 'campaign',
      action: campaign.isApproved ? 'Campaign approved' : 'New campaign created',
      user: campaign.organizer,
      time: new Date(campaign.createdAt).toLocaleString(),
      status: campaign.isApproved ? 'approved' : 'pending'
    }))
  ].slice(0, 5);

  const campaignsByCounty = campaigns
    .filter(campaign => campaign.isActive && campaign.isApproved)
    .reduce((acc: any[], campaign) => {
    const county = campaign.location.split(',').pop()?.trim() || 'Unknown';
    const existing = acc.find(item => item.county === county);
    
    if (existing) {
      existing.campaigns += 1;
      existing.raised += campaign.raisedAmount;
    } else {
      acc.push({
        county,
        campaigns: 1,
        raised: campaign.raisedAmount
      });
    }
    
    return acc;
  }, []).sort((a, b) => b.campaigns - a.campaigns);

  const pendingApprovals = campaigns
    .filter(c => !c.isApproved && c.isActive)
    .slice(0, 10)
    .map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      organizer: campaign.organizer,
      submitted: new Date(campaign.createdAt).toLocaleString(),
      county: campaign.location.split(',').pop()?.trim() || 'Unknown'
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`${metric.color} p-3 rounded-xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="h-4 w-4" />
                  <span>{metric.change}</span>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h4>
              <p className="text-gray-600 text-sm">{metric.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-full ${
                  activity.type === 'campaign' ? 'bg-blue-100' :
                  activity.type === 'donation' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {activity.type === 'campaign' && <Coffee className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'donation' && <DollarSign className="h-4 w-4 text-green-600" />}
                  {activity.type === 'user' && <Users className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                  activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  activity.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Campaigns by County</h4>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Map
            </button>
          </div>
          <div className="space-y-4">
            {campaignsByCounty.length > 0 ? (
              campaignsByCounty.map((county, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{county.county}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{county.campaigns} campaigns</p>
                  <p className="text-xs text-gray-500">€{county.raised.toLocaleString()} raised</p>
                </div>
              </div>
            ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No campaigns yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h4 className="text-lg font-semibold text-gray-900">Pending Campaign Approvals</h4>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
              {pendingApprovals.length} pending
            </span>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Review All
          </button>
        </div>
        {pendingApprovals.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Campaign</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Organizer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">County</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Submitted</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{campaign.title}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{campaign.organizer}</td>
                  <td className="py-3 px-4 text-gray-600">{campaign.county}</td>
                  <td className="py-3 px-4 text-gray-600">{campaign.submitted}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors text-sm">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Approve
                      </button>
                      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        <Eye className="h-4 w-4 inline mr-1" />
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No campaigns pending approval</p>
          </div>
        )}
      </div>
    </div>
  );
}