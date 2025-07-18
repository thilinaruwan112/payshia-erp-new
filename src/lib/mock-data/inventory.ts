import type { InventoryItem } from '@/lib/types';

export const inventory: InventoryItem[] = [
  { productId: 'prod-1', sku: 'TS-BLK-S', locationId: 'loc-1', stock: 120, reorderLevel: 20 },
  { productId: 'prod-1', sku: 'TS-BLK-S', locationId: 'loc-2', stock: 30, reorderLevel: 10 },
  { productId: 'prod-1', sku: 'TS-BLK-M', locationId: 'loc-1', stock: 80, reorderLevel: 20 },
  { productId: 'prod-1', sku: 'TS-BLK-M', locationId: 'loc-3', stock: 15, reorderLevel: 10 },
  { productId: 'prod-1', sku: 'TS-WHT-M', locationId: 'loc-1', stock: 95, reorderLevel: 20 },
  { productId: 'prod-1', sku: 'TS-WHT-M', locationId: 'loc-2', stock: 8, reorderLevel: 10 },
  { productId: 'prod-2', sku: 'MO-WL-01', locationId: 'loc-1', stock: 200, reorderLevel: 50 },
  { productId: 'prod-2', sku: 'MO-WL-01', locationId: 'loc-2', stock: 45, reorderLevel: 15 },
  { productId: 'prod-2', sku: 'MO-WL-01', locationId: 'loc-3', stock: 0, reorderLevel: 15 },
  { productId: 'prod-3', sku: 'MG-CER-BL', locationId: 'loc-1', stock: 300, reorderLevel: 50 },
  { productId: 'prod-3', sku: 'MG-CER-BL', locationId: 'loc-2', stock: 60, reorderLevel: 20 },
  { productId: 'prod-4', sku: 'WL-LTH-BRN', locationId: 'loc-1', stock: 50, reorderLevel: 10 },
  { productId: 'prod-4', sku: 'WL-LTH-BRN', locationId: 'loc-3', stock: 5, reorderLevel: 5 },
  { productId: 'prod-5', sku: 'JE-BLU-32', locationId: 'loc-1', stock: 70, reorderLevel: 15 },
  { productId: 'prod-5', sku: 'JE-BLU-34', locationId: 'loc-2', stock: 25, reorderLevel: 10 },
  { productId: 'prod-6', sku: 'SPK-BT-GRY', locationId: 'loc-1', stock: 40, reorderLevel: 10 },
  { productId: 'prod-7', sku: 'CDL-LAV', locationId: 'loc-2', stock: 80, reorderLevel: 20 },
  { productId: 'prod-8', sku: 'BPK-CV-GRN', locationId: 'loc-3', stock: 18, reorderLevel: 5 },
];
