
import type { SmsCampaign } from '@/lib/types';

export const smsCampaigns: SmsCampaign[] = [
    {
        id: 'camp-001',
        name: 'Diwali Flash Sale',
        targetAudience: 'Platinum',
        status: 'Sent',
        sentDate: '2023-11-10',
        recipientCount: 1,
        content: 'Exclusive Diwali Flash Sale for our Platinum members! Get 50% off on all items. Use code PLAT50. T&C apply.'
    },
    {
        id: 'camp-002',
        name: 'New Arrivals Alert',
        targetAudience: 'All',
        status: 'Sent',
        sentDate: '2023-11-05',
        recipientCount: 5,
        content: 'Fresh styles have just landed! Check out our new arrivals and be the first to own them. Shop now!'
    },
    {
        id: 'camp-003',
        name: 'Weekend Special',
        targetAudience: 'Gold',
        status: 'Draft',
        recipientCount: 1,
        content: 'Your weekend just got better! Enjoy a special 20% discount on your next purchase. Only for our Gold members.'
    }
];
