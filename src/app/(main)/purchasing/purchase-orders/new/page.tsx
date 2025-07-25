
import { PurchaseOrderForm } from '@/components/purchase-order-form';
import type { Supplier, Product } from '@/lib/types';

async function getSuppliers(): Promise<Supplier[]> {
    try {
        const response = await fetch('https://server-erp.payshia.com/suppliers');
        if (!response.ok) {
            return [];
        }
        return response.json();
    } catch (error) {
        console.error('Failed to fetch suppliers:', error);
        return [];
    }
}

async function getProducts(): Promise<Product[]> {
    try {
        const response = await fetch('https://server-erp.payshia.com/products');
        if (!response.ok) {
            return [];
        }
        return response.json();
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}


export default async function NewPurchaseOrderPage() {
  const [suppliers, products] = await Promise.all([getSuppliers(), getProducts()]);
  return <PurchaseOrderForm suppliers={suppliers} products={products} />;
}
