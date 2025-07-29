
import { InvoiceForm } from '@/components/invoice-form';
import { type Product, type User, type Order, type ProductVariant } from '@/lib/types';

async function getData(): Promise<{ products: Product[], customers: User[], orders: Order[] }> {
    try {
        const [productsRes, usersRes, ordersRes, variantsRes] = await Promise.all([
            fetch('https://server-erp.payshia.com/products', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/users', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/orders', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/product-variants', { cache: 'no-store' })
        ]);

        if (!productsRes.ok || !usersRes.ok || !ordersRes.ok || !variantsRes.ok) {
            throw new Error('Failed to fetch initial data');
        }

        const productsData = await productsRes.json();
        const usersData = await usersRes.json();
        const ordersData = await ordersRes.json();
        const variantsData = await variantsRes.json();
        
        // The API might be wrapping the array in an object, e.g. { products: [] }
        const products: Product[] = Array.isArray(productsData) ? productsData : productsData.products || [];
        const users: User[] = Array.isArray(usersData) ? usersData : usersData.users || [];
        const orders: Order[] = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
        const variants: ProductVariant[] = Array.isArray(variantsData) ? variantsData : variantsData.variants || [];

        const customers = users.filter((u: User) => u.role === 'Customer');
        
        // Associate variants with their parent products
        const productsWithVariants = products.map(product => ({
            ...product,
            variants: variants.filter(v => v.product_id === product.id)
        }));

        return { products: productsWithVariants, customers, orders };
    } catch (error) {
        console.error("Failed to fetch invoice data:", error);
        return { products: [], customers: [], orders: [] };
    }
}


export default async function NewInvoicePage() {
  const data = await getData();
  return <InvoiceForm {...data} />;
}
