
import type { Payment } from '@/lib/types';

export const payments: Payment[] = [
    {
        id: 'pay-001',
        date: '2023-10-01',
        supplierId: 'sup-123',
        supplierName: 'Global Textiles Inc.',
        poId: 'PO-001',
        amount: 1500,
        paymentAccountId: 1010,
        paymentAccountName: 'Cash',
    },
    {
        id: 'pay-002',
        date: '2023-10-03',
        supplierId: 'sup-456',
        supplierName: 'Leather Goods Co.',
        poId: 'PO-002',
        amount: 850.50,
        paymentAccountId: 1020,
        paymentAccountName: 'Checking Account',
    },
    {
        id: 'pay-003',
        date: '2023-10-05',
        supplierId: 'sup-789',
        supplierName: 'Craft Supplies Ltd.',
        poId: 'PO-003',
        amount: 320.00,
        paymentAccountId: 1020,
        paymentAccountName: 'Checking Account',
    }
];
