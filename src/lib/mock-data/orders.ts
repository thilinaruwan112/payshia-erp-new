import type { Order } from '@/lib/types';

export const orders: Order[] = [
    {
        id: 'ORD-001',
        customerName: 'John Doe',
        channel: 'E-commerce',
        date: '2023-10-26',
        status: 'Delivered',
        total: 49.98,
        items: [{ sku: 'TS-BLK-M', quantity: 2 }],
    },
    {
        id: 'ORD-002',
        customerName: 'Jane Smith',
        channel: 'Retail',
        date: '2023-10-28',
        status: 'Shipped',
        total: 12.50,
        items: [{ sku: 'MG-CER-BL', quantity: 1 }],
    },
    {
        id: 'ORD-003',
        customerName: 'Alice Johnson',
        channel: 'POS',
        date: '2023-10-29',
        status: 'Processing',
        total: 124.98,
        items: [{ sku: 'MO-WL-01', quantity: 2 }, { sku: 'TS-WHT-M', quantity: 1 }],
    },
    {
        id: 'ORD-004',
        customerName: 'Bob Brown',
        channel: 'Wholesale',
        date: '2023-10-30',
        status: 'Pending',
        total: 750.00,
        items: [{ sku: 'WL-LTH-BRN', quantity: 10 }],
    },
    {
        id: 'ORD-005',
        customerName: 'Charlie Davis',
        channel: 'E-commerce',
        date: '2023-10-31',
        status: 'Cancelled',
        total: 24.99,
        items: [{ sku: 'TS-WHT-M', quantity: 1 }],
    }
];
