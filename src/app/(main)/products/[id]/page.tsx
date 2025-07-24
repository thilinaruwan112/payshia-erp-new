
'use client'

import { ProductForm } from '@/components/product-form';
import { useToast } from '@/hooks/use-toast';
import { type Product } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { id } = params;

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/products/${id}`);
        if (!response.ok) {
           if (response.status === 404) {
             notFound();
           }
          throw new Error('Failed to fetch product data');
        }
        const data = await response.json();
        setProduct({ ...data.product, variants: data.variants });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load product',
          description: 'Could not fetch product data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <Skeleton className="h-9 w-64" />
                 <Skeleton className="h-4 w-80 mt-2" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-24" />
            </div>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    // This can happen if fetch fails and it's not a 404, or if data is malformed
    // The notFound() would have been called for a 404.
    return <div>Could not load product data. It might have been deleted.</div>;
  }

  return <ProductForm product={product} />;
}
