import React from 'react';
import { CheckCircle, Package } from 'lucide-react';
import { irishCounties } from '../../../data/counties';
import { ShippingAddress, TshirtSizes } from '../types';

interface PackSelectionStepProps {
  selectedPack: 'free' | 'medium' | 'large';
  setSelectedPack: (pack: 'free' | 'medium' | 'large') => void;
  shippingAddress: ShippingAddress;
  setShippingAddress: (address: ShippingAddress) => void;
  mobileNumber: string;
  setMobileNumber: (mobile: string) => void;
  tshirtSizes: TshirtSizes;
  setTshirtSizes: (sizes: TshirtSizes) => void;
}

const packOptions = [
  {
    id: 'free' as const,
    name: 'Free Starter Pack',
    price: 10,
    description: 'Everything you need to get started',
    items: [
      'Event planning guide',
      'Promotional posters',
      'Information leaflets',
      'Donation collection materials',
      'Social media templates'
    ],
    popular: true
  },
  {
    id: 'medium' as const,
    name: 'Medium Pack',
    price: 35,
    description: 'Enhanced materials for bigger events',
    items: [
      'Everything in Free Pack',
      '2 YSPI branded t-shirts',
      'Table banners',
      'Recipe cards for coffee treats',
      'Thank you cards for donors'
    ]
  },
  {
    id: 'large' as const,
    name: 'Large Pack',
    price: 60,
    description: 'Complete kit for community events',
    items: [
      'Everything in Medium Pack',
      '4 YSPI branded t-shirts',
      'Large event banner',
      'Coffee morning games pack',
      'Professional photo props',
      'Certificate of appreciation'
    ]
  }
];

const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function PackSelectionStep({
  selectedPack,
  setSelectedPack,
  shippingAddress,
  setShippingAddress,
  mobileNumber,
  setMobileNumber,
  tshirtSizes,
  setTshirtSizes
}: PackSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Your Coffee Morning Pack</h3>
        <p className="text-gray-600">Select the pack that best suits your event size and needs</p>
      </div>

      <div className="grid gap-6">
        {packOptions.map((pack) => (
          <div
            key={pack.id}
            className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
              selectedPack === pack.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            } ${pack.popular ? 'ring-2 ring-green-200' : ''}`}
            onClick={() => setSelectedPack(pack.id)}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-6 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{pack.name}</h4>
                <p className="text-gray-600">{pack.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">€{pack.price}</div>
                <div className="text-sm text-gray-500">
                  {pack.id === 'free' ? 'Postage only' : 'Inc. €10 postage'}
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              {pack.items.map((item, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <input
                type="radio"
                id={pack.id}
                name="pack"
                checked={selectedPack === pack.id}
                onChange={() => setSelectedPack(pack.id)}
                className="sr-only"
              />
              <label
                htmlFor={pack.id}
                className={`block w-full text-center py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedPack === pack.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedPack === pack.id ? 'Selected' : 'Select This Pack'}
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* T-shirt sizes for medium and large packs */}
      {(selectedPack === 'medium' || selectedPack === 'large') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-4">T-shirt Sizes</h4>
          <p className="text-blue-800 text-sm mb-4">
            Select sizes for your {selectedPack === 'medium' ? '2' : '4'} YSPI branded t-shirts:
          </p>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: selectedPack === 'medium' ? 2 : 4 }, (_, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  T-shirt {i + 1}
                </label>
                <select
                  value={tshirtSizes[`shirt_${i + 1}` as keyof TshirtSizes]}
                  onChange={(e) => setTshirtSizes({
                    ...tshirtSizes,
                    [`shirt_${i + 1}`]: e.target.value
                  })}
                  className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {tshirtSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}