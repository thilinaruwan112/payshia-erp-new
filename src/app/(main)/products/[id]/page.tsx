import { ProductForm } from '@/components/product-form';
import type { Product, ProductVariant } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getProduct(id: string): Promise<(Product & { variants: ProductVariant[] }) | null> {
  try {
    const response = await fetch(`https://server-erp.payshia.com/products/details/${id}`, { cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch product data');
    }
    const data = await response.json();
    return { ...data.product, variants: data.variants };
  } catch (error) {
    console.error('Failed to get product:', error);
    return null;
  }
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return <ProductForm product={product} />;
}
