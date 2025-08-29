import React from 'react';
import { User, Mail, Target, FileText } from 'lucide-react';
import { CampaignFormData } from '../types';
import { User as AuthUser } from '../../../services/authService';

interface BasicInfoStepProps {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData) => void;
  user?: AuthUser | null;
}

export default function BasicInfoStep({ formData, setFormData, user }: BasicInfoStepProps) {
  // Pre-fill organizer and email from user data if available
  React.useEffect(() => {
    if (user && (!formData.organizer || !formData.email)) {
      setFormData({
        ...formData,
        organizer: user.user_metadata?.full_name || user.full_name || '',
        email: user.email || ''
      });
    }
  }, [user, formData, setFormData]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Tell Us About Your Coffee Morning</h3>
        <p className="text-gray-600">Share your story and inspire others to support your cause</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Campaign Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="e.g., Sarah's Coffee Morning for Hope"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline h-4 w-4 mr-1" />
          Your Story *
        </label>
        <textarea
          required
          rows={4}
          value={formData.story}
          onChange={(e) => setFormData({ ...formData, story: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Share why you're hosting this coffee morning and how it connects to YSPI's mission..."
        />
        <p className="text-sm text-gray-500 mt-1">
          Tell people why this cause matters to you. Personal stories create stronger connections.
        </p>
      </div>


      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Organizer Name *
          </label>
          <input
            type="text"
            required
            value={formData.organizer}
            onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Name of the person organizing this coffee morning"
          />
          <p className="text-xs text-gray-500 mt-1">
            {user ? 'Pre-filled from your account - you can change this if someone else is organizing' : 'Full name of the coffee morning organizer'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline h-4 w-4 mr-1" />
            Organizer Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="organizer@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            {user ? 'Pre-filled from your account - you can change this if someone else is organizing' : 'Email address for the coffee morning organizer'}
          </p>
        </div>
      </div>
    </div>
  );
}