import React from 'react';
import { Target } from 'lucide-react';
import { CampaignFormData } from '../types';

interface FundraisingGoalStepProps {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData) => void;
}

export default function FundraisingGoalStep({ formData, setFormData }: FundraisingGoalStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Set Your Fundraising Goal</h3>
        <p className="text-gray-600">How much would you like to raise for Youth Suicide Prevention Ireland?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Fundraising Goal (€) *
        </label>
        <input
          type="number"
          required
          min="100"
          max="50000"
          value={formData.goalAmount}
          onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="e.g., 2000"
        />
        <p className="text-sm text-gray-500 mt-1">
          Minimum €100, maximum €50,000. Consider what's realistic for your network and event size.
        </p>
      </div>

      <div className="bg-green-50 rounded-2xl p-6">
        <h4 className="font-semibold text-green-900 mb-4">Your Impact</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-green-800">€25 = Crisis support materials for one young person</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-green-800">€50 = One hour of professional counseling</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-green-800">€100 = Mental health workshop for 20 students</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-green-800">€250 = Teacher training in one school</span>
          </div>
        </div>
      </div>
    </div>
  );
}