import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Campaign } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      console.log('useCampaigns: Starting to fetch campaigns from API...');
      
      const data = await apiService.getCampaigns();

      console.log('useCampaigns: Campaigns from API:', data);
      console.log('useCampaigns: Number of campaigns found:', data?.length || 0);

      const formattedCampaigns: Campaign[] = data.map((campaign: any) => ({
        id: campaign.id.toString(),
        campaign_number: campaign.campaign_number,
        title: campaign.title,
        organizer: campaign.organizer,
        story: campaign.story,
        goalAmount: campaign.goal_amount,
        raisedAmount: campaign.raised_amount || 0,
        eventDate: campaign.event_date,
        eventTime: campaign.event_time,
        location: campaign.location,
        image: campaign.image || 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
        socialLinks: typeof campaign.social_links === 'string' ? JSON.parse(campaign.social_links) : (campaign.social_links || {}),
        createdAt: campaign.created_at,
        isActive: campaign.is_active,
        isApproved: campaign.is_approved
      }));

      console.log('useCampaigns: Formatted campaigns:', formattedCampaigns);
      setCampaigns(formattedCampaigns);
    } catch (err) {
      console.error('useCampaigns: Error in fetchCampaigns:', err);
      
      // Check if it's a network error and we haven't exceeded retry limit
      const isNetworkError = err instanceof TypeError && err.message.includes('NetworkError');
      
      if (isNetworkError && retryCount < MAX_RETRIES) {
        console.log(`useCampaigns: Network error, retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY);
        return fetchCampaigns(retryCount + 1);
      }
      
      // Set appropriate error message
      if (isNetworkError) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();

  }, []);

  return { campaigns, loading, error, refetch: fetchCampaigns };
}