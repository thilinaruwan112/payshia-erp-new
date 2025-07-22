
import type { EmailCampaign } from '@/lib/types';

export const emailCampaigns: EmailCampaign[] = [
    {
        id: 'email-camp-001',
        name: 'Welcome Series - First Email',
        subject: 'Welcome to Payshia!',
        targetAudience: 'All',
        status: 'Sent',
        sentDate: '2023-10-01',
        recipientCount: 5,
        content: '<h1>Welcome to the Family!</h1><p>Hi [Customer Name], thanks for signing up. We are excited to have you. Here is a 10% discount on your next purchase: <strong>WELCOME10</strong></p>'
    },
    {
        id: 'email-camp-002',
        name: 'Platinum Exclusive Offer',
        subject: 'A Special Offer Just For You',
        targetAudience: 'Platinum',
        status: 'Draft',
        recipientCount: 1,
        content: '<h2>You\'re a VIP!</h2><p>As a Platinum member, you get exclusive access to our new collection before anyone else. <a href="#">Shop Now</a>.</p>'
    },
];
