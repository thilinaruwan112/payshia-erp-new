
import type { Plan } from '@/lib/types';

const formatNumber = (num: number) => num === Infinity ? 'Unlimited' : num.toLocaleString();

export const plans: Plan[] = [
    {
        id: 'plan-free',
        name: 'Free',
        description: 'Perfect for exploring the platform.',
        price: 0,
        limits: {
            orders: 100,
            products: 25,
            locations: 1,
        },
        features: [
            `Up to ${formatNumber(100)} Orders/mo`,
            `Up to ${formatNumber(25)} Products`,
            `${formatNumber(1)} Location`,
            'Basic Reporting'
        ],
        ctaLabel: 'Get Started'
    },
    {
        id: 'plan-basic',
        name: 'Basic',
        description: 'For small businesses getting started.',
        price: 29,
        limits: {
            orders: 1000,
            products: 500,
            locations: 2,
        },
        features: [
            `Up to ${formatNumber(1000)} Orders/mo`,
            `Up to ${formatNumber(500)} Products`,
            `${formatNumber(2)} Locations`,
            'Basic Reporting',
            'Email Support'
        ],
        ctaLabel: 'Upgrade to Basic'
    },
    {
        id: 'plan-pro',
        name: 'Pro',
        description: 'For growing businesses that need more features.',
        price: 79,
        limits: {
            orders: 5000,
            products: 10000,
            locations: 10,
        },
        features: [
            `Up to ${formatNumber(5000)} Orders/mo`,
            `Up to ${formatNumber(10000)} Products`,
            `${formatNumber(10)} Locations`,
            'Advanced Reporting',
            'AI Logistics Assistant',
            'Priority Support'
        ],
        ctaLabel: 'Upgrade to Pro'
    },
    {
        id: 'plan-enterprise',
        name: 'Enterprise',
        description: 'For large businesses with custom needs.',
        price: 249,
        limits: {
            orders: Infinity,
            products: Infinity,
            locations: Infinity,
        },
        features: [
            `${formatNumber(Infinity)} Orders`,
            `${formatNumber(Infinity)} Products`,
            `${formatNumber(Infinity)} Locations`,
            'Custom Reporting',
            'Dedicated Account Manager',
            '24/7 Phone Support'
        ],
        ctaLabel: 'Contact Sales'
    }
];
