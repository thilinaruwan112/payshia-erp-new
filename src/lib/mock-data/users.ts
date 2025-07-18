import type { User } from '@/lib/types';

export const users: User[] = [
  { id: 'user-1', name: 'Admin User', role: 'Admin', avatar: 'https://placehold.co/100x100.png?text=AU' },
  { id: 'user-2', name: 'Manager Mike', role: 'Manager', avatar: 'https://placehold.co/100x100.png?text=MM' },
  { id: 'user-3', name: 'Cashier Chloe', role: 'Sales Agent', avatar: 'https://placehold.co/100x100.png?text=CC' },
  { id: 'user-4', name: 'Walk-in Customer', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=WC' },
];
