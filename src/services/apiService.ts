import { supabase } from '../lib/supabase';

const handleSupabaseError = (error: any, operation: string) => {
  console.error(`ApiService ${operation} error:`, error);
  
  // Check for network errors
  if (error instanceof TypeError && error.message.includes('NetworkError')) {
    throw new Error('Network connection failed. Please check your internet connection.');
  }
  
  // Check for Supabase-specific errors
  if (error?.message) {
    throw new Error(error.message);
  }
  
  throw new Error(`Failed to ${operation.toLowerCase()}`);
};

class ApiService {
  // Auth methods
  async register(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      return { user: data.user };
    } catch (error) {
      handleSupabaseError(error, 'register user');
    }
  }

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { user: data.user };
    } catch (error) {
      handleSupabaseError(error, 'login user');
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return {};
    } catch (error) {
      handleSupabaseError(error, 'logout user');
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user };
    } catch (error) {
      handleSupabaseError(error, 'get current user');
    }
  }

  // Campaign methods
  async getCampaigns() {
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Get all donations to calculate actual raised amounts
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('campaign_id, amount');

      if (donationsError) {
        console.error('Error loading donations for campaign totals:', donationsError);
        // Continue without donations data if there's an error
      }

      // Calculate raised amounts per campaign
      const raisedAmounts: Record<string, number> = {};
      if (donationsData) {
        donationsData.forEach(donation => {
          if (!raisedAmounts[donation.campaign_id]) {
            raisedAmounts[donation.campaign_id] = 0;
          }
          raisedAmounts[donation.campaign_id] += donation.amount; // amount is in cents
        });
      }

      // Update campaigns with actual raised amounts
      const campaignsWithActualTotals = campaignsData.map(campaign => ({
        ...campaign,
        raised_amount: Math.round((raisedAmounts[campaign.id] || 0) / 100), // convert cents to euros
        actual_raised_amount: Math.round((raisedAmounts[campaign.id] || 0) / 100) // ensure we have the real amount
      }));

      return campaignsWithActualTotals;
    } catch (error) {
      handleSupabaseError(error, 'fetch campaigns');
    }
  }

  async getAllCampaigns() {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (campaignsError) throw campaignsError;

    // Get all donations to calculate actual raised amounts
    const { data: donationsData, error: donationsError } = await supabase
      .from('donations')
      .select('campaign_id, amount');

    if (donationsError) {
      console.error('Error loading donations for campaign totals:', donationsError);
      // Continue without donations data if there's an error
    }

    // Calculate raised amounts per campaign
    const raisedAmounts: Record<string, number> = {};
    if (donationsData) {
      donationsData.forEach(donation => {
        if (!raisedAmounts[donation.campaign_id]) {
          raisedAmounts[donation.campaign_id] = 0;
        }
        raisedAmounts[donation.campaign_id] += donation.amount; // amount is in cents
      });
    }

    // Update campaigns with actual raised amounts
    const campaignsWithActualTotals = campaignsData.map(campaign => ({
      ...campaign,
      raised_amount: Math.round((raisedAmounts[campaign.id] || 0) / 100) // convert cents to euros
    }));

    return campaignsWithActualTotals;
  }

  async getUserCampaigns(userId: string) {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (campaignsError) throw campaignsError;

    // Get all donations to calculate actual raised amounts
    const { data: donationsData, error: donationsError } = await supabase
      .from('donations')
      .select('campaign_id, amount');

    if (donationsError) {
      console.error('Error loading donations for user campaign totals:', donationsError);
      // Continue without donations data if there's an error
    }

    // Calculate raised amounts per campaign
    const raisedAmounts: Record<string, number> = {};
    if (donationsData) {
      donationsData.forEach(donation => {
        if (!raisedAmounts[donation.campaign_id]) {
          raisedAmounts[donation.campaign_id] = 0;
        }
        raisedAmounts[donation.campaign_id] += donation.amount; // amount is in cents
      });
    }

    // Update campaigns with actual raised amounts
    const campaignsWithActualTotals = campaignsData.map(campaign => ({
      ...campaign,
      raised_amount: Math.round((raisedAmounts[campaign.id] || 0) / 100) // convert cents to euros
    }));

    return campaignsWithActualTotals;
  }

  async createCampaign(campaignData: any) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        title: campaignData.title,
        organizer: campaignData.organizer,
        email: campaignData.email,
        county: campaignData.county,
        eircode: campaignData.eircode,
        story: campaignData.story,
        goal_amount: campaignData.goalAmount,
        raised_amount: 0,
        event_date: campaignData.eventDate,
        event_time: campaignData.eventTime,
        location: campaignData.location,
        image: campaignData.image || 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
        social_links: campaignData.socialLinks || {},
        is_active: true,
        is_approved: false,
        user_id: campaignData.userId
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async updateCampaign(campaignId: string, updates: any) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select();

    if (error) throw error;
    return data;
  }

  async approveCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ is_approved: true })
      .eq('id', campaignId)
      .select();

    if (error) throw error;
    return data;
  }

  async rejectCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ is_approved: false, is_active: false })
      .eq('id', campaignId)
      .select();

    if (error) throw error;
    return data;
  }

  // Donation methods
  async createDonation(donationData: any) {
    const { data, error } = await supabase
      .from('donations')
      .insert([{
        campaign_id: donationData.campaignId,
        amount: Math.round(donationData.amount * 100), // Convert to cents
        donor_name: donationData.isAnonymous ? null : donationData.donorName,
        donor_email: donationData.donorEmail,
        message: donationData.message,
        is_anonymous: donationData.isAnonymous || false
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async getDonations() {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        campaigns!inner(title)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export const apiService = new ApiService();