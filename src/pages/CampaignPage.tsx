import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { campaignService } from '../services/campaignService';
import { Campaign } from '../types';
import CampaignDetail from '../components/CampaignDetail';

interface CampaignPageProps {
  onDonate: (campaign: Campaign) => void;
}

export default function CampaignPage({ onDonate }: CampaignPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) {
        setError('Campaign ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await campaignService.getCampaignById(id);

        if (data) {
          setCampaign(data);
        } else {
          setError('Campaign not found');
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
        setError('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id]);

  const handleClose = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a8846d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Campaign Not Found</h3>
            <p className="text-red-700 text-sm mb-4">{error || 'This campaign does not exist or has been removed.'}</p>
            <button
              onClick={handleClose}
              className="bg-[#a8846d] text-white px-6 py-2 rounded-full hover:bg-[#96785f] transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleClose}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <CampaignDetail
        campaign={campaign}
        onClose={handleClose}
        onDonate={onDonate}
        isPage={true}
      />
    </div>
  );
}
