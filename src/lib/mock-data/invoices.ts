
import type { Invoice } from '@/lib/types';

export const invoices: Invoice[] = [
  {
    id: 'INV-001',
    orderId: 'ORD-001',
    customerName: 'John Doe',
    date: '2023-10-26',
    dueDate: '2023-11-25',
    status: 'Paid',
    total: 49.98,
    discount: 0,
    items: [
      { sku: 'TS-BLK-M', productName: 'Classic T-Shirt', quantity: 2, unitPrice: 24.99, total: 49.98, discount: 0 },
    ],
  },
  {
    id: 'INV-002',
    orderId: 'ORD-003',
    customerName: 'Alice Johnson',
    date: '2023-10-29',
    dueDate: '2023-11-28',
    status: 'Sent',
    total: 124.98,
    discount: 0,
    items: [
        { sku: 'MO-WL-01', productName: 'Wireless Mouse', quantity: 2, unitPrice: 49.99, total: 99.98, discount: 0 },
        { sku: 'TS-WHT-M', productName: 'Classic T-Shirt', quantity: 1, unitPrice: 24.99, total: 24.99, discount: 0 },
    ],
  },
   {
    id: 'INV-003',
    orderId: 'ORD-004',
    customerName: 'Bob Brown',
    date: '2023-10-30',
    dueDate: '2023-11-15',
    status: 'Overdue',
    total: 750.00,
    discount: 0,
    items: [
        { sku: 'WL-LTH-BRN', productName: 'Leather Wallet', quantity: 10, unitPrice: 75.00, total: 750.00, discount: 0 },
    ],
  },
];
