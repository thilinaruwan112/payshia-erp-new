'use client';

import { ProductForm } from '@/components/product-form';
import type { Product, ProductVariant } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EditProductPage() {
  const params = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<(Product & { variants: ProductVariant[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!id) {
        setIsLoading(false);
        return;
    };
    
    async function getProduct() {
      setIsLoading(true);
      try {
        const response = await fetcher(`https://server-erp.payshia.com/products/details/${id}`, { cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch product data');
        }
        const data = await response.json();
        setProduct({ ...data.product, variants: data.variants || [] });
      } catch (error) {
        console.error('Failed to get product:', error);
        toast({
            variant: 'destructive',
            title: 'Error loading product',
            description: 'Could not fetch product data. It may not exist or you may not have permission.'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    getProduct();

  }, [id, toast]);
  
  if (isLoading) {
    return (
        <div className="space-y-8">
             <Skeleton className="h-9 w-64" />
             <Skeleton className="h-screen w-full" />
        </div>
    )
  }

  if (!product) {
    return <div>Product not found or failed to load.</div>;
  }

  return <ProductForm product={product} />;
}
