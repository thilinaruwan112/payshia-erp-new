import type { User } from '@/lib/types';

export const users: User[] = [
  { id: 'user-1', name: 'Admin User', role: 'Admin', avatar: 'https://placehold.co/100x100.png?text=AU' },
  { id: 'user-2', name: 'Manager Mike', role: 'Manager', avatar: 'https://placehold.co/100x100.png?text=MM' },
  { id: 'user-3', name: 'Cashier Chloe', role: 'Sales Agent', avatar: 'https://placehold.co/100x100.png?text=CC' },
  { id: 'user-4', name: 'Walk-in Customer', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=WC', loyaltyPoints: 0 },
  { id: 'user-5', name: 'John Doe', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=JD', loyaltyPoints: 125 },
  { id: 'user-6', name: 'Jane Smith', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=JS', loyaltyPoints: 80 },
  { id: 'user-7', name: 'Alice Johnson', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=AJ', loyaltyPoints: 250 },
  { id: 'user-8', name: 'Bob Brown', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=BB', loyaltyPoints: 50 },
  { id: 'user-9', name: 'Charlie Davis', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=CD', loyaltyPoints: 15 },
];
