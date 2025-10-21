import React from 'react';
import { useState, useEffect } from 'react';
import { Coffee, Users, Target, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import heroCoffeeImage from '../assets/hero-coffee.webp';

interface HeroProps {
  onCreateCampaign: () => void;
}

export default function Hero({ onCreateCampaign }: HeroProps) {
  const [totalRaised, setTotalRaised] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateTotalRaised = async () => {
      try {
        // Get all donations from the database
        const { data: donations, error } = await supabase
          .from('donations')
          .select('amount');

        if (error) {
          console.error('Error loading donations for total:', error);
          return;
        }

        // Calculate total (amounts are stored in cents, convert to euros)
        const total = donations.reduce((sum, donation) => sum + donation.amount, 0) / 100;
        setTotalRaised(total);
      } catch (error) {
        console.error('Error calculating total raised:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateTotalRaised();

    // Set up real-time subscription for donation changes
    const subscription = supabase
      .channel('hero_donations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'donations' },
        () => {
          calculateTotalRaised();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <section className="bg-gradient-to-br from-green-50 to-amber-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-[#009999]">
                The Let's Talk
              </span>
              <br />
              <span className="text-[#a8846d]">
                Coffee Morning
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Get together with friends and family and do something amazing by helping someone in need.
Host your own Let&apos;s Talk Coffee Morning and help save young lives. Your Let&apos;s Talk Coffee Morning will make such a difference to young people living with mental health issues or in crisis.</p>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              With our helpful starter pack it has never been easier to setup a Let's Talk Coffee Morning. Packs are free, we just ask for a contribution towards the cost of postage (€10).
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={onCreateCampaign}
                className="bg-[#a8846d] text-white px-8 py-4 rounded-full hover:bg-[#96785f] transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
              >
                Start Your Coffee Morning
              </button>
              <a 
                href="#how-it-works"
                className="border-2 border-[#a8846d] text-[#a8846d] px-8 py-4 rounded-full hover:bg-[#a8846d] hover:text-white transition-colors font-semibold text-lg text-center inline-block"
              >
                Learn More
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 w-16 h-16 flex items-center justify-center mx-auto">
                  <Coffee className="h-8 w-8 text-amber-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Host Events</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 w-16 h-16 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Build Community</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 w-16 h-16 flex items-center justify-center mx-auto">
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-sm font-medium text-gray-900">Save Lives</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-amber-100 to-green-100 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroCoffeeImage}
                alt="Group of friends having coffee morning for charity"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Target className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : `€${totalRaised.toLocaleString()}`}
                  </p>
                  <p className="text-sm text-gray-600">Raised This Year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}