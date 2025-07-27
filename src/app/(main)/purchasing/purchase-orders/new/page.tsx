
import { PurchaseOrderForm } from '@/components/purchase-order-form';
import type { Supplier } from '@/lib/types';

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

export default async function NewPurchaseOrderPage() {
  const suppliers = await getSuppliers();
  return <PurchaseOrderForm suppliers={suppliers} />;
}
