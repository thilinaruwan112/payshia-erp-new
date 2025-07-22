import type { StockTransfer } from '@/lib/types';
import { products } from './products';

const getCostPrice = (sku: string) => {
    const product = products.find(p => p.variants.some(v => v.sku === sku));
    return product?.costPrice || 0;
}

const transfer1Items = [
    { sku: 'TS-BLK-S', quantity: 20 },
    { sku: 'TS-WHT-M', quantity: 30 },
];

const transfer2Items = [
    { sku: 'MO-WL-01', quantity: 15 },
    { sku: 'MG-CER-BL', quantity: 15 },
]

export const stockTransfers: StockTransfer[] = [
    { 
        id: 'ST-001', 
        fromLocationId: 'loc-1', 
        fromLocationName: 'Main Warehouse', 
        toLocationId: 'loc-2', 
        toLocationName: 'Downtown Store', 
        date: '2023-11-10', 
        status: 'Completed', 
        items: transfer1Items,
        itemCount: transfer1Items.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: transfer1Items.reduce((sum, item) => sum + (getCostPrice(item.sku) * item.quantity), 0),
    },
    { 
        id: 'ST-002', 
        fromLocationId: 'loc-1', 
        fromLocationName: 'Main Warehouse', 
        toLocationId: 'loc-3', 
        toLocationName: 'Uptown Store', 
        date: '2023-11-12', 
        status: 'In Transit', 
        items: transfer2Items,
        itemCount: transfer2Items.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: transfer2Items.reduce((sum, item) => sum + (getCostPrice(item.sku) * item.quantity), 0),
    },
];
