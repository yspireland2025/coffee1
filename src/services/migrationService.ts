import { supabase } from '../lib/supabase';
import { getCoordinatesForCounty } from '../data/countyCoordinates';

export const migrationService = {
  async geocodeExistingCampaigns() {
    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, county, latitude, longitude')
        .is('latitude', null);

      if (error) throw error;

      if (!campaigns || campaigns.length === 0) {
        console.log('No campaigns need coordinates');
        return { success: true, updated: 0 };
      }

      console.log(`Found ${campaigns.length} campaigns to add coordinates`);
      let updated = 0;

      for (const campaign of campaigns) {
        if (campaign.county) {
          console.log(`Adding coordinates for campaign ${campaign.id} in ${campaign.county}`);

          const coords = getCoordinatesForCounty(campaign.county);

          if (coords) {
            const { error: updateError } = await supabase
              .from('campaigns')
              .update({
                latitude: coords.lat,
                longitude: coords.lng
              })
              .eq('id', campaign.id);

            if (updateError) {
              console.error(`Error updating campaign ${campaign.id}:`, updateError);
            } else {
              updated++;
              console.log(`✓ Updated campaign ${campaign.id} with coords:`, coords);
            }
          } else {
            console.log(`✗ Could not find coordinates for county ${campaign.county}`);
          }
        }
      }

      return { success: true, updated, total: campaigns.length };
    } catch (error) {
      console.error('Error adding coordinates to campaigns:', error);
      return { success: false, error };
    }
  }
};
