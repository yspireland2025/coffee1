import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  campaign_id: string;
  sender_name: string;
  sender_email: string;
  sender_mobile: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateMessageData {
  campaignId: string;
  senderName: string;
  senderEmail: string;
  senderMobile?: string;
  message: string;
}

class MessageService {
  async createMessage(messageData: CreateMessageData): Promise<{ data?: Message; error?: string }> {
    try {
      console.log('Creating message in database:', messageData);
      
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          campaign_id: messageData.campaignId,
          sender_name: messageData.senderName,
          sender_email: messageData.senderEmail,
          sender_mobile: messageData.senderMobile || null,
          message: messageData.message,
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating message:', error);
        throw error;
      }

      console.log('Message created successfully:', data);
      return { data };
    } catch (error) {
      console.error('Message service error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to save message' 
      };
    }
  }

  async getMessagesForCampaign(campaignId: string): Promise<{ data?: Message[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      };
    }
  }

  async getMessagesForUser(userId: string): Promise<{ data?: (Message & { campaign_title: string })[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          campaigns!inner(title, user_id)
        `)
        .eq('campaigns.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the response
      const formattedData = data.map(item => ({
        id: item.id,
        campaign_id: item.campaign_id,
        sender_name: item.sender_name,
        sender_email: item.sender_email,
        sender_mobile: item.sender_mobile,
        message: item.message,
        is_read: item.is_read,
        created_at: item.created_at,
        campaign_title: item.campaigns.title
      }));

      return { data: formattedData };
    } catch (error) {
      console.error('Error fetching user messages:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      };
    }
  }

  async markMessageAsRead(messageId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      return {};
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to mark message as read' 
      };
    }
  }

  async getUnreadMessageCount(userId: string): Promise<{ count?: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .in('campaign_id', 
          supabase
            .from('campaigns')
            .select('id')
            .eq('user_id', userId)
        );

      if (error) throw error;
      return { count: count || 0 };
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to get unread count' 
      };
    }
  }

  async getAllMessages(): Promise<{ data?: (Message & { campaign_title: string; campaign_organizer: string })[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
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
        sender_name: item.sender_name,
        sender_email: item.sender_email,
        sender_mobile: item.sender_mobile,
        message: item.message,
        is_read: item.is_read,
        created_at: item.created_at,
        campaign_title: item.campaigns.title,
        campaign_organizer: item.campaigns.organizer
      }));

      return { data: formattedData };
    } catch (error) {
      console.error('Error fetching all messages:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      };
    }
  }
}

export const messageService = new MessageService();