
import { InvoiceForm } from '@/components/invoice-form';
import { type Product, type User, type Order } from '@/lib/types';

async function getData(): Promise<{ products: Product[], customers: User[], orders: Order[] }> {
    try {
        const [productsRes, usersRes, ordersRes] = await Promise.all([
            fetch('https://server-erp.payshia.com/products', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/users', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/orders', { cache: 'no-store' })
        ]);

        if (!productsRes.ok || !usersRes.ok || !ordersRes.ok) {
            throw new Error('Failed to fetch initial data');
        }

        const products = await productsRes.json();
        const users = await usersRes.json();
        const orders = await ordersRes.json();
        
        const customers = users.users.filter((u: User) => u.role === 'Customer');

        return { products, customers, orders };
    } catch (error) {
        console.error("Failed to fetch invoice data:", error);
        return { products: [], customers: [], orders: [] };
    }
}


export default async function NewInvoicePage() {
  const { products, customers, orders } = await getData();
  return <InvoiceForm products={products} customers={customers} orders={orders} />;
}
