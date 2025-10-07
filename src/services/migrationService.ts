import { supabase } from '../lib/supabase';
import { geocodingService } from './geocodingService';

export const migrationService = {
  async geocodeExistingCampaigns() {
    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, eircode, latitude, longitude')
        .is('latitude', null);

      if (error) throw error;

      if (!campaigns || campaigns.length === 0) {
        console.log('No campaigns need geocoding');
        return { success: true, updated: 0 };
      }

      console.log(`Found ${campaigns.length} campaigns to geocode`);
      let updated = 0;

      for (const campaign of campaigns) {
        if (campaign.eircode) {
          console.log(`Geocoding campaign ${campaign.id} with eircode ${campaign.eircode}`);

          await new Promise(resolve => setTimeout(resolve, 1000));

          const coords = await geocodingService.geocodeEircode(campaign.eircode);

          if (coords) {
            const { error: updateError } = await supabase
              .from('campaigns')
              .update({
                latitude: coords.latitude,
                longitude: coords.longitude
              })
              .eq('id', campaign.id);

            if (updateError) {
              console.error(`Error updating campaign ${campaign.id}:`, updateError);
            } else {
              updated++;
              console.log(`✓ Updated campaign ${campaign.id} with coords:`, coords);
            }
          } else {
            console.log(`✗ Could not geocode eircode ${campaign.eircode} for campaign ${campaign.id}`);
          }
        }
      }

      return { success: true, updated, total: campaigns.length };
    } catch (error) {
      console.error('Error geocoding campaigns:', error);
      return { success: false, error };
    }
  }
};
