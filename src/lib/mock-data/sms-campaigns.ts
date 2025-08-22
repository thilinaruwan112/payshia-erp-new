
import type { SmsCampaign } from '@/lib/types';

export const smsCampaigns: SmsCampaign[] = [
  {
    id: 'sms-001',
    name: 'Flash Sale Alert',
    targetAudience: 'All',
    status: 'Sent',
    sentDate: '2023-07-01',
    recipientCount: 850,
    content: 'FLASH SALE! Get 25% off all t-shirts for the next 24 hours. Show this text in-store. Reply STOP to opt out.',
  },
  {
    id: 'sms-002',
    name: 'Platinum Tier Exclusive',
    targetAudience: 'Platinum',
    status: 'Sent',
    sentDate: '2023-07-10',
    recipientCount: 50,
    content: 'Payshia ERP: As a Platinum member, get early access to our new collection. Link: http://bit.ly/payshia-new',
  },
  {
    id: 'sms-003',
    name: 'Holiday Hours Notice',
    targetAudience: 'All',
    status: 'Draft',
    recipientCount: 0,
    content: 'Holiday Update: We will be closed on July 4th. We wish you a happy and safe holiday! - Payshia Team',
  },
];
