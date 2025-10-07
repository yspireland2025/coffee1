import React, { useEffect, useRef, useState } from 'react';
import { Campaign } from '../types';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CampaignMapProps {
  campaigns: Campaign[];
  onCampaignClick: (campaign: Campaign) => void;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

async function getGoogleMapsApiKey(): Promise<string> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'google_maps_api_key')
    .maybeSingle();

  if (error || !data) {
    throw new Error('Failed to load Google Maps API key');
  }

  return data.value;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.google === 'object' && typeof window.google.maps === 'object') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export default function CampaignMap({
  campaigns,
  onCampaignClick,
  centerLat = 53.3498,
  centerLng = -6.2603,
  zoom = 7
}: CampaignMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGoogleMapsApiKey()
      .then((apiKey) => loadGoogleMapsScript(apiKey))
      .then(() => {
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load map');
        setIsLoading(false);
      });
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const geocoder = new google.maps.Geocoder();
    const infoWindow = new google.maps.InfoWindow();

    campaigns.forEach((campaign) => {
      const address = campaign.eircode
        ? `${campaign.eircode}, Ireland`
        : `${campaign.location}, ${campaign.county || ''}, Ireland`;

      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const progress = (campaign.raisedAmount / campaign.goalAmount) * 100;
          const color = progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444';

          const marker = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: results[0].geometry.location,
            title: campaign.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 12,
            },
          });

          marker.addListener('click', () => {
            const contentString = `
              <div style="max-width: 300px; padding: 12px;">
                <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">${campaign.title}</h3>
                <div style="margin-bottom: 8px;">
                  <strong>Location:</strong> ${campaign.location}
                </div>
                <div style="margin-bottom: 8px;">
                  <strong>Event Date:</strong> ${new Date(campaign.eventDate).toLocaleDateString('en-IE', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div style="margin-bottom: 12px;">
                  <strong>Progress:</strong> €${campaign.raisedAmount.toLocaleString()} of €${campaign.goalAmount.toLocaleString()}
                </div>
                <div style="background: #e5e7eb; border-radius: 9999px; height: 8px; margin-bottom: 12px;">
                  <div style="background: #10b981; height: 8px; border-radius: 9999px; width: ${Math.min(progress, 100)}%;"></div>
                </div>
                <button
                  onclick="window.viewCampaignDetails('${campaign.id}')"
                  style="background: #a8846d; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; width: 100%; font-weight: 500;"
                >
                  View Details
                </button>
              </div>
            `;

            infoWindow.setContent(contentString);
            infoWindow.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
        }
      });
    });

    (window as any).viewCampaignDetails = (campaignId: string) => {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        onCampaignClick(campaign);
      }
    };

    return () => {
      delete (window as any).viewCampaignDetails;
    };
  }, [campaigns, isLoading, onCampaignClick]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[600px] rounded-lg overflow-hidden shadow-lg" />

      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10">
        <h4 className="font-semibold text-sm mb-2">Campaign Progress</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#10b981] border-2 border-white shadow"></div>
            <span>75%+ funded</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#f59e0b] border-2 border-white shadow"></div>
            <span>50-74% funded</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white shadow"></div>
            <span>&lt;50% funded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
