
import { InvoiceForm } from '@/components/invoice-form';
import { type Product, type User, type Order, type ProductVariant } from '@/lib/types';
import { orders } from '@/lib/data';

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

async function getData(): Promise<{ productsWithVariants: ProductWithVariants[], customers: User[], orders: Order[] }> {
    try {
        const [productsRes, customersRes] = await Promise.all([
            fetch('https://server-erp.payshia.com/products/with-variants/', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/customers', { cache: 'no-store' }),
        ]);

        if (!productsRes.ok || !customersRes.ok) {
            throw new Error('Failed to fetch initial data');
        }

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        const productsWithVariants: ProductWithVariants[] = Array.isArray(productsData.products) ? productsData.products : [];
        const customers: User[] = Array.isArray(customersData) ? customersData : [];
        
        return { productsWithVariants, customers, orders };
    } catch (error) {
        console.error("Failed to fetch invoice data:", error);
        return { productsWithVariants: [], customers: [], orders: [] };
    }
}


export default async function NewInvoicePage() {
  const data = await getData();
  return <InvoiceForm {...data} />;
}

