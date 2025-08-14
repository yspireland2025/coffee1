export interface CampaignFormData {
  title: string;
  organizer: string;
  email: string;
  county: string;
  eircode: string;
  story: string;
  goalAmount: string;
  eventDate: string;
  eventTime: string;
  location: string;
  image: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    whatsapp: string;
  };
}

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  confirmEmail: string;
  county: string;
  eircode: string;
}

export interface ShippingAddress {
  name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  county: string;
  eircode: string;
  country: string;
}

export interface TshirtSizes {
  shirt_1: string;
  shirt_2: string;
  shirt_3: string;
  shirt_4: string;
}

export interface PackOption {
  id: 'free' | 'medium' | 'large';
  name: string;
  price: number;
  description: string;
  items: string[];
  popular?: boolean;
}