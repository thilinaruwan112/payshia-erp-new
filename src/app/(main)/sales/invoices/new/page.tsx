
import { InvoiceForm } from '@/components/invoice-form';
import { type Product, type User, type Order, type ProductVariant } from '@/lib/types';
import { orders } from '@/lib/data';

async function getData(): Promise<{ products: Product[], customers: User[], orders: Order[] }> {
    try {
        const [productsRes, variantsRes, customersRes] = await Promise.all([
            fetch('https://server-erp.payshia.com/products', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/product-variants', { cache: 'no-store' }),
            fetch('https://server-erp.payshia.com/customers', { cache: 'no-store' }),
        ]);

        if (!productsRes.ok || !variantsRes.ok || !customersRes.ok) {
            throw new Error('Failed to fetch initial data');
        }

        const productsData = await productsRes.json();
        const variantsData = await variantsRes.json();
        const customersData = await customersRes.json();

        const products: Product[] = Array.isArray(productsData) ? productsData : [];
        const variants: ProductVariant[] = Array.isArray(variantsData) ? variantsData : [];
        const customers: User[] = Array.isArray(customersData) ? customersData : [];
        
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
