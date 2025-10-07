import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Campaign } from '../types';
import { X, MapPin, Calendar, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CampaignMapProps {
  campaigns: Campaign[];
  onCampaignClick: (campaign: Campaign) => void;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function CampaignMap({
  campaigns,
  onCampaignClick,
  centerLat = 53.3498,
  centerLng = -6.2603,
  zoom = 7
}: CampaignMapProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const campaignsWithCoords = campaigns.filter(
    c => c.latitude != null && c.longitude != null
  );

  const defaultCenter: [number, number] = [centerLat, centerLng];

  const createCustomIcon = (campaign: Campaign) => {
    const progress = (campaign.raisedAmount / campaign.goalAmount) * 100;
    const color = progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444';

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 12px;
        ">
          €
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  };

  if (campaignsWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No campaigns with location data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={defaultCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {campaignsWithCoords.map((campaign) => (
          <Marker
            key={campaign.id}
            position={[campaign.latitude!, campaign.longitude!]}
            icon={createCustomIcon(campaign)}
            eventHandlers={{
              click: () => setSelectedCampaign(campaign),
            }}
          >
            <Popup>
              <div className="min-w-[250px]">
                <h3 className="font-bold text-lg mb-2">{campaign.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{campaign.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      {new Date(campaign.eventDate).toLocaleDateString('en-IE', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      €{campaign.raisedAmount.toLocaleString()} of €{campaign.goalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={() => onCampaignClick(campaign)}
                  className="mt-3 w-full bg-[#a8846d] text-white px-4 py-2 rounded-lg hover:bg-[#96785f] transition-colors text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-[1000]">
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
