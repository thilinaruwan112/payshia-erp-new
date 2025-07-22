
import type { PaymentReceipt } from '@/lib/types';

export const receipts: PaymentReceipt[] = [
  {
    id: 'REC-001',
    invoiceId: 'INV-001',
    customerName: 'John Doe',
    date: '2023-10-26',
    amount: 49.98,
    paymentMethod: 'Card',
  },
];
