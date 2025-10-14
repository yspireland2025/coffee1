import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, Share2, Facebook, Twitter, Instagram, MessageCircle, X, Users, Target, Mail, Link as LinkIcon, Download, Copy, Check } from 'lucide-react';
import { Campaign } from '../types';
import { supabase } from '../lib/supabase';
import MessageHostModal from './MessageHostModal';
import QRCode from 'qrcode';

interface CampaignDetailProps {
  campaign: Campaign;
  onClose: () => void;
  onDonate: (campaign: Campaign) => void;
  isPage?: boolean;
}

export default function CampaignDetail({ campaign, onClose, onDonate, isPage = false }: CampaignDetailProps) {
  const [actualRaisedAmount, setActualRaisedAmount] = useState(campaign.raisedAmount);
  const [loading, setLoading] = useState(true);
  const [showMessageHost, setShowMessageHost] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const progressPercentage = (actualRaisedAmount / campaign.goalAmount) * 100;
  const campaignUrl = `${window.location.origin}/campaign/${campaign.id}`;

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(campaignUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [campaignUrl]);

  useEffect(() => {
    const calculateActualRaised = async () => {
      try {
        setLoading(true);
        
        // Get all donations for this campaign
        const { data: donations, error } = await supabase
          .from('donations')
          .select('amount')
          .eq('campaign_id', campaign.id);
        
        if (error) {
          console.error('Error loading donations for campaign:', error);
          return;
        }
        
        // Calculate total (amounts are stored in cents, convert to euros)
        const total = donations.reduce((sum, donation) => sum + donation.amount, 0) / 100;
        setActualRaisedAmount(total);
      } catch (error) {
        console.error('Error calculating actual raised amount:', error);
      } finally {
        setLoading(false);
      }
    };
    
    calculateActualRaised();
    
    // Set up real-time subscription for donation changes
    const subscription = supabase
      .channel(`campaign_${campaign.id}_donations`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'donations',
          filter: `campaign_id=eq.${campaign.id}`
        },
        () => {
          calculateActualRaised();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [campaign.id]);
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const socialIcons = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    whatsapp: MessageCircle
  };

  const handleShare = (platform?: string) => {
    const shareData = {
      title: campaign.title,
      text: `Support ${campaign.organizer}'s coffee morning for Youth Suicide Prevention Ireland`,
      url: campaignUrl
    };

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`);
    } else if (navigator.share) {
      navigator.share(shareData);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${campaign.title.replace(/[^a-z0-9]/gi, '_')}_QR_Code.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const containerClass = isPage
    ? "bg-white"
    : "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4";

  const contentClass = isPage
    ? "max-w-4xl mx-auto"
    : "bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        <div className="relative">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-64 lg:h-80 object-cover"
          />
          {!isPage && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
          )}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `€${actualRaisedAmount.toLocaleString()}`}
                </p>
                <p className="text-sm text-gray-600">of €{campaign.goalAmount.toLocaleString()} goal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
              <p className="text-lg text-gray-600 mb-6">Organized by {campaign.organizer}</p>

              {/* Mobile Donation Section - Show at top on mobile */}
              <div className="lg:hidden mb-8">
                <div className="bg-green-50 rounded-2xl p-6">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Total Raised</p>
                    <p className="text-3xl font-bold text-green-900">
                      {loading ? '...' : `€${actualRaisedAmount.toLocaleString()}`}
                    </p>
                    <p className="text-sm text-gray-600">of €{campaign.goalAmount.toLocaleString()} goal</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDonate(campaign)}
                    className="w-full bg-green-700 text-white px-6 py-4 rounded-2xl hover:bg-green-800 transition-colors font-semibold text-lg mb-4"
                  >
                    Donate Now
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-700" />
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p className="text-gray-600">{formatDate(campaign.eventDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-green-700" />
                    <div>
                      <p className="font-medium text-gray-900">Time</p>
                      <p className="text-gray-600">{campaign.eventTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-green-700" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600">{campaign.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => setShowMessageHost(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 self-start"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Message Host</span>
                    </button>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      You can use this button to contact the Coffee Morning Host about any questions or concerns you might have. 
                      You can also use this button to notify your attendance or cancel your attendance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Our Story</h2>
                <div className="prose prose-lg text-gray-700">
                  <p>{campaign.story}</p>
                </div>
              </div>

              {Object.keys(campaign.socialLinks).length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Connect With Us</h2>
                  <div className="flex space-x-4">
                    {Object.entries(campaign.socialLinks).map(([platform, url]) => {
                      const Icon = socialIcons[platform as keyof typeof socialIcons];
                      if (!Icon || !url) return null;
                      
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-colors"
                        >
                          <Icon className="h-5 w-5 text-gray-700" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 lg:block hidden">
              <div className="bg-green-50 rounded-2xl p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Total Raised</p>
                  <p className="text-3xl font-bold text-green-900">
                    {loading ? '...' : `€${actualRaisedAmount.toLocaleString()}`}
                  </p>
                  <p className="text-sm text-gray-600">of €{campaign.goalAmount.toLocaleString()} goal</p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => onDonate(campaign)}
                  className="w-full bg-[#a8846d] text-white px-6 py-4 rounded-2xl hover:bg-[#96785f] transition-colors font-semibold text-lg mb-4"
                >
                  Donate Now
                </button>

                <div className="border-t border-green-200 pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Share this campaign</h3>

                  {/* Campaign URL */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <LinkIcon className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Campaign URL</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={campaignUrl}
                        readOnly
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-700"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="mb-4">
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center">
                        <img
                          src={qrCodeUrl}
                          alt="Campaign QR Code"
                          className="mx-auto mb-2"
                          style={{ width: '150px', height: '150px' }}
                        />
                        <button
                          onClick={handleDownloadQR}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 mx-auto"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download QR Code</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Social Share Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Facebook className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex-1 bg-sky-500 text-white p-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center"
                    >
                      <Twitter className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShare()}
                      className="flex-1 bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-6 w-6 text-amber-600" />
                  <h3 className="font-bold text-gray-900">About Youth Suicide Prevention Ireland</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Youth Suicide Prevention Ireland works tirelessly to prevent youth suicide through
                  education, support, and community engagement.
                </p>
                <a
                  href="#about"
                  className="text-amber-700 hover:text-amber-800 font-medium text-sm"
                >
                  Learn more about our mission →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Message Host Modal */}
      {showMessageHost && (
        <MessageHostModal
          campaign={campaign}
          onClose={() => setShowMessageHost(false)}
        />
      )}
    </div>
  );
}