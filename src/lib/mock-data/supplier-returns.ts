import type { SupplierReturn } from '@/lib/types';

export const supplierReturns: SupplierReturn[] = [
    {
        id: 'SR-001',
        grnId: 'GRN-001',
        supplierId: 'sup-1',
        supplierName: 'Global Textiles Inc.',
        date: '2023-11-20',
        totalValue: 249.90, // 10 * 24.99
        items: [{ sku: 'TS-BLK-S', returnedQty: 10, unitPrice: 24.99 }]
    },
];
