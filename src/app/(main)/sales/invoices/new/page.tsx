
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

        const productsData: Product[] = await productsRes.json();
        const usersData = await usersRes.json();
        const orders: Order[] = await ordersRes.json();
        const variants: ProductVariant[] = await variantsRes.json();
        
        const customers = usersData.users.filter((u: User) => u.role === 'Customer');
        
        // Associate variants with their parent products
        const productsWithVariants = productsData.map(product => ({
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
  const { products, customers, orders } = await getData();
  return <InvoiceForm products={products} customers={customers} orders={orders} />;
}
