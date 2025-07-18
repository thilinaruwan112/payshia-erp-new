import type { Location } from '@/lib/types';

export const locations: Location[] = [
  { id: 'loc-1', name: 'Main Warehouse', type: 'Warehouse', salesChannels: ['Wholesale'] },
  { id: 'loc-2', name: 'Downtown Store', type: 'Store', salesChannels: ['POS', 'Retail'] },
  { id: 'loc-3', name: 'Uptown Store', type: 'Store', salesChannels: ['POS', 'Retail', 'E-commerce'] },
];
