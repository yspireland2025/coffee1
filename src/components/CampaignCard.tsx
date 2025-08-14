import React from 'react';
import { Calendar, MapPin, Users, Share2, ExternalLink } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignCardProps {
  campaign: Campaign;
  onViewCampaign: (campaign: Campaign) => void;
  onDonate: (campaign: Campaign) => void;
}

export default function CampaignCard({ campaign, onViewCampaign, onDonate }: CampaignCardProps) {
  const progressPercentage = (campaign.raisedAmount / campaign.goalAmount) * 100;
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.story.substring(0, 100) + '...',
        url: window.location.href
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative">
        <img
          src={campaign.image}
          alt={campaign.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4">
          <button
            onClick={handleShare}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
          >
            <Share2 className="h-4 w-4 text-gray-700" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-gray-900">
            €{campaign.raisedAmount.toLocaleString()} raised
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{campaign.title}</h3>
            <p className="text-gray-600">by {campaign.organizer}</p>
          </div>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-3">{campaign.story}</p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(campaign.eventDate)} at {campaign.eventTime}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{campaign.location}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              €{campaign.raisedAmount.toLocaleString()} of €{campaign.goalAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onViewCampaign(campaign)}
            className="flex-1 border-2 border-[#a8846d] text-[#a8846d] px-4 py-2 rounded-full hover:bg-[#a8846d] hover:text-white transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <span>View Campaign</span>
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDonate(campaign);
            }}
            className="flex-1 bg-[#a8846d] text-white px-4 py-2 rounded-full hover:bg-[#96785f] transition-colors font-medium"
          >
            Donate Now
          </button>
        </div>
      </div>
    </div>
  );
}