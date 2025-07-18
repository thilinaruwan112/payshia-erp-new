
import type { PurchaseOrder } from '@/lib/types';

export const purchaseOrders: PurchaseOrder[] = [
    { id: 'PO-001', supplierId: 'sup-1', supplierName: 'Global Textiles Inc.', date: '2023-11-01', expectedDelivery: '2023-11-15', status: 'Received', total: 5250.00, itemCount: 2 },
    { id: 'PO-002', supplierId: 'sup-2', supplierName: 'Gadget Masters', date: '2023-11-05', expectedDelivery: '2023-11-20', status: 'Sent', total: 10000.00, itemCount: 1 },
    { id: 'PO-003', supplierId: 'sup-3', supplierName: 'Home Essentials Co.', date: '2023-11-10', expectedDelivery: '2023-11-25', status: 'Draft', total: 3000.00, itemCount: 3 },
];
