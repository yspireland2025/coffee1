import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, MapPin, Calendar, Target, Users } from 'lucide-react';
import CampaignCard from './CampaignCard';
import CampaignDetail from './CampaignDetail';
import DonationModal from './DonationModal';
import { Campaign } from '../types';
import { irishCounties } from '../data/counties';
import { campaignService } from '../services/campaignService';

interface CampaignsPageProps {
  campaigns: Campaign[];
  onBack: () => void;
}

export default function CampaignsPage({ campaigns, onBack }: CampaignsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'progress' | 'goal' | 'ending_soon'>('newest');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const handleDonate = (campaign: Campaign) => {
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

  // Get unique counties from campaigns
  const campaignCounties = useMemo(() => {
    const counties = campaigns.map(campaign => {
      // Extract county from location string (assuming format like "Community Centre, Cork")
      const locationParts = campaign.location.split(',');
      return locationParts[locationParts.length - 1]?.trim() || 'Unknown';
    });
    return [...new Set(counties)].sort();
  }, [campaigns]);

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.story.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by county
    if (selectedCounty) {
      filtered = filtered.filter(campaign =>
        campaign.location.toLowerCase().includes(selectedCounty.toLowerCase())
      );
    }

    // Sort campaigns
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'progress':
          const progressA = (a.raisedAmount / a.goalAmount) * 100;
          const progressB = (b.raisedAmount / b.goalAmount) * 100;
          return progressB - progressA;
        case 'goal':
          return b.goalAmount - a.goalAmount;
        case 'ending_soon':
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [campaigns, searchTerm, selectedCounty, sortBy]);

  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raisedAmount, 0);
  const averageProgress = campaigns.length > 0 
    ? campaigns.reduce((sum, campaign) => sum + (campaign.raisedAmount / campaign.goalAmount), 0) / campaigns.length * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">All Coffee Morning Campaigns</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-900">{campaigns.length}</span>
              </div>
              <p className="text-green-700 text-sm">Active Campaigns</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-900">€{totalRaised.toLocaleString()}</span>
              </div>
              <p className="text-green-700 text-sm">Total Raised</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-900">{Math.round(averageProgress)}%</span>
              </div>
              <p className="text-green-700 text-sm">Average Progress</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-900">{campaignCounties.length}</span>
              </div>
              <p className="text-green-700 text-sm">Counties Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Campaigns
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, organizer, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* County Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by County
              </label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Counties</option>
                {campaignCounties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="progress">Highest Progress</option>
                <option value="goal">Largest Goal</option>
                <option value="ending_soon">Event Date (Soonest)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedCounty) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedCounty && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    County: {selectedCounty}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCounty('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xs underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredAndSortedCampaigns.length} of {campaigns.length} campaigns
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedCounty && ` in ${selectedCounty}`}
          </p>
        </div>

        {/* Campaigns Grid */}
        {filteredAndSortedCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onViewCampaign={handleViewCampaign}
                onDonate={handleDonate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCounty
                ? "Try adjusting your search criteria or filters"
                : "There are no active campaigns at the moment"}
            </p>
            <div className="space-x-4">
              {(searchTerm || selectedCounty) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCounty('');
                  }}
                  className="border-2 border-[#a8846d] text-[#a8846d] px-6 py-3 rounded-full hover:bg-[#a8846d] hover:text-white transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={onBack}
                className="bg-[#a8846d] text-white px-6 py-3 rounded-full hover:bg-[#96785f] transition-colors font-medium"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {showCampaignDetail && selectedCampaign && (
        <CampaignDetail
          campaign={selectedCampaign}
          onClose={() => setShowCampaignDetail(false)}
          onDonate={handleDonate}
        />
      )}

      {/* Donation Modal */}
      {showDonationModal && selectedCampaign && (
        <DonationModal
          campaign={selectedCampaign}
          onClose={() => setShowDonationModal(false)}
          onDonate={handleDonationSubmit}
        />
      )}
    </div>
  );
}