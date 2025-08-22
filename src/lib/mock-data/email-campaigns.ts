
import type { EmailCampaign } from '@/lib/types';

export const emailCampaigns: EmailCampaign[] = [
  {
    id: 'campaign-001',
    name: 'Summer Sale Kickoff',
    subject: '☀️ Summer Deals Are Here!',
    targetAudience: 'All',
    status: 'Sent',
    sentDate: '2023-06-01',
    recipientCount: 1250,
    content: '<h1>Our Summer Sale is ON!</h1><p>Get up to 50% off on selected items. Shop now!</p>',
  },
  {
    id: 'campaign-002',
    name: 'Loyalty Appreciation',
    subject: 'A Special Thank You to Our Gold Members',
    targetAudience: 'Gold',
    status: 'Sent',
    sentDate: '2023-06-15',
    recipientCount: 150,
    content: '<h1>You\'re Gold!</h1><p>As a thank you for your loyalty, enjoy an exclusive 20% off your next purchase.</p>',
  },
  {
    id: 'campaign-003',
    name: 'New Arrivals - Fall',
    subject: '🍂 Fall Collection is Here!',
    targetAudience: 'All',
    status: 'Draft',
    recipientCount: 0,
    content: '<h1>Get Ready for Fall!</h1><p>Our new collection has just dropped. Be the first to check it out.</p>',
  },
];
