import { supabase } from '../lib/supabase';

export interface PackOrder {
  id: string;
  campaign_id: string;
  user_id: string | null;
  amount: number;
  pack_type: 'free' | 'medium' | 'large';
  tshirt_sizes: {
    shirt_1?: string;
    shirt_2?: string;
    shirt_3?: string;
    shirt_4?: string;
  } | null;
  payment_status: 'pending' | 'completed' | 'failed';
  stripe_payment_intent_id: string | null;
  stripe_payment_link_id: string | null;
  shipping_address: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    county: string;
    eircode: string;
    country: string;
  };
  mobile_number: string;
  created_at: string;
  paid_at: string | null;
}

export interface CreatePackOrderData {
  campaignId: string;
  userId?: string;
  packType: 'free' | 'medium' | 'large';
  amount: number;
  tshirtSizes?: {
    shirt_1?: string;
    shirt_2?: string;
    shirt_3?: string;
    shirt_4?: string;
  } | null;
  shippingAddress: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    county: string;
    eircode: string;
    country: string;
  };
  mobileNumber: string;
}

class PackOrderService {
  async createPackOrder(orderData: CreatePackOrderData): Promise<{ data?: PackOrder; error?: string }> {
    try {
      console.log('Creating pack order:', orderData);
      
      const { data, error } = await supabase
        .from('pack_orders')
        .insert([{
          campaign_id: orderData.campaignId,
          user_id: orderData.userId || null,
          amount: orderData.amount, // Amount in cents
          pack_type: orderData.packType,
          tshirt_sizes: orderData.tshirtSizes,
          payment_status: 'pending',
          shipping_address: orderData.shippingAddress,
          mobile_number: orderData.mobileNumber
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating pack order:', error);
        throw error;
      }

      console.log('Pack order created successfully:', data);

      // Update campaign with pack_order_id
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ pack_order_id: data.id })
        .eq('id', orderData.campaignId);

      if (updateError) {
        console.error('Error linking pack order to campaign:', updateError);
        // Don't fail the whole operation, just log it
      } else {
        console.log('Campaign updated with pack_order_id:', data.id);
      }

      return { data };
    } catch (error) {
      console.error('Pack order service error:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to create pack order'
      };
    }
  }

  async updatePackOrderPayment(
    orderId: string, 
    paymentData: {
      payment_status: 'completed' | 'failed';
      stripe_payment_intent_id?: string;
      stripe_payment_link_id?: string;
    }
  ): Promise<{ error?: string }> {
    try {
      const updateData: any = {
        payment_status: paymentData.payment_status,
        stripe_payment_intent_id: paymentData.stripe_payment_intent_id,
        stripe_payment_link_id: paymentData.stripe_payment_link_id
      };

      if (paymentData.payment_status === 'completed') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pack_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // If payment completed, update campaign pack payment status
      if (paymentData.payment_status === 'completed') {
        const { error: campaignError } = await supabase
          .from('campaigns')
          .update({ pack_payment_status: 'completed' })
          .eq('pack_order_id', orderId);

        if (campaignError) {
          console.error('Error updating campaign pack status:', campaignError);
        }
      }

      return {};
    } catch (error) {
      console.error('Error updating pack order payment:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to update pack order' 
      };
    }
  }

  async getPackOrder(orderId: string): Promise<{ data?: PackOrder; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pack_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching pack order:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to fetch pack order' 
      };
    }
  }

  async getUserPackOrders(userId: string): Promise<{ data?: PackOrder[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pack_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching user pack orders:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to fetch pack orders' 
      };
    }
  }

  async getAllPackOrders(): Promise<{ data?: (PackOrder & { campaign_title: string; organizer_name: string })[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pack_orders')
        .select(`
          *,
          campaigns!inner(title, organizer)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the response for admin view
      const formattedData = data.map(item => ({
        id: item.id,
        campaign_id: item.campaign_id,
        user_id: item.user_id,
        amount: item.amount,
        payment_status: item.payment_status,
        stripe_payment_intent_id: item.stripe_payment_intent_id,
        stripe_payment_link_id: item.stripe_payment_link_id,
        shipping_address: item.shipping_address,
        mobile_number: item.mobile_number,
        created_at: item.created_at,
        paid_at: item.paid_at,
        campaign_title: item.campaigns.title,
        organizer_name: item.campaigns.organizer
      }));

      return { data: formattedData };
    } catch (error) {
      console.error('Error fetching all pack orders:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to fetch pack orders' 
      };
    }
  }

  async getOutstandingPackOrders(): Promise<{ data?: (PackOrder & { campaign_title: string; organizer_name: string })[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pack_orders')
        .select(`
          *,
          campaigns!inner(title, organizer)
        `)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: true }); // Oldest first for follow-up

      if (error) throw error;

      const formattedData = data.map(item => ({
        id: item.id,
        campaign_id: item.campaign_id,
        user_id: item.user_id,
        amount: item.amount,
        payment_status: item.payment_status,
        stripe_payment_intent_id: item.stripe_payment_intent_id,
        stripe_payment_link_id: item.stripe_payment_link_id,
        shipping_address: item.shipping_address,
        mobile_number: item.mobile_number,
        created_at: item.created_at,
        paid_at: item.paid_at,
        campaign_title: item.campaigns.title,
        organizer_name: item.campaigns.organizer
      }));

      return { data: formattedData };
    } catch (error) {
      console.error('Error fetching outstanding pack orders:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch outstanding pack orders'
      };
    }
  }

  async createPaymentLink(data: {
    packOrderId: string;
    campaignTitle: string;
    organizerName: string;
    organizerEmail: string;
    sendEmail: boolean;
  }): Promise<{ paymentLink?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-pack-payment-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment link');
      }

      const result = await response.json();
      return { paymentLink: result.paymentLink };
    } catch (error) {
      console.error('Error creating payment link:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to create payment link'
      };
    }
  }
}

export const packOrderService = new PackOrderService();