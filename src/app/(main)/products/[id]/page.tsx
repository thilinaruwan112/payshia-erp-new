
'use client';

import { ProductForm } from '@/components/product-form';
import type { Product, ProductVariant, ProductImage } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type CustomField = {
  field_id: string;
  field_name: string;
  description: string;
  value: string;
}

export default function EditProductPage() {
  const params = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<(Product & { variants: ProductVariant[], images: ProductImage[], custom_fields: CustomField[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const slug = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!slug) {
        setIsLoading(false);
        return;
    };
    
    async function getProduct() {
      setIsLoading(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/details/full/slug/?slug=${slug}`, { cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch product data');
        }
        const data = await response.json();
        setProduct({ ...data.product, variants: data.variants || [], images: data.images || [], custom_fields: data.custom_fields || [] });
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

  }, [slug, toast]);
  
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
