
import type { Payment } from '@/lib/types';

export const payments: Payment[] = [
    {
        id: 'pay-001',
        date: '2023-11-25',
        supplierId: 'sup-1',
        supplierName: 'Global Textiles Inc.',
        poId: 'PO-001',
        amount: 5250.00,
        paymentAccountId: 1010,
        paymentAccountName: 'Cash and Bank',
    },
    {
        id: 'pay-002',
        date: '2023-11-28',
        supplierId: 'sup-2',
        supplierName: 'Gadget Masters',
        amount: 2000.00,
        paymentAccountId: 1010,
        paymentAccountName: 'Cash and Bank',
    },
];
