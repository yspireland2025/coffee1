import React from 'react';
import { Users, Target, Heart, Award } from 'lucide-react';

export default function AboutSection() {
  const stats = [
    { icon: Users, value: '15,000+', label: 'Young people reached' },
    { icon: Target, value: '€450K+', label: 'Funds raised in 2024' },
    { icon: Heart, value: '35', label: 'Coffee mornings already hosted' },
    { icon: Award, value: '8', label: 'Counties covered' }
  ];

  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">About Youth Suicide Prevention Ireland</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're dedicated to preventing youth suicide through education, support, and community engagement.
            Every coffee morning creates connections that save lives.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Youth Suicide Prevention Ireland was founded with a simple but powerful belief: that every young life
              is precious and worth saving. We work tirelessly to create communities where young people feel heard,
              supported, and valued.
            </p>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Our Coffee Morning Challenge brings people together in the most natural way - over a cup of coffee.
              These gatherings create safe spaces for meaningful conversations about mental health, while raising
              vital funds for our prevention programs.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>Crisis intervention and support services</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>Educational workshops in schools and communities</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>Training for parents, teachers, and community leaders</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>Research and advocacy for better mental health policies</span>
              </li>
            </ul>
          </div>
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Community support group"
              className="rounded-3xl shadow-2xl"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center bg-green-50 rounded-2xl p-6">
              <div className="bg-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-8 w-8 text-green-700" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}