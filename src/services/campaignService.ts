import { supabase } from '../lib/supabase';

export const campaignService = {
  async getCampaignById(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('is_approved', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createCampaign(campaignData: any, userId?: string) {
    console.log('campaignService.createCampaign called with:', campaignData);

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
        pack_payment_status: 'pending',
        user_id: userId || campaignData.userId
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async createDonation(donationData: {
    campaignId: string;
    amount: number;
    donorName?: string;
    donorEmail?: string;
    message?: string;
    isAnonymous?: boolean;
  }) {
    console.log('Creating donation in Supabase:', donationData);
    
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
  },

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
  },

  async updateCampaign(campaignId: string, updates: any) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select();

    if (error) throw error;
    return data;
  },

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
  },

  async approveCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ is_approved: true })
      .eq('id', campaignId)
      .select();

    if (error) throw error;
    return data;
  },

  async rejectCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ is_approved: false, is_active: false })
      .eq('id', campaignId)
      .select();

    if (error) throw error;
    return data;
  },

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
};