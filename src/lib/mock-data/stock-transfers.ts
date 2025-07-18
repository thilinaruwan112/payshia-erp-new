import type { StockTransfer } from '@/lib/types';

export const stockTransfers: StockTransfer[] = [
    { id: 'ST-001', fromLocationId: 'loc-1', fromLocationName: 'Main Warehouse', toLocationId: 'loc-2', toLocationName: 'Downtown Store', date: '2023-11-10', status: 'Completed', itemCount: 50 },
    { id: 'ST-002', fromLocationId: 'loc-1', fromLocationName: 'Main Warehouse', toLocationId: 'loc-3', toLocationName: 'Uptown Store', date: '2023-11-12', status: 'In Transit', itemCount: 30 },
];
