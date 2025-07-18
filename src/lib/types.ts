export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  collectionId: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
}

export interface Sale {
  id: string;
  customerName: string;
  date: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
}
