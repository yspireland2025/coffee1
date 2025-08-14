import { Campaign } from '../types';

export const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Sarah\'s Coffee Morning for Hope',
    organizer: 'Sarah O\'Brien',
    story: 'After losing my brother to suicide two years ago, I\'ve made it my mission to raise awareness and funds for youth mental health. Join me for a cozy coffee morning where we\'ll share stories, support each other, and raise vital funds for YSPI.',
    goalAmount: 2000,
    raisedAmount: 1450,
    eventDate: '2025-03-15',
    eventTime: '10:00',
    location: 'Community Centre, Cork',
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
    socialLinks: {
      facebook: 'https://facebook.com/sarahscoffemorning',
      instagram: 'https://instagram.com/sarahscoffeemorning',
      whatsapp: 'https://wa.me/353871234567'
    },
    createdAt: '2025-01-15T10:00:00Z',
    isActive: true
  },
  {
    id: '2',
    title: 'Dublin Tech Coffee Connect',
    organizer: 'Michael Chen',
    story: 'As someone in the tech industry, I\'ve seen firsthand how mental health struggles affect young professionals. Let\'s come together over great coffee and meaningful conversations to support youth suicide prevention.',
    goalAmount: 3000,
    raisedAmount: 2100,
    eventDate: '2025-03-22',
    eventTime: '09:30',
    location: 'Tech Hub Dublin, Dublin 2',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
    socialLinks: {
      twitter: 'https://twitter.com/techchoffee',
      linkedin: 'https://linkedin.com/in/michaelchen'
    },
    createdAt: '2025-01-18T14:30:00Z',
    isActive: true
  },
  {
    id: '3',
    title: 'Galway Community Caffeine Crusade',
    organizer: 'Emma Walsh',
    story: 'Growing up in Galway, I\'ve witnessed the impact of mental health challenges on our youth. This coffee morning is about creating a safe space for conversation and raising funds for a cause close to my heart.',
    goalAmount: 1500,
    raisedAmount: 890,
    eventDate: '2025-03-29',
    eventTime: '11:00',
    location: 'Galway Bay Hotel, Galway',
    image: 'https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=800',
    socialLinks: {
      facebook: 'https://facebook.com/galwaycoffeemorning',
      instagram: 'https://instagram.com/galwaycoffee'
    },
    createdAt: '2025-01-20T16:45:00Z',
    isActive: true
  }
];