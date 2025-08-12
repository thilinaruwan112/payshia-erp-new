import type { User } from '@/lib/types';

export const users: User[] = [
  { id: 'user-1', name: 'Admin User', role: 'Admin', avatar: 'https://placehold.co/100x100.png?text=AU', email: 'admin@payshia.com', customer_id: '1' },
  { id: 'user-2', name: 'Manager Mike', role: 'Manager', avatar: 'https://placehold.co/100x100.png?text=MM', email: 'mike@payshia.com', customer_id: '2' },
  { id: 'user-3', name: 'Cashier Chloe', role: 'Sales Agent', avatar: 'https://placehold.co/100x100.png?text=CC', email: 'chloe@payshia.com', customer_id: '3' },
  { id: 'user-4', name: 'Walk-in Customer', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=WC', loyaltyPoints: 0, email: 'walkin@payshia.com', phone: 'N/A', address: 'N/A', customer_id: '4' },
  { id: 'user-5', name: 'John Doe', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=JD', loyaltyPoints: 125, email: 'john.d@example.com', phone: '111-222-3333', address: '123 Oak St, Anytown, USA', customer_id: '5' },
  { id: 'user-6', name: 'Jane Smith', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=JS', loyaltyPoints: 80, email: 'jane.s@example.com', phone: '222-333-4444', address: '456 Maple Ave, Anytown, USA', customer_id: '6' },
  { id: 'user-7', name: 'Alice Johnson', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=AJ', loyaltyPoints: 250, email: 'alice.j@example.com', phone: '333-444-5555', address: '789 Pine Ln, Anytown, USA', customer_id: '7' },
  { id: 'user-8', name: 'Bob Brown', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=BB', loyaltyPoints: 50, email: 'bob.b@example.com', phone: '444-555-6666', address: '101 Birch Rd, Anytown, USA', customer_id: '8' },
  { id: 'user-9', name: 'Charlie Davis', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=CD', loyaltyPoints: 515, email: 'charlie.d@example.com', phone: '555-666-7777', address: '212 Cedar Ct, Anytown, USA', customer_id: '9' },
];
