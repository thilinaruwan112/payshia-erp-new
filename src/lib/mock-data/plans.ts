
import type { Plan } from '@/lib/types';

export const plans: Plan[] = [
  {
    id: 'plan-basic',
    name: 'Basic',
    description: 'For small businesses just getting started.',
    price: 15,
    limits: {
      orders: 100,
      products: 25,
      locations: 1,
    },
    features: ['Standard Reporting', 'Email Support'],
    ctaLabel: 'Choose Basic',
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    description: 'For growing businesses that need more power.',
    price: 45,
    limits: {
      orders: 1000,
      products: 500,
      locations: 5,
    },
    features: ['Advanced Reporting', 'Priority Support', 'AI Logistics'],
    ctaLabel: 'Upgrade to Pro',
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    description: 'For large-scale operations with custom needs.',
    price: 99,
    limits: {
      orders: Infinity,
      products: Infinity,
      locations: Infinity,
    },
    features: [
      'Custom Reporting',
      'Dedicated Account Manager',
      '24/7 Phone Support',
    ],
    ctaLabel: 'Contact Us',
  },
];
