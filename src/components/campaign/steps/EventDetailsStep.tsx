import React from 'react';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { irishCounties } from '../../../data/counties';
import { CampaignFormData } from '../types';

interface EventDetailsStepProps {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData) => void;
}

export default function EventDetailsStep({ formData, setFormData }: EventDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Event Details</h3>
        <p className="text-gray-600">When and where will your coffee morning take place?</p>
        <p className="text-sm text-gray-500 mt-1">This is the location where your event will be held (may be different from your home address)</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Event County *
          </label>
          <select
            required
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select Event County</option>
            {irishCounties.map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">County where your coffee morning will take place</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Area Eircode *
          </label>
          <input
            type="text"
            required
            value={formData.eircode}
            onChange={(e) => setFormData({ ...formData, eircode: e.target.value.toUpperCase() })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="A65 F4E2"
            maxLength={8}
          />
          <p className="text-xs text-gray-500 mt-1">Eircode for the event area (helps with local promotion)</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            County *
          </label>
          <select
            required
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select Your County</option>
            {irishCounties.map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eircode *
          </label>
          <input
            type="text"
            required
            value={formData.eircode}
            onChange={(e) => setFormData({ ...formData, eircode: e.target.value.toUpperCase() })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="A65 F4E2"
            maxLength={8}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline h-4 w-4 mr-1" />
          Specific Event Location *
        </label>
        <input
          type="text"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="e.g., Community Centre, Main Street, Cork"
        />
        <p className="text-xs text-gray-500 mt-1">Specific venue name and address for your coffee morning</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Event Date *
          </label>
          <input
            type="date"
            required
            value={formData.eventDate}
            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Event Time *
          </label>
          <input
            type="time"
            required
            value={formData.eventTime}
            onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}