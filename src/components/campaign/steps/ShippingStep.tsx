import React from 'react';
import { Package, Phone } from 'lucide-react';
import { irishCounties } from '../../../data/counties';
import { ShippingAddress } from '../types';

interface ShippingStepProps {
  shippingAddress: ShippingAddress;
  setShippingAddress: (address: ShippingAddress) => void;
  mobileNumber: string;
  setMobileNumber: (mobile: string) => void;
  selectedPack: 'free' | 'medium' | 'large';
}

const packOptions = [
  { id: 'free', name: 'Free Starter Pack' },
  { id: 'medium', name: 'Medium Pack' },
  { id: 'large', name: 'Large Pack' }
];

export default function ShippingStep({
  shippingAddress,
  setShippingAddress,
  mobileNumber,
  setMobileNumber,
  selectedPack
}: ShippingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Shipping Information</h3>
        <p className="text-gray-600">Where should we send your Coffee Morning pack?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          required
          value={shippingAddress.name}
          onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Full name for delivery"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address Line 1 *
        </label>
        <input
          type="text"
          required
          value={shippingAddress.address_line_1}
          onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_1: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Street address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address Line 2 (Optional)
        </label>
        <input
          type="text"
          value={shippingAddress.address_line_2}
          onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_2: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Apartment, suite, etc."
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City/Town *
          </label>
          <input
            type="text"
            required
            value={shippingAddress.city}
            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="City or town"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            County *
          </label>
          <select
            required
            value={shippingAddress.county}
            onChange={(e) => setShippingAddress({ ...shippingAddress, county: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select Your County</option>
            {irishCounties.map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eircode *
          </label>
          <input
            type="text"
            required
            value={shippingAddress.eircode}
            onChange={(e) => setShippingAddress({ ...shippingAddress, eircode: e.target.value.toUpperCase() })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="A65 F4E2"
            maxLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline h-4 w-4 mr-1" />
            Mobile Number *
          </label>
          <input
            type="tel"
            required
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="+353 87 123 4567"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <Package className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Delivery Information</h4>
            <p className="text-blue-800 text-sm">
              Your {packOptions.find(p => p.id === selectedPack)?.name} will be posted to this address within 3-5 business days after payment confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}