export interface Campaign {
  id: string;
  title: string;
  organizer: string;
  story: string;
  goalAmount: number;
  raisedAmount: number;
  eventDate: string;
  eventTime: string;
  location: string;
  image: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    whatsapp?: string;
  };
  createdAt: string;
  isActive: boolean;
  isApproved?: boolean;
}

export interface Donation {
  id: string;
  campaignId: string;
  amount: number;
  donorName: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
}