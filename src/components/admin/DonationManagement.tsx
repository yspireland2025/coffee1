import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Download, DollarSign, Calendar,
  TrendingUp, Users, CreditCard, RefreshCw, AlertCircle
} from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { supabase } from '../../lib/supabase';

interface Donation {
  id: string;
  campaign_id: string;
  campaign_title: string;
  amount: number;
  donor_name: string | null;
  donor_email: string | null;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  payment_status: 'completed' | 'pending' | 'failed';
}

export default function DonationManagement() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load donations from localStorage (demo donations) and database
  useEffect(() => {
    const loadDonations = async () => {
      try {
        setLoading(true);
        
        console.log('Loading donations from Supabase...');
        
        // Get donations from Supabase database
        const { data: supabaseDonations, error } = await supabase
          .from('donations')
          .select(`
            *,
            campaigns!inner(title)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading donations from Supabase:', error);
        }
        
        console.log('Supabase donations:', supabaseDonations);
        
        // Convert Supabase donations to admin format
        const realDonations: Donation[] = supabaseDonations ? supabaseDonations.map((donation: any) => ({
          id: donation.id,
          campaign_id: donation.campaign_id,
          campaign_title: donation.campaigns?.title || 'Unknown Campaign',
          amount: donation.amount, // Already in cents from database
          donor_name: donation.donor_name,
          donor_email: donation.donor_email,
          message: donation.message,
          is_anonymous: donation.is_anonymous,
          created_at: donation.created_at,
          payment_status: 'completed'
        })) : [];
        
        // Also get donations from localStorage (for backward compatibility)
        const storedDonations = localStorage.getItem('demo_donations');
        let demoDonations: Donation[] = [];
        
        console.log('Loading demo donations from localStorage:', storedDonations);
        
        if (storedDonations) {
          const parsed = JSON.parse(storedDonations);
          demoDonations = parsed.map((donation: any) => ({
            id: donation.id,
            campaign_id: donation.campaignId,
            campaign_title: donation.campaignTitle || 'Unknown Campaign',
            amount: Math.round((donation.amount || 0) * 100), // Convert to cents
            donor_name: donation.isAnonymous ? null : donation.donorName,
            donor_email: donation.donorEmail,
            message: donation.message,
            is_anonymous: donation.isAnonymous || false,
            created_at: donation.createdAt || new Date().toISOString(),
            payment_status: 'completed'
          }));
        }
        
        // Combine real donations from Supabase with demo donations
        const allDonations = [...realDonations, ...demoDonations];
        
        console.log('Processed donations:', allDonations);
        
        // Sort by creation date (newest first)
        allDonations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setDonations(allDonations);
        setFilteredDonations(allDonations);
      } catch (error) {
        console.error('Error loading donations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDonations();
    
    // Listen for storage changes (demo donations)
    const handleStorageChange = () => {
      loadDonations();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events when donations are made
    const handleNewDonation = () => {
      console.log('New donation event received, reloading...');
      setTimeout(loadDonations, 100); // Small delay to ensure localStorage is updated
    };
    
    window.addEventListener('donationCompleted', handleNewDonation);
    
    // Set up real-time subscription for Supabase donations
    const subscription = supabase
      .channel('donations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'donations' },
        () => {
          console.log('Donation change detected in Supabase, reloading...');
          loadDonations();
        }
      )
      .subscribe();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('donationCompleted', handleNewDonation);
      subscription.unsubscribe();
    };
  }, []);

  // Filter donations based on search and filters
  useEffect(() => {
    let filtered = donations;

    if (searchTerm) {
      filtered = filtered.filter(donation =>
        donation.campaign_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donation.donor_name && donation.donor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (donation.donor_email && donation.donor_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(donation => donation.payment_status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (dateFilter === '7d') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === '30d') {
        filterDate.setDate(now.getDate() - 30);
      } else if (dateFilter === '90d') {
        filterDate.setDate(now.getDate() - 90);
      }
      
      filtered = filtered.filter(donation => new Date(donation.created_at) >= filterDate);
    }

    setFilteredDonations(filtered);
  }, [donations, searchTerm, statusFilter, dateFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Completed</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Failed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Unknown</span>;
    }
  };

  const formatAmount = (amountInCents: number) => {
    return `€${(amountInCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const totalDonations = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const completedDonations = filteredDonations.filter(d => d.payment_status === 'completed');
  const totalCompleted = completedDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const avgDonationAmount = completedDonations.length > 0 ? totalCompleted / completedDonations.length : 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search donations..."
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

    {loading ? (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading donations...</p>
        </div>
      </div>
    ) : (
      <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredDonations.length}</p>
              <p className="text-gray-600 text-sm">Total Donations</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(totalCompleted)}</p>
              <p className="text-gray-600 text-sm">Total Raised</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(avgDonationAmount)}</p>
              <p className="text-gray-600 text-sm">Average Donation</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredDonations.filter(d => d.payment_status === 'pending').length}
              </p>
              <p className="text-gray-600 text-sm">Pending</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 min-w-[150px]">Donation</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden sm:table-cell">Campaign</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden md:table-cell">Donor</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Amount</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden lg:table-cell">Status</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden lg:table-cell">Date</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-3 sm:px-6">
                    <div>
                      <p className="font-medium text-gray-900">#{donation.id.slice(0, 8)}</p>
                      {donation.message && (
                        <p className="text-xs text-gray-500 truncate max-w-xs">{donation.message}</p>
                      )}
                      <div className="sm:hidden mt-1 space-y-1">
                        <p className="text-xs text-gray-600 truncate">{donation.campaign_title}</p>
                        <p className="text-xs text-gray-600">
                          {donation.is_anonymous ? 'Anonymous' : donation.donor_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden sm:table-cell">
                    <p className="font-medium text-gray-900 truncate max-w-xs">{donation.campaign_title}</p>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden md:table-cell">
                    <div>
                      <p className="font-medium text-gray-900">
                        {donation.is_anonymous ? 'Anonymous' : donation.donor_name || 'Unknown'}
                      </p>
                      {!donation.is_anonymous && donation.donor_email && (
                        <p className="text-sm text-gray-500">{donation.donor_email}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6">
                    <span className="font-bold text-gray-900">{formatAmount(donation.amount)}</span>
                    <div className="lg:hidden mt-1">
                      {getStatusBadge(donation.payment_status)}
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden lg:table-cell">
                    {getStatusBadge(donation.payment_status)}
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden lg:table-cell">
                    <span className="text-gray-600 text-sm">{formatDate(donation.created_at)}</span>
                  </td>
                  <td className="py-4 px-3 sm:px-6">
                    <button
                      onClick={() => {
                        setSelectedDonation(donation);
                        setShowDetails(true);
                      }}
                      className="bg-blue-100 text-blue-700 p-1.5 sm:p-2 rounded-lg hover:bg-blue-200 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation Details Modal */}
      {showDetails && selectedDonation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Donation Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Eye className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Donation Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Donation ID</p>
                        <p className="text-sm text-gray-600">#{selectedDonation.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatAmount(selectedDonation.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        {getStatusBadge(selectedDonation.payment_status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedDonation.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Donor Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Name</p>
                        <p className="text-sm text-gray-600">
                          {selectedDonation.is_anonymous ? 'Anonymous Donor' : selectedDonation.donor_name || 'Not provided'}
                        </p>
                      </div>
                      {!selectedDonation.is_anonymous && selectedDonation.donor_email && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{selectedDonation.donor_email}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">Privacy</p>
                        <p className="text-sm text-gray-600">
                          {selectedDonation.is_anonymous ? 'Anonymous donation' : 'Public donation'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Campaign</h3>
                  <p className="text-gray-700">{selectedDonation.campaign_title}</p>
                </div>

                {selectedDonation.message && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Message</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700 italic">"{selectedDonation.message}"</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
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
      </>
    )}
    </div>
  );
}