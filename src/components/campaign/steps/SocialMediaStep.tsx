import React from 'react';
import { Share2 } from 'lucide-react';
import { CampaignFormData } from '../types';

interface SocialMediaStepProps {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData) => void;
}

export default function SocialMediaStep({ formData, setFormData }: SocialMediaStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Social Media</h3>
        <p className="text-gray-600">Help people find and follow your campaign</p>
        <p className="text-sm text-gray-500 mt-1">This step is optional - you can skip it if you prefer</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Share2 className="inline h-4 w-4 mr-1" />
            Facebook Page
          </label>
          <input
            type="url"
            value={formData.socialLinks.facebook}
            onChange={(e) => setFormData({ 
              ...formData, 
              socialLinks: { ...formData.socialLinks, facebook: e.target.value }
            })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="https://facebook.com/yourpage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram
          </label>
          <input
            type="url"
            value={formData.socialLinks.instagram}
            onChange={(e) => setFormData({ 
              ...formData, 
              socialLinks: { ...formData.socialLinks, instagram: e.target.value }
            })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="https://instagram.com/youraccount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Twitter/X
          </label>
          <input
            type="url"
            value={formData.socialLinks.twitter}
            onChange={(e) => setFormData({ 
              ...formData, 
              socialLinks: { ...formData.socialLinks, twitter: e.target.value }
            })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="https://twitter.com/youraccount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Group
          </label>
          <input
            type="url"
            value={formData.socialLinks.whatsapp}
            onChange={(e) => setFormData({ 
              ...formData, 
              socialLinks: { ...formData.socialLinks, whatsapp: e.target.value }
            })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="https://chat.whatsapp.com/..."
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
        <p className="text-blue-800 text-sm">
          Social media links help build trust and allow supporters to follow your journey. 
          You can always add these later if you don't have them ready now.
        </p>
      </div>
    </div>
  );
}