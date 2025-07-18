import type { Product, Collection, Sale } from './types';

export const collections: Collection[] = [
  { id: 'col1', name: 'Summer Collection', description: 'Bright and vibrant for the summer season.' },
  { id: 'col2', name: 'Winter Essentials', description: 'Warm and cozy for the cold months.' },
  { id: 'col3', name: 'All-Season Basics', description: 'Staple items for any time of the year.' },
];

export const products: Product[] = [
  { id: 'prod1', name: 'Flowy Summer Dress', description: 'A light and airy dress.', sku: 'SD001', price: 75.00, stock: 50, collectionId: 'col1' },
  { id: 'prod2', name: 'Linen Shorts', description: 'Comfortable and stylish shorts.', sku: 'LS002', price: 45.00, stock: 120, collectionId: 'col1' },
  { id: 'prod3', name: 'Cozy Wool Sweater', description: 'Keep warm with this 100% wool sweater.', sku: 'WS001', price: 120.00, stock: 80, collectionId: 'col2' },
  { id: 'prod4', name: 'Insulated Parka', description: 'A heavy-duty parka for extreme cold.', sku: 'IP002', price: 250.00, stock: 40, collectionId: 'col2' },
  { id: 'prod5', name: 'Classic White T-Shirt', description: 'A versatile and essential t-shirt.', sku: 'TS001', price: 25.00, stock: 200, collectionId: 'col3' },
  { id: 'prod6', name: 'Everyday Denim Jeans', description: 'Durable and comfortable jeans.', sku: 'DJ002', price: 90.00, stock: 150, collectionId: 'col3' },
];

export const sales: Sale[] = [
  {
    id: 'sale001',
    customerName: 'Alice Johnson',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    items: [{ productId: 'prod1', quantity: 1, price: 75.00 }],
    total: 75.00,
    status: 'Completed',
  },
  {
    id: 'sale002',
    customerName: 'Bob Williams',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    items: [
      { productId: 'prod5', quantity: 2, price: 25.00 },
      { productId: 'prod6', quantity: 1, price: 90.00 }
    ],
    total: 140.00,
    status: 'Completed',
  },
  {
    id: 'sale003',
    customerName: 'Charlie Brown',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    items: [{ productId: 'prod3', quantity: 1, price: 120.00 }],
    total: 120.00,
    status: 'Completed',
  },
  {
    id: 'sale004',
    customerName: 'Diana Prince',
    date: new Date().toISOString(),
    items: [{ productId: 'prod2', quantity: 1, price: 45.00 }],
    total: 45.00,
    status: 'Pending',
  },
];
