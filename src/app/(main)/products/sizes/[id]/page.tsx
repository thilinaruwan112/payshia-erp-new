
'use client'

import { SizeForm } from '@/components/size-form';
import { useToast } from '@/hooks/use-toast';
import { type Size } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EditSizePage({ params }: { params: { id: string } }) {
  const [size, setSize] = useState<Size | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSize() {
      if (!params.id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/sizes/${params.id}`);
        if (!response.ok) {
           if (response.status === 404) {
             notFound();
           }
          throw new Error('Failed to fetch size data');
        }
        const data = await response.json();
        setSize(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load size',
          description: 'Could not fetch size data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSize();
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
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!size) {
     return <div>Could not load size data. It might have been deleted.</div>;
  }


  return <SizeForm size={size} />;
}
