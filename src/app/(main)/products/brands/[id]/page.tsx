
'use client'

import { BrandForm } from '@/components/brand-form';
import { useToast } from '@/hooks/use-toast';
import { type Brand } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditBrandPage({ params }: { params: { id: string } }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchBrand() {
      if (!params.id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/brands/${params.id}`);
        if (!response.ok) {
           if (response.status === 404) {
             notFound();
           }
          throw new Error('Failed to fetch brand data');
        }
        const data = await response.json();
        setBrand(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load brand',
          description: 'Could not fetch brand data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchBrand();
  }, [params.id, toast]);

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

  if (!brand) {
    // This can happen if fetch fails and it's not a 404, or if data is malformed
    // The notFound() would have been called for a 404.
    return <div>Could not load brand data. It might have been deleted.</div>;
  }

  return <BrandForm brand={brand} />;
}
